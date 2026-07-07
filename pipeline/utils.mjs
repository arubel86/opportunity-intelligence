/**
 * Pipeline Shared Utilities
 * Pure functions used across all pipeline stages.
 */

import { createHash } from 'crypto'

// ── Source UUIDs (seeded in Supabase) ─────────────────────────────────────
export const SOURCE_UUIDS = {
  encuentra24:        '89ee5ff1-e448-4ef5-83eb-31252bd89806',
  'banco-nacional':   '36553830-0a7e-4d6a-96a5-a061773a7da9',
  'caja-ahorros':     '01045869-2ef5-4431-80f9-2924fd6e848f',
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
