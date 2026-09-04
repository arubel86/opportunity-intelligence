/**
 * Pipeline Stage: Normalizer
 * Transforms raw scraped listings into structured asset objects.
 */

import { geocodeLocation } from './geocoder.mjs'

const KNOWN_AGENCIES = [
  'GC REALTY', 'Global Advisors Real Estate', 'Keller Williams',
  'RE/MAX', 'Coldwell Banker', 'Century 21', 'ERA Real Estate',
  'Panama Realty', 'Casamar Realty', 'Royal Realty', 'Prime Panama Realty',
]

// ── Spanish translation maps ────────────────────────────────────
const EN_TO_ES_TITLE = [
  [/for\s+sale/gi, 'en venta'],
  [/pre-sale/gi, 'pre-venta'],
  [/new\s+project/gi, 'nuevo proyecto'],
  [/limited\s+inventory/gi, 'inventario limitado'],
  [/contact\s+now/gi, 'contacte ahora'],
  [/apartment/gi, 'apartamento'],
  [/penthouse/gi, 'penthouse'],
  [/bedroom/gi, 'dormitorio'],
  [/bedrooms/gi, 'dormitorios'],
  [/bathroom/gi, 'baño'],
  [/bathrooms/gi, 'baños'],
  [/parking/gi, 'estacionamiento'],
  [/square\s+meters/gi, 'metros cuadrados'],
  [/sqm/gi, 'm²'],
  [/lot/gi, 'lote'],
  [/house/gi, 'casa'],
  [/townhouse/gi, 'casa'],
  [/property/gi, 'propiedad'],
  [/commercial/gi, 'comercial'],
  [/beach\s*front/gi, 'frente a la playa'],
  [/ocean\s*view/gi, 'vista al mar'],
  [/mountain\s*view/gi, 'vista a la montaña'],
  [/gated\s+community/gi, 'comunidad cerrada'],
  [/condominium/gi, 'condominio'],
  [/building/gi, 'edificio'],
  [/development/gi, 'desarrollo'],
  [/investment/gi, 'inversión'],
  [/exclusive/gi, 'exclusivo'],
  [/boutique/gi, 'boutique'],
  [/tropical/gi, 'tropical'],
  [/lifestyle/gi, 'estilo de vida'],
  [/privacy/gi, 'privacidad'],
  [/spacious/gi, 'espacioso'],
  [/charming/gi, 'encantador'],
  [/residence/gi, 'residencia'],
  [/located\s+in/gi, 'ubicado en'],
  [/welcome/gi, 'bienvenido'],
  [/features/gi, 'características'],
  [/pool/gi, 'piscina'],
  [/garden/gi, 'jardín'],
  [/garage/gi, 'garaje'],
  [/terrace/gi, 'terraza'],
  [/balcony/gi, 'balcón'],
  [/studio/gi, 'estudio'],
  [/master\s+suite/gi, 'suite principal'],
  [/walk-in\s+closet/gi, 'vestidor'],
  [/laundry/gi, 'lavandería'],
  [/storage/gi, 'bodega'],
  [/security/gi, 'seguridad'],
  [/fully\s+furnished/gi, 'totalmente amueblado'],
  [/semi-furnished/gi, 'semi-amueblado'],
  [/unfurnished/gi, 'sin amueblar'],
  [/move-in\s+ready/gi, 'lista para mudarse'],
  [/under\s+construction/gi, 'en construcción'],
  [/newly\s+built/gi, 'nuevo'],
  [/remodeled/gi, 'remodelado'],
  [/renovated/gi, 'renovado'],
  [/elevator/gi, 'ascensor'],
  [/air\s+conditioning/gi, 'aire acondicionado'],
  [/central\s+a\/c/gi, 'aire central'],
  [/furnished/gi, 'amueblado'],
]

function translateTitleToSpanish(title = '') {
  if (!title) return ''
  let t = title
  for (const [pattern, replacement] of EN_TO_ES_TITLE) {
    t = t.replace(pattern, replacement)
  }
  return t
}

const PROPERTY_TYPE_ES = {
  apartment: 'apartamento',
  house: 'casa',
  land: 'terreno',
  commercial: 'local comercial',
  condo: 'condominio',
  townhouse: 'casa',
  studio: 'estudio',
  penthouse: 'penthouse',
  property: 'propiedad',
}

function translatePropertyType(type = '') {
  return PROPERTY_TYPE_ES[type.toLowerCase()] || type || 'propiedad'
}

/**
 * Try to extract agency name from the beginning of a messy title.
 */
function extractOwner(title = '') {
  if (!title) return { owner: '', cleanTitle: '' }
  // Check for known agencies at the start
  for (const agency of KNOWN_AGENCIES) {
    const idx = title.toUpperCase().indexOf(agency.toUpperCase())
    if (idx === 0) {
      const after = title.slice(agency.length).trim()
      // Sometimes the agency repeats or has junk after it — take the first meaningful phrase
      const parts = after.split(/[-–—|]/).filter(Boolean)
      return { owner: agency, cleanTitle: parts[0]?.trim() || after.slice(0, 80).trim() }
    }
  }
  // Generic: take first 1-3 words that look like a company name (all caps or title case)
  const words = title.split(' ')
  let ownerParts = []
  for (const w of words) {
    if (ownerParts.length >= 3) break
    if (/^[A-Z][A-Z\s]+$/.test(w) || /^[A-Z][a-z]+$/.test(w)) {
      if (w.length > 3) ownerParts.push(w)
    } else if (w.toLowerCase() === 'realty' || w.toLowerCase() === 'real' || w.toLowerCase() === 'estate') {
      ownerParts.push(w)
    } else if (ownerParts.length > 0) {
      break
    }
  }
  const owner = ownerParts.join(' ')
  const cleanTitle = title.replace(owner, '').trim().replace(/^[-–—|\s]+/, '').slice(0, 100)
  return { owner: owner.length > 3 ? owner : '', cleanTitle: cleanTitle || title.slice(0, 80) }
}

/**
 * Clean a scraped title: strip English marketing fluff, truncate to readable length.
 */
function cleanTitle(title = '') {
  if (!title) return ''
  // Remove common English marketing phrases
  let t = title
    .replace(/for\s+Sale\s*/gi, '')
    .replace(/Pre-Sale\s*/gi, '')
    .replace(/NEW\s+PROJECT\s*/gi, '')
    .replace(/Following\s+up\s+on\s+.*$/gi, '')
    .replace(/Limited\s+inventory.*$/gi, '')
    .replace(/Contact\s+now.*$/gi, '')
    .trim()
  // Translate remaining English to Spanish
  t = translateTitleToSpanish(t)
  // Remove trailing fragments after repeated text
  const lines = t.split('\n').filter(Boolean)
  return lines[0]?.slice(0, 100).trim() || t.slice(0, 100).trim()
}

/**
 * Normalize raw scraped listings into structured assets.
 * @param {object} ctx Pipeline context { listings, source, log, report }
 * @returns {Promise<Array>} Normalized asset objects
 */
export async function run(ctx) {
  const { listings, log, report } = ctx
  const normStart = Date.now()
  const logStage = log.module('NORMALIZER')
  logStage.section('NORMALIZATION')

  const normalized = listings.map((item, i) => {
    try {
      const loc = item.location || {}
      
      // Extract owner and clean title
      const { owner, cleanTitle: extractedTitle } = extractOwner(item.title || '')
      const finalTitle = extractedTitle || cleanTitle(item.title || '') || `Propiedad ${i + 1}`

      // Clean neighborhood
      let neighborhood = (loc.neighborhood || '')
        .replace(/Compare this ad\s*/gi, '')
        .replace(/Add to favorites\s*/gi, '')
        .trim()

      const isVehicle = ctx.source === 'e24-autos' || ctx.source === 'banco-nacional-autos' || ctx.source === 'caja-ahorros-autos' || ctx.source === 'clasificar-pa' || ctx.source === 'carrocarros-pa' || ctx.source === 'superautos-pa'
      const vertical = isVehicle ? 'vehicles' : 'real_estate'

      // Build structured raw_data for dashboard use
      const rawData = isVehicle ? {
        seller: item.seller || owner || '',
        make: item.make || '',
        model: item.model || '',
        year: parseInt(item.year) || 0,
        mileage: parseInt(item.mileage) || 0,
        scraped_at: item.scrapedAt || new Date().toISOString(),
        photos: item.raw_data?.photos || [],
      } : {
        seller: item.seller || owner || '',
        bedrooms: item.bedrooms || 0,
        bathrooms: item.bathrooms || 0,
        area_m2: item.areaM2 || 0,
        parking: item.parking || 0,
        property_type: translatePropertyType(item.propertyType || ''),
        scraped_at: item.scrapedAt || new Date().toISOString(),
        photos: item.raw_data?.photos || [],
      }

      // Derive stable source_listing_id (prioritize scraper-assigned ID)
      const urlStr = item.url || item.source_listing_url || ''
      const urlIdMatch = urlStr.match(/\/(\d{6,})(?:\?|$)/)
      
      let sourceListingId = item.id
      if (!sourceListingId) {
        sourceListingId = urlIdMatch
          ? `E24-${urlIdMatch[1]}`
          : `E24-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      }

      // Geocode location
      const geocoded = geocodeLocation({
        neighborhood: neighborhood,
        district: loc.district || item.district || '',
        province: loc.province || item.province || '',
        title: finalTitle,
        id: sourceListingId
      })

      return {
        asset_id: sourceListingId, // used downstream as source_listing_id
        source_id: ctx.source,
        vertical: vertical,
        status: 'active',
        price_currency: item.currency || item.price_currency || 'USD',
        title: finalTitle,
        owner_name: owner || item.seller || '',
        price_amount: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
        location: {
          province: geocoded.province || loc.province || '',
          district: geocoded.district || loc.district || item.district || '',
          neighborhood: neighborhood,
          corregimiento: neighborhood || geocoded.district || loc.district || '',
          lat: geocoded.lat,
          lng: geocoded.lng,
        },
        description: item.description || '',
        seller_type: item.seller_type || (owner ? 'agent' : 'owner'),
        tags: item.tags || item.features || [],
        source_listing_url: item.url || item.source_listing_url || '',
        raw_data: rawData,
      }
    } catch (err) {
      report.normalizer.errors++
      return null
    }
  }).filter(Boolean)

  report.normalizer.processed = normalized.length
  report.normalizer.duration_ms = Date.now() - normStart
  logStage.stats({
    'Assets normalized': report.normalizer.processed,
    Errors: report.normalizer.errors || '0',
    'Normalization time': log.module().duration(report.normalizer.duration_ms),
  })

  return normalized
}
