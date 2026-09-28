/**
 * Pipeline Shared Utilities
 * Pure functions used across all pipeline stages.
 */

import { createHash } from 'crypto'

// ── Source UUIDs (seeded in InsForge) ──────────────────────────────────────
export const SOURCE_UUIDS = {
  'encuentra24':            'ccfc07cc-def9-45f1-92c6-16f4d2b339c3',
  'banco-nacional':         'da63265c-fec1-4b35-9925-5825f6f32357',
  'caja-ahorros':           '5d6c2ad2-22f3-4d7a-a44d-433be7f9ce91',
  'bac-panama':             '95b2b994-e2b3-4334-b605-676817e58765',
  'banistmo':               '429261b7-ab2a-466c-8707-6ceba3a40a40',
  'banco-general':          '44db95bc-100a-4ff8-af9f-2816e37d7bac',
  'compreoalquile':         '8f3197b4-320a-422c-b472-bc3092bf9dac',
  'global-bank':            '06d3c511-afe2-4a6f-8ad6-962e6e5e55df',
  'multibank':              '79d9399a-7caa-40aa-b042-7a0a8f5f7592',
  'e24-autos':              '2d79ddc4-877c-4413-879a-3f871f087d1c',
  'banco-nacional-autos':   '2de274ad-7ab4-419e-b791-a8e862bbad16',
  'caja-ahorros-autos':     'e9f077bc-9fd7-4090-b2ca-f197694add96',
  'clasificar-pa':          'bb616cc9-2e8e-43d7-976a-612eda566d87',
  'carrocarros-pa':         '74335d43-b7d8-46cd-a386-e9e3c6a1d4ed',
  'superautos-pa':          '6a96bb1d-d6ec-4514-b1dc-7d634bcaf63e',
}

// ── Content Hash ───────────────────────────────────────────────────────────
export function computeContentHash(row) {
  const fields = {
    title: row.title,
    description: row.description,
    price_amount: row.price_amount,
    location: row.location,
    seller_type: row.seller_type,
    status: row.status,
    tags: row.tags,
  }
  return createHash('sha256')
    .update(JSON.stringify(fields, Object.keys(fields).sort()))
    .digest('hex')
}

// ── Grade from Score ──────────────────────────────────────────────────────
export function gradeForScore(score) {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  if (score >= 50) return 'C'
  if (score >= 40) return 'C-'
  return 'D'
}

// ── Investment Profile from Decision ─────────────────────────────────────
export function profileForDecision(action) {
  const map = {
    BUY_NOW:                'value_investment',
    WATCH_HIGH_PRIORITY:    'appreciation',
    NEGOTIATE:              'flip_opportunity',
    RESEARCH_MORE:          'high_risk_opportunity',
    AVOID:                  'high_risk_opportunity',
  }
  return map[action] || 'value_investment'
}

// ── Clean Title ───────────────────────────────────────────────────────────
export function cleanTitle(t) {
  return (t || '')
    .replace(/[\n\r]+|Compare this ad|Add to favorites/g, ' ')
    .replace(/for\s+sale/gi, 'en venta')
    .replace(/\bsale\s+of\b/gi, 'venta de')
    .replace(/\bin\s+/gi, ' en ')
    .replace(/Pre-Sale/gi, 'pre-venta')
    .replace(/Limited\s+inventory/gi, 'inventario limitado')
    .replace(/Contact\s+now/gi, 'contacte ahora')
    .replace(/\bApartment\b/gi, 'Apartamento')
    .replace(/\bPenthouse\b/gi, 'Penthouse')
    .replace(/\bHouse\b/gi, 'Casa')
    .replace(/\bPool\b/gi, 'Piscina')
    .replace(/\bGarden\b/gi, 'Jardín')
    .replace(/\bGarage\b/gi, 'Garaje')
    .replace(/\bTerrace\b/gi, 'Terraza')
    .replace(/\bBalcony\b/gi, 'Balcón')
    .replace(/\s+/g, ' ')
    .trim() || null
}

// ── Change Reason Detection ──────────────────────────────────────────────
export function computeChangeReason(existingRow, newRow, extra) {
  const changes = []
  if (existingRow.price_amount !== newRow.price_amount) changes.push('price_changed')
  if (existingRow.title !== newRow.title) changes.push('title_changed')
  if (existingRow.description !== newRow.description) changes.push('description_changed')
  if (JSON.stringify(existingRow.location) !== JSON.stringify(newRow.location)) changes.push('location_changed')
  if (existingRow.status !== newRow.status) changes.push('status_changed')
  if (existingRow.seller_type !== newRow.seller_type) changes.push('seller_type_changed')
  if (JSON.stringify(existingRow.tags || []) !== JSON.stringify(newRow.tags || [])) changes.push('tags_changed')
  if (extra) {
    if (extra.old_area_m2 !== extra.new_area_m2) changes.push('area_changed')
    if (extra.old_bedrooms !== extra.new_bedrooms) changes.push('bedrooms_changed')
    if (extra.old_bathrooms !== extra.new_bathrooms) changes.push('bathrooms_changed')
    if (extra.old_property_type !== extra.new_property_type) changes.push('property_type_changed')
  }
  if (changes.length > 1) return 'multiple_changes'
  return changes[0] || null
}

// ── Extract Area Fields from Asset ────────────────────────────────────────
// Used by Comparable Engine to parse area/beds/baths from description
export function extractAreaFields(asset) {
  const desc = asset.description || ''
  const rawArea = asset.area_m2 || asset.areaM2 || null
  const rawBeds = asset.bedrooms || null
  const rawBaths = asset.bathrooms || null
  return {
    area_m2: rawArea || parseFloat(desc.match(/(\d+)\s*m[²2]/i)?.[1]) || null,
    bedrooms: rawBeds || parseInt(desc.match(/(\d+)\s*(?:recámaras?|dormitorios?|bedrooms?|habitaciones?)/i)?.[1]) || null,
    bathrooms: rawBaths || parseInt(desc.match(/(\d+)\s*(?:baños?|bathrooms?)/i)?.[1]) || null,
  }
}

// ── Extract Extra Fields from Description (kept for backward compat) ─────────
export function extractExtraFields(asset) {
  const area = extractAreaFields(asset)
  return {
    ...area,
    property_type: asset.property_type || null,
  }
}

// ── Extract Vehicle Fields from Asset ────────────────────────────────────
// Used by Comparable Engine to parse make/model/year/mileage for vehicles
const COMMON_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Hyundai', 'Kia', 'Ford', 'Chevrolet',
  'Mitsubishi', 'Suzuki', 'Mazda', 'Isuzu', 'Mercedes-Benz', 'Mercedes',
  'BMW', 'Audi', 'Volkswagen', 'Jeep', 'Lexus', 'Subaru', 'Ram'
]

export function extractVehicleFields(asset) {
  const raw = asset.raw_data || {}
  const title = (asset.title || '').trim()
  const desc = (asset.description || '').trim()
  const text = `${title} ${desc}`

  // 1. Year
  let year = raw.year || null
  if (!year) {
    const yearMatch = text.match(/\b(19\d\d|20[0-2]\d)\b/)
    if (yearMatch) year = parseInt(yearMatch[1], 10)
  }

  // 2. Make
  let make = (raw.make || '').trim()
  if (!make) {
    for (const m of COMMON_MAKES) {
      const regex = new RegExp(`\\b${m}\\b`, 'i')
      if (regex.test(text)) {
        make = m.toLowerCase() === 'mercedes' ? 'Mercedes-Benz' : m
        break
      }
    }
  }

  // 3. Model
  let model = (raw.model || '').trim()
  if (!model && make) {
    const makeIdx = title.toLowerCase().indexOf(make.toLowerCase())
    if (makeIdx !== -1) {
      const afterMake = title.slice(makeIdx + make.length).trim()
      const parts = afterMake.split(/\s+/)
      const candidateModel = parts[0]?.replace(/[^\w-]/g, '')
      if (candidateModel && !/^\d{4}$/.test(candidateModel) && candidateModel.length > 1) {
        model = candidateModel
      }
    }
  }

  // 4. Mileage / Kilometraje
  let mileage = raw.mileage || null
  if (!mileage) {
    const kmMatch = text.match(/(\d{1,3}(?:[,\.]\d{3})*|\d+)\s*(?:km|kms|kil[oó]metros)\b/i)
    if (kmMatch) {
      const numStr = kmMatch[1].replace(/[,\.]/g, '')
      mileage = parseInt(numStr, 10)
    }
  }

  // 5. Transmission
  let transmission = raw.transmission || null
  if (!transmission) {
    if (/\b(autom[aá]tic[ao]|aut)\b/i.test(text)) transmission = 'Automática'
    else if (/\b(manual|mec[aá]nic[ao])\b/i.test(text)) transmission = 'Manual'
  }

  // 6. Fuel
  let fuel = raw.fuel || null
  if (!fuel) {
    if (/\b(di[eé]sel)\b/i.test(text)) fuel = 'Diésel'
    else if (/\b(gasolina)\b/i.test(text)) fuel = 'Gasolina'
    else if (/\b(h[ií]brid[ao])\b/i.test(text)) fuel = 'Híbrido'
    else if (/\b(el[eé]ctric[ao])\b/i.test(text)) fuel = 'Eléctrico'
  }

  return {
    make: make || null,
    model: model || null,
    year: year || null,
    mileage: mileage || null,
    transmission: transmission || null,
    fuel: fuel || null
  }
}

