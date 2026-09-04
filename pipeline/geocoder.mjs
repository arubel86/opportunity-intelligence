/**
 * Pipeline Stage: Geocoder & Geospatial Engine
 * Provides geolocation mapping for Panama assets and precise metric distance calculation.
 */

// ── Catálogo Geográfico Optimizado de Panamá ──────────────────────────────
export const PANAMA_GEO_CATALOG = {
  // Panamá Centro
  'bella vista':        { lat: 8.9824, lng: -79.5218, province: 'Panamá', district: 'Panamá' },
  'obarrio':            { lat: 8.9870, lng: -79.5170, province: 'Panamá', district: 'Panamá' },
  'el cangrejo':        { lat: 8.9895, lng: -79.5260, province: 'Panamá', district: 'Panamá' },
  'marbella':           { lat: 8.9770, lng: -79.5180, province: 'Panamá', district: 'Panamá' },
  'punta pacifica':     { lat: 8.9760, lng: -79.5080, province: 'Panamá', district: 'Panamá' },
  'punta pacífica':     { lat: 8.9760, lng: -79.5080, province: 'Panamá', district: 'Panamá' },
  'punta paitilla':     { lat: 8.9740, lng: -79.5160, province: 'Panamá', district: 'Panamá' },
  'san francisco':      { lat: 8.9890, lng: -79.4985, province: 'Panamá', district: 'Panamá' },
  'costa del este':     { lat: 9.0150, lng: -79.4700, province: 'Panamá', district: 'Panamá' },
  'santa maria':        { lat: 9.0280, lng: -79.4580, province: 'Panamá', district: 'Panamá' },
  'santa maría':        { lat: 9.0280, lng: -79.4580, province: 'Panamá', district: 'Panamá' },
  'coco del mar':       { lat: 8.9830, lng: -79.4920, province: 'Panamá', district: 'Panamá' },
  'parque lefevre':     { lat: 9.0070, lng: -79.4890, province: 'Panamá', district: 'Panamá' },
  'pueblo nuevo':       { lat: 9.0080, lng: -79.5120, province: 'Panamá', district: 'Panamá' },
  'hato pintado':       { lat: 9.0140, lng: -79.5050, province: 'Panamá', district: 'Panamá' },
  'betania':            { lat: 9.0060, lng: -79.5310, province: 'Panamá', district: 'Panamá' },
  'el dorado':          { lat: 9.0090, lng: -79.5350, province: 'Panamá', district: 'Panamá' },
  'dos mares':          { lat: 9.0150, lng: -79.5370, province: 'Panamá', district: 'Panamá' },
  'ancon':              { lat: 8.9720, lng: -79.5530, province: 'Panamá', district: 'Panamá' },
  'ancón':              { lat: 8.9720, lng: -79.5530, province: 'Panamá', district: 'Panamá' },
  'clayton':            { lat: 9.0050, lng: -79.5780, province: 'Panamá', district: 'Panamá' },
  'albrook':            { lat: 8.9750, lng: -79.5500, province: 'Panamá', district: 'Panamá' },
  'san felipe':         { lat: 8.9525, lng: -79.5342, province: 'Panamá', district: 'Panamá' },
  'casco viejo':        { lat: 8.9525, lng: -79.5342, province: 'Panamá', district: 'Panamá' },
  'casco antiguo':      { lat: 8.9525, lng: -79.5342, province: 'Panamá', district: 'Panamá' },
  'calidonia':          { lat: 8.9680, lng: -79.5350, province: 'Panamá', district: 'Panamá' },
  'santa ana':          { lat: 8.9580, lng: -79.5400, province: 'Panamá', district: 'Panamá' },
  'curundu':            { lat: 8.9750, lng: -79.5420, province: 'Panamá', district: 'Panamá' },
  'rio abajo':          { lat: 9.0180, lng: -79.4970, province: 'Panamá', district: 'Panamá' },
  'río abajo':          { lat: 9.0180, lng: -79.4970, province: 'Panamá', district: 'Panamá' },
  'juan diaz':          { lat: 9.0200, lng: -79.4650, province: 'Panamá', district: 'Panamá' },
  'juan díaz':          { lat: 9.0200, lng: -79.4650, province: 'Panamá', district: 'Panamá' },
  'pedregal':           { lat: 9.0560, lng: -79.4310, province: 'Panamá', district: 'Panamá' },
  'tocumen':            { lat: 9.0780, lng: -79.3830, province: 'Panamá', district: 'Panamá' },
  '24 de diciembre':    { lat: 9.0880, lng: -79.3620, province: 'Panamá', district: 'Panamá' },
  'pacora':             { lat: 9.0780, lng: -79.2900, province: 'Panamá', district: 'Panamá' },
  'san miguelito':      { lat: 9.0350, lng: -79.5020, province: 'Panamá', district: 'San Miguelito' },
  'brisas del golf':    { lat: 9.0520, lng: -79.4680, province: 'Panamá', district: 'San Miguelito' },
  'villa lucre':        { lat: 9.0380, lng: -79.4820, province: 'Panamá', district: 'San Miguelito' },

  // Panamá Oeste
  'la chorrera':        { lat: 8.8800, lng: -79.7820, province: 'Panamá Oeste', district: 'La Chorrera' },
  'barrio balboa':      { lat: 8.8780, lng: -79.7800, province: 'Panamá Oeste', district: 'La Chorrera' },
  'guadalupe':          { lat: 8.8850, lng: -79.7900, province: 'Panamá Oeste', district: 'La Chorrera' },
  'playa leona':        { lat: 8.8400, lng: -79.7900, province: 'Panamá Oeste', district: 'La Chorrera' },
  'herrera':            { lat: 8.8700, lng: -79.8100, province: 'Panamá Oeste', district: 'La Chorrera' },
  'la valdeza':         { lat: 8.8680, lng: -79.8050, province: 'Panamá Oeste', district: 'La Chorrera' },
  'arraijan':           { lat: 8.9500, lng: -79.6500, province: 'Panamá Oeste', district: 'Arraiján' },
  'arraiján':           { lat: 8.9500, lng: -79.6500, province: 'Panamá Oeste', district: 'Arraiján' },
  'burunga':            { lat: 8.9680, lng: -79.6450, province: 'Panamá Oeste', district: 'Arraiján' },
  'vacamonte':          { lat: 8.8950, lng: -79.6700, province: 'Panamá Oeste', district: 'Arraiján' },
  'vista alegre':       { lat: 8.9300, lng: -79.6950, province: 'Panamá Oeste', district: 'Arraiján' },
  'capira':             { lat: 8.7550, lng: -79.8750, province: 'Panamá Oeste', district: 'Capira' },
  'chame':              { lat: 8.5800, lng: -79.8700, province: 'Panamá Oeste', district: 'Chame' },
  'coronado':           { lat: 8.5300, lng: -79.8800, province: 'Panamá Oeste', district: 'Chame' },
  'gorgona':            { lat: 8.5550, lng: -79.8650, province: 'Panamá Oeste', district: 'Chame' },
  'san carlos':         { lat: 8.4800, lng: -79.9500, province: 'Panamá Oeste', district: 'San Carlos' },

  // Colón
  'colon':              { lat: 9.3540, lng: -79.9000, province: 'Colón', district: 'Colón' },
  'colón':              { lat: 9.3540, lng: -79.9000, province: 'Colón', district: 'Colón' },
  'barrio sur':         { lat: 9.3550, lng: -79.9010, province: 'Colón', district: 'Colón' },
  'barrio norte':       { lat: 9.3620, lng: -79.9010, province: 'Colón', district: 'Colón' },
  'cristobal':          { lat: 9.3400, lng: -79.8900, province: 'Colón', district: 'Colón' },
  'cristóbal':          { lat: 9.3400, lng: -79.8900, province: 'Colón', district: 'Colón' },
  'zona libre':         { lat: 9.3580, lng: -79.8800, province: 'Colón', district: 'Colón' },
  'sabanitas':          { lat: 9.3450, lng: -79.8000, province: 'Colón', district: 'Colón' },

  // Chiriquí
  'david':              { lat: 8.4270, lng: -82.4300, province: 'Chiriquí', district: 'David' },
  'david centro':       { lat: 8.4270, lng: -82.4300, province: 'Chiriquí', district: 'David' },
  'los algarrobos':     { lat: 8.4800, lng: -82.4300, province: 'Chiriquí', district: 'Dolega' },
  'dolega':             { lat: 8.5600, lng: -82.4200, province: 'Chiriquí', district: 'Dolega' },
  'boquete':            { lat: 8.7800, lng: -82.4400, province: 'Chiriquí', district: 'Boquete' },
  'bajo boquete':       { lat: 8.7800, lng: -82.4400, province: 'Chiriquí', district: 'Boquete' },
  'alto boquete':       { lat: 8.7400, lng: -82.4300, province: 'Chiriquí', district: 'Boquete' },
  'volcan':             { lat: 8.7720, lng: -82.6380, province: 'Chiriquí', district: 'Tierras Altas' },
  'volcán':             { lat: 8.7720, lng: -82.6380, province: 'Chiriquí', district: 'Tierras Altas' },
  'cerro punta':        { lat: 8.8500, lng: -82.5700, province: 'Chiriquí', district: 'Tierras Altas' },
  'puerto armuelles':   { lat: 8.2800, lng: -82.8600, province: 'Chiriquí', district: 'Barú' },

  // Coclé
  'penonome':           { lat: 8.5180, lng: -80.3550, province: 'Coclé', district: 'Penonomé' },
  'penonomé':           { lat: 8.5180, lng: -80.3550, province: 'Coclé', district: 'Penonomé' },
  'anton':              { lat: 8.4900, lng: -80.2600, province: 'Coclé', district: 'Antón' },
  'antón':              { lat: 8.4900, lng: -80.2600, province: 'Coclé', district: 'Antón' },
  'playa blanca':       { lat: 8.3500, lng: -80.1400, province: 'Coclé', district: 'Antón' },
  'rio hato':           { lat: 8.3750, lng: -80.1650, province: 'Coclé', district: 'Antón' },
  'el valle':           { lat: 8.6000, lng: -80.1300, province: 'Coclé', district: 'Antón' },
  'aguadulce':          { lat: 8.2400, lng: -80.5450, province: 'Coclé', district: 'Aguadulce' },

  // Provincias Centrales
  'santiago':           { lat: 8.1020, lng: -80.9700, province: 'Veraguas', district: 'Santiago' },
  'chitre':             { lat: 7.9620, lng: -80.4280, province: 'Herrera', district: 'Chitré' },
  'chitré':             { lat: 7.9620, lng: -80.4280, province: 'Herrera', district: 'Chitré' },
  'las tablas':         { lat: 7.7660, lng: -80.2800, province: 'Los Santos', district: 'Las Tablas' },
  'pedasi':             { lat: 7.5300, lng: -80.0300, province: 'Los Santos', district: 'Pedasí' },
  'pedasí':             { lat: 7.5300, lng: -80.0300, province: 'Los Santos', district: 'Pedasí' },
  'bocas del toro':     { lat: 9.3300, lng: -82.2400, province: 'Bocas del Toro', district: 'Bocas del Toro' },
}

export const PROVINCE_FALLBACK_GEO = {
  'panama':             { lat: 8.9950, lng: -79.5100 },
  'panamá':             { lat: 8.9950, lng: -79.5100 },
  'panama oeste':       { lat: 8.8800, lng: -79.7800 },
  'panamá oeste':       { lat: 8.8800, lng: -79.7800 },
  'colon':              { lat: 9.3540, lng: -79.9000 },
  'colón':              { lat: 9.3540, lng: -79.9000 },
  'chiriqui':           { lat: 8.4300, lng: -82.4300 },
  'chiriquí':           { lat: 8.4300, lng: -82.4300 },
  'cocle':              { lat: 8.5200, lng: -80.3500 },
  'coclé':              { lat: 8.5200, lng: -80.3500 },
  'veraguas':           { lat: 8.1020, lng: -80.9700 },
  'herrera':            { lat: 7.9620, lng: -80.4280 },
  'los santos':         { lat: 7.7660, lng: -80.2800 },
  'bocas del toro':     { lat: 9.3300, lng: -82.2400 },
  'darien':             { lat: 8.3500, lng: -77.9000 },
  'darién':             { lat: 8.3500, lng: -77.9000 },
}

// In-memory cache for resolved locations
const GEO_CACHE = new Map()

/**
 * Resuelve las coordenadas lat/lng para un conjunto de parámetros de ubicación
 * @param {object} locData { neighborhood, district, province, title, id }
 * @returns {object} { lat, lng, formattedAddress, source: 'catalog' | 'fallback' }
 */
export function geocodeLocation(locData = {}) {
  const neigh = (locData.neighborhood || '').toLowerCase().trim()
  const dist = (locData.district || '').toLowerCase().trim()
  const prov = (locData.province || '').toLowerCase().trim()
  const title = (locData.title || '').toLowerCase()

  const cacheKey = `${neigh}|${dist}|${prov}`
  if (GEO_CACHE.has(cacheKey)) {
    const cached = GEO_CACHE.get(cacheKey)
    return applyJitter(cached, locData.id)
  }

  // 1. Búsqueda directa por barrio/corregimiento en catálogo
  if (neigh && PANAMA_GEO_CATALOG[neigh]) {
    const match = PANAMA_GEO_CATALOG[neigh]
    const res = { lat: match.lat, lng: match.lng, province: match.province, district: match.district, source: 'catalog' }
    GEO_CACHE.set(cacheKey, res)
    return applyJitter(res, locData.id)
  }

  // 2. Búsqueda por palabras clave en el título
  for (const [key, coords] of Object.entries(PANAMA_GEO_CATALOG)) {
    if (key.length > 4 && (neigh.includes(key) || title.includes(key))) {
      const res = { lat: coords.lat, lng: coords.lng, province: coords.province, district: coords.district, source: 'catalog_keyword' }
      GEO_CACHE.set(cacheKey, res)
      return applyJitter(res, locData.id)
    }
  }

  // 3. Búsqueda por distrito
  if (dist && PANAMA_GEO_CATALOG[dist]) {
    const match = PANAMA_GEO_CATALOG[dist]
    const res = { lat: match.lat, lng: match.lng, province: match.province, district: match.district, source: 'district_catalog' }
    GEO_CACHE.set(cacheKey, res)
    return applyJitter(res, locData.id)
  }

  // 4. Fallback por provincia
  if (prov && PROVINCE_FALLBACK_GEO[prov]) {
    const match = PROVINCE_FALLBACK_GEO[prov]
    const res = { lat: match.lat, lng: match.lng, province: locData.province, district: locData.district, source: 'province_fallback' }
    GEO_CACHE.set(cacheKey, res)
    return applyJitter(res, locData.id)
  }

  // 5. Fallback general (Ciudad de Panamá)
  const defaultPos = { lat: 8.9824, lng: -79.5199, province: 'Panamá', district: 'Panamá', source: 'default' }
  return applyJitter(defaultPos, locData.id)
}

/**
 * Añade una pequeña variación métrica (~50-100m) para que varios anuncios
 * en el mismo barrio no se superpongan exactamente sobre el mismo pixel.
 */
function applyJitter(coords, id = '') {
  if (!id) return { ...coords }
  const hash = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const jitterLat = (((hash * 17) % 50) - 25) * 0.0002
  const jitterLng = (((hash * 31) % 50) - 25) * 0.0002
  return {
    ...coords,
    lat: Math.round((coords.lat + jitterLat) * 100000) / 100000,
    lng: Math.round((coords.lng + jitterLng) * 100000) / 100000,
  }
}

/**
 * Calcula la distancia en kilómetros entre dos pares de coordenadas GPS
 * utilizando la fórmula matemática de Haversine (Gran Círculo).
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distancia métrica en kilómetros (ej. 1.45 km)
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 5.0
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 5.0
  if (lat1 === lat2 && lon1 === lon2) return 0.0

  const R = 6371.0 // Radio medio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * Math.PI / 180.0
  const dLon = (lon2 - lon1) * Math.PI / 180.0
  const rLat1 = lat1 * Math.PI / 180.0
  const rLat2 = lat2 * Math.PI / 180.0

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 100) / 100
}
