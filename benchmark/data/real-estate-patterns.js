// Panama real estate patterns for realistic listing generation
export const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'penthouse', 'townhouse', 'lot']
export const TYPE_LABELS = {
  apartment: 'Apartamento', house: 'Casa', condo: 'Condominio',
  penthouse: 'Penthouse', townhouse: 'Townhouse', lot: 'Terreno'
}

export const AREA_RANGES = {
  apartment: { min: 50, max: 200 },
  house: { min: 150, max: 500 },
  condo: { min: 70, max: 300 },
  penthouse: { min: 150, max: 500 },
  townhouse: { min: 120, max: 300 },
  lot: { min: 200, max: 2000 }
}

export const BEDROOMS_BY_TYPE = {
  apartment: { min: 1, max: 3 },
  house: { min: 2, max: 5 },
  condo: { min: 2, max: 4 },
  penthouse: { min: 3, max: 5 },
  townhouse: { min: 2, max: 4 },
  lot: { min: 0, max: 0 }
}

export const BATHROOMS_BY_TYPE = {
  apartment: { min: 1, max: 2 },
  house: { min: 1, max: 4 },
  condo: { min: 1, max: 3 },
  penthouse: { min: 2, max: 4 },
  townhouse: { min: 1, max: 3 },
  lot: { min: 0, max: 0 }
}

export const PROPERTY_FEATURES = {
  apartment: ['A/C', 'Balcón', 'Cocina integral', 'Walk-in closet', 'Lobby con seguridad', 'Estacionamiento', 'Piscina', 'Gimnasio', 'Área de lavandería', 'Ventanas de piso a techo'],
  house: ['Jardín', 'Garaje para 2 autos', 'Cuarto de servicio', 'Patio trasero', 'Cocina integral', 'A/C central', 'Terraza', 'Chimenea', 'Closet empotrados', 'Tanque de agua'],
  condo: ['Seguridad 24h', 'Piscina', 'Área social', 'Gimnasio', 'Estacionamiento asignado', 'Lobby', 'Jardines comunes', 'Parque infantil', 'Salón de eventos', 'Sauna'],
  penthouse: ['Terraza privada', 'Vista panorámica', 'Jacuzzi', 'Terraza con BBQ', 'Cocina gourmet', 'Walk-in closets', 'Domótica', 'Estacionamiento privado', 'Bodega', 'A/C central'],
  townhouse: ['Jardín privado', 'Garaje', 'Cuarto de servicio', 'Patio', 'Cocina abierta', 'Closet empotrados', 'Piso de cerámica', 'Cerca de colegios', 'Área de juegos', 'Seguridad perimetral'],
  lot: ['Cerca de vía principal', 'Agua potable', 'Electricidad', 'Cerca de transporte', 'Zona comercial', 'Terreno plano', 'Documentos al día', 'Listo para construir']
}

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'Nuevo', priceFactor: 1.2 },
  { value: 'excellent', label: 'Excelente', priceFactor: 1.05 },
  { value: 'good', label: 'Bueno', priceFactor: 1.0 },
  { value: 'needs_repair', label: 'Necesita reparaciones', priceFactor: 0.8 },
  { value: 'renovation', label: 'Para remodelar', priceFactor: 0.65 }
]

export const SELLER_TYPES = [
  { type: 'bank', label: 'Banco', motivationScore: 9, weight: 0.05 },
  { type: 'owner', label: 'Dueño directo', motivationScore: 5, weight: 0.45 },
  { type: 'inheritance', label: 'Herencia', motivationScore: 9, weight: 0.10 },
  { type: 'developer', label: 'Desarrollador', motivationScore: 7, weight: 0.15 },
  { type: 'divorce', label: 'Divorcio', motivationScore: 8, weight: 0.10 },
  { type: 'investor', label: 'Inversionista', motivationScore: 4, weight: 0.10 },
  { type: 'agency', label: 'Agencia', motivationScore: 5, weight: 0.05 }
]

export const OPPORTUNITY_KEYWORDS_RE = [
  'urgen', 'remate', 'subasta', 'oportunidad', 'precio negociable',
  'vendedor motivado', 'precio por debajo', 'bajo precio',
  'se vende rápido', 'precio especial'
]

export function getPropertyTypeWeights() {
  return { apartment: 0.35, house: 0.25, condo: 0.15, penthouse: 0.05, townhouse: 0.10, lot: 0.10 }
}

export function pickWeighted(arr, weightKey = 'weight') {
  const totalWeight = arr.reduce((s, item) => s + (item[weightKey] || 1), 0)
  let r = Math.random() * totalWeight
  for (const item of arr) {
    r -= (item[weightKey] || 1)
    if (r <= 0) return item
  }
  return arr[arr.length - 1]
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min, max, decimals = 0) {
  const val = min + Math.random() * (max - min)
  return decimals === 0 ? val : parseFloat(val.toFixed(decimals))
}
