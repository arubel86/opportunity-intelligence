/**
 * Pipeline Stage: Comparable Engine
 * Replaces the old generateComparables() mock generator.
 *
 * Queries Supabase for REAL comparable assets based on:
 *  - Same vertical (apartment ↔ apartment, house ↔ house)
 *  - Same geographic zone
 *  - Similar price per m² range
 *  - Proximity metrics (location match, area similarity, recency)
 *
 * Each comparable gets a quality_score [0..1] based on weighted factors.
 * Low-quality comparables (< 0.3) are excluded.
 * Results are stored in the `comparisons` table.
 */

import { extractAreaFields } from './utils.mjs'
import { calculateHaversineDistanceKm, geocodeLocation } from './geocoder.mjs'

/**
 * Find real comparable assets from Supabase for a given asset.
 * @param {object} asset - Normalized asset object
 * @param {object} supabase - Supabase JS client (authenticated)
 * @returns {Promise<Array>} Array of comparable objects
 */
export async function findComparables(asset, supabase) {
  // Safety: if no supabase client, return empty array
  if (!supabase || !asset) return []

  const price = asset.price_amount || 0
  if (!price) return []

  const vertical = asset.vertical || 'real_estate'
  const loc = asset.location || {}
  const district = (loc.district || '').trim()
  const province = (loc.province || '').trim()
  const neighborhood = (loc.neighborhood || '').trim()
  const sourceId = asset.source_id || ''
  const selfListingId = asset.asset_id || asset.source_listing_id || ''

  // Parse area/beds/baths from asset description if not directly available
  const extracted = extractAreaFields(asset)
  const areaM2 = extracted.area_m2 || null
  const bedrooms = extracted.bedrooms || null
  const bathrooms = extracted.bathrooms || null

  // ── Query pool candidates from DB ───────────────────────────────────
  const candidates = await queryCandidatePool(supabase, {
    vertical, price, district, province, neighborhood, sourceId,
    selfListingId,
  })
  if (!candidates || candidates.length === 0) return []

  // Resolve target coordinates
  const targetGeo = (loc.lat && loc.lng)
    ? { lat: loc.lat, lng: loc.lng }
    : geocodeLocation({ neighborhood, district, province, title: asset.title, id: selfListingId })

  // ── Score each candidate as a comparable ────────────────────────────
  const scored = candidates.map(c => {
    const cLoc = (c.location || {})
    const cDist = (cLoc.district || '').trim().toLowerCase()
    const cProv = (cLoc.province || '').trim().toLowerCase()
    const cNeigh = (cLoc.neighborhood || '').trim().toLowerCase()
    const selfNeigh = neighborhood.toLowerCase()
    const selfDist = district.toLowerCase()
    const selfProv = province.toLowerCase()

    // Resolve candidate coordinates
    const cGeo = (cLoc.lat && cLoc.lng)
      ? { lat: cLoc.lat, lng: cLoc.lng }
      : geocodeLocation({ neighborhood: cNeigh, district: cDist, province: cProv, title: c.title, id: c.asset_id })

    // ── Metric Distance (Haversine km) ───────────────────────────
    const distanceKm = calculateHaversineDistanceKm(targetGeo.lat, targetGeo.lng, cGeo.lat, cGeo.lng)

    // Parse candidate's area/beds
    const cExtracted = extractAreaFields(c)
    const cArea = cExtracted.area_m2 || null
    const cBeds = cExtracted.bedrooms || null
    const cBaths = cExtracted.bathrooms || null

    const cPrice = parseFloat(c.price_amount) || 0

    // ── Factor scores [0..1] ──────────────────────────────────────

    // 1. LOCATION MATCH (weight: 0.30) - Based on Real Metric Distance
    let locationScore = 0
    if (distanceKm <= 1.0) {
      locationScore = 1.0
    } else if (distanceKm <= 3.0) {
      locationScore = 0.85
    } else if (distanceKm <= 7.0) {
      locationScore = 0.65
    } else if (distanceKm <= 20.0) {
      locationScore = 0.40
    } else {
      locationScore = 0.15
    }

    // 2. PRICE SIMILARITY (weight: 0.25)
    // How close is candidate's price to target price (ratio)
    let priceScore = 0
    if (cPrice > 0 && price > 0) {
      const ratio = Math.min(cPrice, price) / Math.max(cPrice, price)
      priceScore = Math.max(0, Math.min(1, ratio * 2 - 0.5)) // 0.5 ratio → 0.5, 0.75 ratio → 1.0
    }

    // 3. AREA SIMILARITY (weight: 0.20)
    let areaScore = 0.5 // neutral default if no data
    if (areaM2 && cArea && areaM2 > 0 && cArea > 0) {
      const areaRatio = Math.min(areaM2, cArea) / Math.max(areaM2, cArea)
      areaScore = Math.max(0, Math.min(1, areaRatio * 2 - 0.3)) // 0.65 ratio → 1.0
    }

    // 4. BEDROOM MATCH (weight: 0.10)
    let bedScore = 0.5
    if (bedrooms !== null && cBeds !== null && bedrooms > 0 && cBeds > 0) {
      bedScore = bedrooms === cBeds ? 1.0 : (Math.abs(bedrooms - cBeds) <= 1 ? 0.7 : 0.3)
    }

    // 5. BATHROOM MATCH (weight: 0.10)
    let bathScore = 0.5
    if (bathrooms !== null && cBaths !== null && bathrooms > 0 && cBaths > 0) {
      bathScore = bathrooms === cBaths ? 1.0 : (Math.abs(bathrooms - cBaths) <= 1 ? 0.7 : 0.3)
    }

    // 6. RECENCY (weight: 0.05)
    let recencyScore = 0.5
    const scrapedAt = c.scraped_at ? new Date(c.scraped_at) : null
    const now = new Date()
    if (scrapedAt) {
      const ageDays = (now - scrapedAt) / (1000 * 60 * 60 * 24)
      recencyScore = Math.max(0, Math.min(1, 1 - ageDays / 90)) // decays over 90 days
    }

    // ── Weighted composite ────────────────────────────────────────
    const qualityScore = Math.round(
      (locationScore * 0.30 +
       priceScore     * 0.25 +
       areaScore      * 0.20 +
       bedScore       * 0.10 +
       bathScore      * 0.10 +
       recencyScore   * 0.05) * 100
    ) / 100

    // ── Age in days ───────────────────────────────────────────────
    const ageDays = scrapedAt
      ? Math.round((now - scrapedAt) / (1000 * 60 * 60 * 24))
      : null

    // ── Match reason ──────────────────────────────────────────────
    const matchReason = buildMatchReason(
      { neighborhood: selfNeigh, district: selfDist, province: selfProv },
      { neighborhood: cNeigh, district: cDist, province: cProv },
      vertical, areaM2, cArea, distanceKm
    )

    return {
      comp_asset_id: c.asset_id,
      price: cPrice,
      title: c.title,
      location: { ...cLoc, lat: cGeo.lat, lng: cGeo.lng },
      distance_km: distanceKm,
      age_days: ageDays,
      quality_score: qualityScore,
      similarity_factors: {
        location: locationScore,
        price: priceScore,
        area: areaScore,
        bedrooms: bedScore,
        bathrooms: bathScore,
        recency: recencyScore,
      },
      match_reason: matchReason,
    }
  })

  // ── Filter low quality, sort, limit ────────────────────────────
  const filtered = scored
    .filter(c => c.quality_score >= 0.30)
    .sort((a, b) => b.quality_score - a.quality_score)
    .slice(0, 10)

  return filtered
}

// ── Internal Helpers ─────────────────────────────────────────────────────

async function queryCandidatePool(supabase, { vertical, price, district, province, neighborhood, sourceId, selfListingId }) {
  // We query assets with:
  // - Same vertical
  // - Active status
  // - Price within 30%-200% of target price
  // - Has a price_amount set
  // NOTE: We exclude self by source_listing_id (post-filter), not asset_id (UUID),
  //   because the in-memory asset_id at scoring time is the ephemeral source_listing_id
  //   (e.g. 'E24-...') and PostgREST will 400-reject any .neq('asset_id', non-uuid).
  const priceMin = Math.round(price * 0.30)
  const priceMax = Math.round(price * 2.0)

  const baseSelect = 'asset_id, source_listing_id, title, description, location, price_amount, price_currency, seller_type, vertical, status, scraped_at, raw_data, tags'

  // ── Try to narrow by location ────────────────────────────────────
  // Attempt location-based narrowing (prefer neighbourhood → district → province)
  // Use ilike for case-insensitive match (DB stores mixed-case strings).
  let narrowField = null
  let narrowValue = null

  if (neighborhood) {
    narrowField = 'location->>neighborhood'
    narrowValue = neighborhood
  } else if (district) {
    narrowField = 'location->>district'
    narrowValue = district
  } else if (province) {
    narrowField = 'location->>province'
    narrowValue = province
  }

  if (narrowField && narrowValue) {
    const { data: narrowed, error: narrowErr } = await supabase
      .from('assets')
      .select(baseSelect)
      .eq('vertical', vertical)
      .eq('status', 'active')
      .gte('price_amount', priceMin)
      .lte('price_amount', priceMax + price) // wider range for location filter
      .ilike(narrowField, narrowValue)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!narrowErr && narrowed && narrowed.length >= 5) {
      // Enough candidates with location match — exclude self and use these
      return narrowed.filter(a => a.source_listing_id !== selfListingId)
    }
    // Fall through to broader query
  }

  // Broader query — no location narrowing
  const { data: results, error: broadErr } = await supabase
    .from('assets')
    .select(baseSelect)
    .eq('vertical', vertical)
    .eq('status', 'active')
    .gte('price_amount', priceMin)
    .lte('price_amount', priceMax)
    .order('created_at', { ascending: false })
    .limit(100)

  if (broadErr || !results) return []
  // Exclude self by source_listing_id (post-filter)
  return results.filter(a => a.source_listing_id !== selfListingId)
}

function buildMatchReason(locA, locB, vertical, areaA, areaB, distanceKm) {
  const vertLabel = vertical === 'real_estate' ? 'misma categoría' : vertical
  const parts = [vertLabel]
  if (distanceKm != null && distanceKm <= 1.5) parts.push(`a ${distanceKm} km (mismo sector)`)
  else if (distanceKm != null && distanceKm <= 10.0) parts.push(`a ${distanceKm} km`)
  if (areaA && areaB) parts.push(`dif. área: ${Math.abs(areaA - areaB)}m²`)
  return parts.join(', ')
}
