// Panama vehicle patterns for realistic listing generation
export const VEHICLE_BRANDS = {
  Toyota: [
    { model: 'Hilux', type: 'pickup', priceRange: [25000, 55000] },
    { model: 'Prado', type: 'suv', priceRange: [45000, 85000] },
    { model: 'Corolla', type: 'sedan', priceRange: [15000, 28000] },
    { model: 'RAV4', type: 'suv', priceRange: [28000, 45000] },
    { model: 'Fortuner', type: 'suv', priceRange: [35000, 60000] },
    { model: 'Yaris', type: 'sedan', priceRange: [12000, 20000] }
  ],
  Hyundai: [
    { model: 'Tucson', type: 'suv', priceRange: [18000, 32000] },
    { model: 'Santa Fe', type: 'suv', priceRange: [22000, 40000] },
    { model: 'Elantra', type: 'sedan', priceRange: [12000, 22000] },
    { model: 'Palisade', type: 'suv', priceRange: [35000, 55000] },
    { model: 'Creta', type: 'suv', priceRange: [15000, 25000] },
    { model: 'Accent', type: 'sedan', priceRange: [9000, 16000] }
  ],
  Kia: [
    { model: 'Sportage', type: 'suv', priceRange: [17000, 30000] },
    { model: 'Sorento', type: 'suv', priceRange: [22000, 38000] },
    { model: 'Rio', type: 'sedan', priceRange: [9000, 16000] },
    { model: 'Soul', type: 'hatchback', priceRange: [12000, 20000] },
    { model: 'Telluride', type: 'suv', priceRange: [38000, 60000] },
    { model: 'K5', type: 'sedan', priceRange: [18000, 28000] }
  ],
  Nissan: [
    { model: 'Sentra', type: 'sedan', priceRange: [12000, 22000] },
    { model: 'X-Trail', type: 'suv', priceRange: [20000, 35000] },
    { model: 'Frontier', type: 'pickup', priceRange: [22000, 40000] },
    { model: 'Pathfinder', type: 'suv', priceRange: [25000, 45000] },
    { model: 'Versa', type: 'sedan', priceRange: [9000, 15000] },
    { model: 'Kicks', type: 'suv', priceRange: [16000, 25000] }
  ],
  Chevrolet: [
    { model: 'Tahoe', type: 'suv', priceRange: [35000, 65000] },
    { model: 'Colorado', type: 'pickup', priceRange: [25000, 45000] },
    { model: 'Spark', type: 'hatchback', priceRange: [8000, 14000] },
    { model: 'Traverse', type: 'suv', priceRange: [28000, 45000] },
    { model: 'Silverado', type: 'pickup', priceRange: [35000, 60000] },
    { model: 'Onix', type: 'sedan', priceRange: [12000, 18000] }
  ],
  Honda: [
    { model: 'CR-V', type: 'suv', priceRange: [25000, 42000] },
    { model: 'Civic', type: 'sedan', priceRange: [15000, 28000] },
    { model: 'HR-V', type: 'suv', priceRange: [18000, 28000] },
    { model: 'Pilot', type: 'suv', priceRange: [32000, 50000] },
    { model: 'Accord', type: 'sedan', priceRange: [20000, 32000] },
    { model: 'Odyssey', type: 'van', priceRange: [28000, 42000] }
  ]
}

export const TYPE_LABELS = {
  sedan: 'Sedán', suv: 'SUV', pickup: 'Pickup', hatchback: 'Hatchback', van: 'Van'
}

export const FUEL_OPTIONS = ['gasoline', 'diesel', 'hybrid', 'electric']
export const FUEL_WEIGHTS = { gasoline: 0.7, diesel: 0.2, hybrid: 0.08, electric: 0.02 }
export const TRANSMISSION_OPTIONS = ['automatic', 'manual']
export const TRANSMISSION_WEIGHTS = { automatic: 0.85, manual: 0.15 }
export const COLOR_OPTIONS = ['Blanco', 'Negro', 'Plateado', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige', 'Marrón', 'Dorado']

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'Nuevo', priceFactor: 1.3, kmRange: { min: 0, max: 500 } },
  { value: 'excellent', label: 'Excelente', priceFactor: 1.1, kmRange: { min: 1000, max: 15000 } },
  { value: 'good', label: 'Bueno', priceFactor: 1.0, kmRange: { min: 15000, max: 50000 } },
  { value: 'fair', label: 'Regular', priceFactor: 0.85, kmRange: { min: 50000, max: 100000 } },
  { value: 'needs_repair', label: 'Necesita reparaciones', priceFactor: 0.65, kmRange: { min: 80000, max: 200000 } }
]

export const VEHICLE_FEATURES = [
  'A/C', 'Dirección hidráulica', 'Vidrios eléctricos', 'Cierre centralizado',
  'Airbag', 'ABS', 'Cámara de reversa', 'Sensor de parqueo', 'Bluetooth',
  'Pantalla táctil', 'Asientos de cuero', 'Techo corredizo', 'Rines de aleación',
  'Faros LED', 'Control de crucero', 'Navegador GPS', 'Sunroof',
  'Asientos eléctricos', 'Cargador inalámbrico', 'Sistema de sonido premium'
]

export const VEHICLE_FEATURES_POPULARITY = {
  'A/C': 0.98, 'Dirección hidráulica': 0.95, 'Vidrios eléctricos': 0.90,
  'Cierre centralizado': 0.92, 'Airbag': 0.85, 'ABS': 0.80, 'Bluetooth': 0.75,
  'Pantalla táctil': 0.65, 'Cámara de reversa': 0.55, 'Sensor de parqueo': 0.50
}

export const VEHICLE_SELLER_TYPES = [
  { type: 'dealer', label: 'Concesionario', motivationScore: 6, weight: 0.35 },
  { type: 'owner', label: 'Dueño directo', motivationScore: 5, weight: 0.45 },
  { type: 'bank', label: 'Banco', motivationScore: 9, weight: 0.10 },
  { type: 'import', label: 'Importador', motivationScore: 7, weight: 0.10 }
]

export const YEAR_RANGE = { min: 2015, max: 2025 }

export function getKilometersForYear(year, conditionIndex) {
  const age = 2026 - year
  const baseKm = age * 15000
  const variation = (Math.random() - 0.5) * 0.4 * baseKm
  return Math.round(baseKm + variation)
}

export function pickWeightedMap(map) {
  const total = Object.values(map).reduce((s, v) => s + v, 0)
  let r = Math.random() * total
  for (const [key, weight] of Object.entries(map)) {
    r -= weight
    if (r <= 0) return key
  }
  return Object.keys(map)[0]
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
