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

import { extractAreaFields, extractVehicleFields } from './utils.mjs'
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
  const isVehicle = vertical === 'vehicles'
  const loc = asset.location || {}
  const district = (loc.district || '').trim()
  const province = (loc.province || '').trim()
  const neighborhood = (loc.neighborhood || '').trim()
  const sourceId = asset.source_id || ''
  const selfListingId = asset.asset_id || asset.source_listing_id || ''

  // Parse area/beds/baths for real estate
  const extracted = isVehicle ? {} : extractAreaFields(asset)
  const areaM2 = extracted.area_m2 || null
  const bedrooms = extracted.bedrooms || null
  const bathrooms = extracted.bathrooms || null

  // Parse automotive fields if vehicle
  const targetVeh = isVehicle ? extractVehicleFields(asset) : null

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

    // Metric Distance (Haversine km)
    const distanceKm = calculateHaversineDistanceKm(targetGeo.lat, targetGeo.lng, cGeo.lat, cGeo.lng)
    const cPrice = parseFloat(c.price_amount) || 0

    // Recency (common for both verticals)
    const scrapedAt = c.scraped_at ? new Date(c.scraped_at) : null
    const now = new Date()
    let recencyScore = 0.5
    if (scrapedAt) {
      const ageDays = (now - scrapedAt) / (1000 * 60 * 60 * 24)
      recencyScore = Math.max(0, Math.min(1, 1 - ageDays / 90))
    }
    const ageDays = scrapedAt ? Math.round((now - scrapedAt) / (1000 * 60 * 60 * 24)) : null

    // Price similarity factor (common)
    let priceScore = 0
    if (cPrice > 0 && price > 0) {
      const ratio = Math.min(cPrice, price) / Math.max(cPrice, price)
      priceScore = Math.max(0, Math.min(1, ratio * 2 - 0.5))
    }

    // ─────────────────────────────────────────────────────────────
    // RAMA 1: VEHÍCULOS (Opción A: Marca/Modelo, Año, Km, Precio)
    // ─────────────────────────────────────────────────────────────
    if (isVehicle) {
      const cVeh = extractVehicleFields(c)

      // 1. MAKE & MODEL MATCH (weight: 0.35)
      let makeModelScore = 0.20
      const targetMake = (targetVeh.make || '').toLowerCase()
      const cMake = (cVeh.make || '').toLowerCase()
      const targetModel = (targetVeh.model || '').toLowerCase()
      const cModel = (cVeh.model || '').toLowerCase()

      if (targetMake && cMake) {
        if (targetMake === cMake) {
          if (targetModel && cModel && targetModel === cModel) {
            makeModelScore = 1.0 // Misma marca y modelo exacto (ej. Toyota Hilux)
          } else if (targetModel && cModel) {
            makeModelScore = 0.45 // Misma marca, distinto modelo (ej. Toyota Fortuner vs Hilux)
          } else {
            makeModelScore = 0.70 // Misma marca, modelo no especificado
          }
        } else {
          makeModelScore = 0.10 // Distinta marca
        }
      } else {
        // Fallback por análisis de coincidencia en título
        const tLower = (asset.title || '').toLowerCase()
        const cTitleLower = (c.title || '').toLowerCase()
        const commonWords = tLower.split(/\s+/).filter(w => w.length > 3 && cTitleLower.includes(w))
        makeModelScore = commonWords.length >= 2 ? 0.75 : (commonWords.length === 1 ? 0.40 : 0.20)
      }

      // 2. YEAR SIMILARITY (weight: 0.25)
      let yearScore = 0.50
      if (targetVeh.year && cVeh.year) {
        const yearDiff = Math.abs(targetVeh.year - cVeh.year)
        if (yearDiff === 0) yearScore = 1.0
        else if (yearDiff === 1) yearScore = 0.85
        else if (yearDiff === 2) yearScore = 0.70
        else if (yearDiff === 3) yearScore = 0.55
        else if (yearDiff === 4) yearScore = 0.40
        else yearScore = Math.max(0.10, 0.40 - (yearDiff - 4) * 0.08)
      }

      // 3. MILEAGE / KILOMETRAJE (weight: 0.20)
      let mileageScore = 0.50
      if (targetVeh.mileage && cVeh.mileage && targetVeh.mileage > 0 && cVeh.mileage > 0) {
        const kmRatio = Math.min(targetVeh.mileage, cVeh.mileage) / Math.max(targetVeh.mileage, cVeh.mileage)
        mileageScore = Math.max(0, Math.min(1, kmRatio * 2 - 0.4))
      }

      // 4. UBICACIÓN & RECENCIA (weight: 0.05)
      const provScore = (selfProv && cProv && selfProv === cProv) ? 1.0 : 0.70
      const locRecencyScore = provScore * 0.5 + recencyScore * 0.5

      // Factor de gating de marca: si la marca es completamente diferente, se penaliza drásticamente el composite
      let brandGate = 1.0
      if (targetMake && cMake) {
        if (targetMake !== cMake) {
          brandGate = 0.40 // Distinta marca: nunca puede ser un comparable fiable
        } else if (targetModel && cModel && targetModel !== cModel) {
          brandGate = 0.65 // Misma marca pero distinto modelo (ej. Hilux vs Yaris)
        }
      }

      const rawComposite = (
        makeModelScore   * 0.35 +
        yearScore        * 0.25 +
        mileageScore     * 0.20 +
        priceScore       * 0.15 +
        locRecencyScore  * 0.05
      )

      // Calidad ponderada para vehículos
      const qualityScore = Math.round(rawComposite * brandGate * 100) / 100

      const matchReason = buildVehicleMatchReason(targetVeh, cVeh, distanceKm)

      return {
        comp_asset_id: c.asset_id,
        price: cPrice,
        title: c.title,
        location: { ...cLoc, lat: cGeo.lat, lng: cGeo.lng },
        distance_km: distanceKm,
        age_days: ageDays,
        quality_score: qualityScore,
        similarity_factors: {
          make_model: makeModelScore,
          year: yearScore,
          mileage: mileageScore,
          price: priceScore,
          recency: recencyScore,
        },
        match_reason: matchReason,
      }
    }

    // ─────────────────────────────────────────────────────────────
    // RAMA 2: BIENES RAÍCES (Fórmula Inmobiliaria Original)
    // ─────────────────────────────────────────────────────────────
    const cExtracted = extractAreaFields(c)
    const cArea = cExtracted.area_m2 || null
    const cBeds = cExtracted.bedrooms || null
    const cBaths = cExtracted.bathrooms || null

    // 1. LOCATION MATCH (weight: 0.30)
    let locationScore = 0
    if (distanceKm <= 1.0) locationScore = 1.0
    else if (distanceKm <= 3.0) locationScore = 0.85
    else if (distanceKm <= 7.0) locationScore = 0.65
    else if (distanceKm <= 20.0) locationScore = 0.40
    else locationScore = 0.15

    // 2. AREA SIMILARITY (weight: 0.20)
    let areaScore = 0.5
    if (areaM2 && cArea && areaM2 > 0 && cArea > 0) {
      const areaRatio = Math.min(areaM2, cArea) / Math.max(areaM2, cArea)
      areaScore = Math.max(0, Math.min(1, areaRatio * 2 - 0.3))
    }

    // 3. BEDROOM MATCH (weight: 0.10)
    let bedScore = 0.5
    if (bedrooms !== null && cBeds !== null && bedrooms > 0 && cBeds > 0) {
      bedScore = bedrooms === cBeds ? 1.0 : (Math.abs(bedrooms - cBeds) <= 1 ? 0.7 : 0.3)
    }

    // 4. BATHROOM MATCH (weight: 0.10)
    let bathScore = 0.5
    if (bathrooms !== null && cBaths !== null && bathrooms > 0 && cBaths > 0) {
      bathScore = bathrooms === cBaths ? 1.0 : (Math.abs(bathrooms - cBaths) <= 1 ? 0.7 : 0.3)
    }

    // Weighted composite inmobiliario
    const qualityScore = Math.round(
      (locationScore * 0.30 +
       priceScore     * 0.25 +
       areaScore      * 0.20 +
       bedScore       * 0.10 +
       bathScore      * 0.10 +
       recencyScore   * 0.05) * 100
    ) / 100

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

function buildVehicleMatchReason(targetVeh, cVeh, distanceKm) {
  const parts = []
  if (targetVeh && cVeh) {
    if (targetVeh.make && cVeh.make && targetVeh.make.toLowerCase() === cVeh.make.toLowerCase()) {
      if (targetVeh.model && cVeh.model && targetVeh.model.toLowerCase() === cVeh.model.toLowerCase()) {
        parts.push(`Misma marca y modelo (${targetVeh.make} ${targetVeh.model})`)
      } else {
        parts.push(`Misma marca (${targetVeh.make})`)
      }
    }
    if (targetVeh.year && cVeh.year) {
      const d = Math.abs(targetVeh.year - cVeh.year)
      parts.push(d === 0 ? `Mismo año (${targetVeh.year})` : `Año ${cVeh.year} (dif. ${d}a)`)
    }
    if (targetVeh.mileage && cVeh.mileage) {
      parts.push(`Km: ${Math.round(cVeh.mileage / 1000)}k vs ${Math.round(targetVeh.mileage / 1000)}k`)
    }
  }
  if (distanceKm != null && distanceKm <= 15.0) {
    parts.push(`mismo mercado (${distanceKm} km)`)
  }
  return parts.join(', ') || 'Vehículo de segmento similar'
}

