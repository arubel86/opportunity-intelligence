// Golden Dataset - Manually validated reference data
// This dataset will be used to validate all engine changes
// NO engine modification can reduce performance on this dataset

export interface GoldenAsset {
  id: string
  vertical: 'real_estate' | 'vehicles'
  source_type: 'bank_foreclosure' | 'owner' | 'agency'
  
  // Raw data
  title: string
  price_amount: number
  location: {
    province: string
    district: string
    neighborhood?: string
  }
  
  // Expected values (manually validated)
  expected_estimated_value: number
  expected_discount_pct: number
  expected_comparables_count: number
  expected_score_range: [number, number] // min, max
  expected_grade: string
  expected_confidence_range: [number, number]
  expected_decision: string
  expected_profile: string
  
  // Validation metadata
  analyst_validation_date: string
  analyst_notes?: string
}

// Real Estate - Bank Foreclosures (High Opportunity Zone)
export const GOLDEN_REAL_ESTATE: GoldenAsset[] = [
  {
    id: 'GOLD-RE-001',
    vertical: 'real_estate',
    source_type: 'bank_foreclosure',
    title: 'Casa en Venta - Bella Vista (Subasta Banco Nacional)',
    price_amount: 175000,
    location: {
      province: 'Panamá',
      district: 'Bella Vista',
      neighborhood: 'El Cangrejo'
    },
    expected_estimated_value: 220000,
    expected_discount_pct: 20.5, // ~20% discount -> Score: 8/10
    expected_comparables_count: 5,
    expected_score_range: [75, 85],
    expected_grade: 'B+',
    expected_confidence_range: [60, 75],
    expected_decision: 'WATCH_HIGH_PRIORITY',
    expected_profile: 'value_investment',
    analyst_validation_date: '2026-01-15',
    analyst_notes: 'Casa 120m2, 3 hab, remodelada. Precio 20% bajo respecto a comps similares. Zona con alta demanda de compra.'
  },
  {
    id: 'GOLD-RE-002',
    vertical: 'real_estate',
    source_type: 'bank_foreclosure',
    title: 'Apartamento 2BR - San Francisco (Caja de Ahorros)',
    price_amount: 145000,
    location: {
      province: 'Panamá',
      district: 'San Francisco',
      neighborhood: 'Bethania'
    },
    expected_estimated_value: 180000,
    expected_discount_pct: 19.4, // ~19% discount -> Score: 8/10
    expected_comparables_count: 6,
    expected_score_range: [72, 82],
    expected_grade: 'B',
    expected_confidence_range: [65, 75],
    expected_decision: 'WATCH_HIGH_PRIORITY',
    expected_profile: 'value_investment',
    analyst_validation_date: '2026-01-15',
    analyst_notes: 'Apartamento 85m2 en 4to piso. Precio 19% bajo. Buena ubicación frente a Parque Metropolitano.'
  },
  {
    id: 'GOLD-RE-003',
    vertical: 'real_estate',
    source_type: 'bank_foreclosure',
    title: 'Terreno 1500m2 - Arraiján',
    price_amount: 85000,
    location: {
      province: 'Panamá Oeste',
      district: 'Arraiján',
      neighborhood: 'Burunga'
    },
    expected_estimated_value: 120000,
    expected_discount_pct: 29.2, // ~29% discount -> Score: 10/10
    expected_comparables_count: 4,
    expected_score_range: [85, 95],
    expected_grade: 'A-',
    expected_confidence_range: [55, 70],
    expected_decision: 'BUY_NOW',
    expected_profile: 'flip_opportunity',
    analyst_validation_date: '2026-01-15',
    analyst_notes: 'Terreno plano, listo para construir. 29% de descuento significativo. Zona con crecimiento urbano.'
  },
  {
    id: 'GOLD-RE-004',
    vertical: 'real_estate',
    source_type: 'owner',
    title: 'Casa en Costa del Este - Precio justo',
    price_amount: 480000,
    location: {
      province: 'Panamá',
      district: 'Costa del Este',
      neighborhood: 'Punta Pacifica'
    },
    expected_estimated_value: 490000,
    expected_discount_pct: 2.0, // ~2% discount -> Score: 2/10
    expected_comparables_count: 8,
    expected_score_range: [50, 60],
    expected_grade: 'D',
    expected_confidence_range: [60, 75],
    expected_decision: 'RESEARCH_MORE',
    expected_profile: 'speculative',
    analyst_validation_date: '2026-01-15',
    analyst_notes: 'Zona prime pero sin descuento significativo. Requiere análisis de plusvalía futura.'
  },
  {
    id: 'GOLD-RE-005',
    vertical: 'real_estate',
    source_type: 'agency',
    title: 'Local Comercial - Coco del Mar',
    price_amount: 120000,
    location: {
      province: 'Panamá',
      district: 'San Miguelito',
      neighborhood: 'Coco del Mar'
    },
    expected_estimated_value: 150000,
    expected_discount_pct: 20.0, // ~20% discount -> Score: 8/10
    expected_comparables_count: 3,
    expected_score_range: [65, 75],
    expected_confidence_range: [50, 65],
    expected_grade: 'C+',
    expected_decision: 'NEGOTIATE',
    expected_profile: 'cash_flow',
    analyst_validation_date: '2026-01-15',
    analyst_notes: 'Local comercial con potencial de alquiler. Precio 20% bajo. Zona mixta (residencial/comercial).'
  }
]

// Vehicles - Used Cars (High Demand Models)
export const GOLDEN_VEHICLES: GoldenAsset[] = [
  {
    id: 'GOLD-VEH-001',
    vertical: 'vehicles',
    source_type: 'bank_foreclosure',
    title: 'Toyota Hilux 2019 - 65000 km',
    price_amount: 22000,
    location: {
      province: 'Panamá',
      district: 'Panamá'
    },
    expected_estimated_value: 28000,
    expected_discount_pct: 21.3, // ~21% discount -> Score: 8/10
    expected_comparables_count: 6,
    expected_score_range: [75, 85],
    expected_grade: 'B+',
    expected_confidence_range: [65, 75],
    expected_decision: 'WATCH_HIGH_PRIORITY',
    expected_profile: 'flip_opportunity',
    analyst_validation_date: '2026-01-15',
    analyst_notes: 'Pickups Toyota tienen alta demanda. 65000 km es bajo para año 2019. Excelente oportunidad.'
  },
  {
    id: 'GOLD-VEH-002',
    vertical: 'vehicles',
    source_type: 'owner',
    title: 'Honda Civic 2018 - 95000 km',
    price_amount: 12500,
    location: {
      province: 'Panamá',
      district: 'Panamá'
    },
    expected_estimated_value: 14000,
    expected_discount_pct: 10.7, // ~11% discount -> Score: 6/10
    expected_comparables_count: 5,
    expected_score_range: [55, 65],
    expected_grade: 'C+',
    expected_confidence_range: [60, 75],
    expected_decision: 'NEGOTIATE',
    expected_profile: 'value_investment',
    analyst_validation_date: '2026-01-15',
    analyst_notes: 'Sedán compacto en buen estado. Descuento moderado. Buen vehículo para flota de alquiler corto.'
  }
]

// Combined golden dataset
export const GOLDEN_DATASET = [...GOLDEN_REAL_ESTATE, ...GOLDEN_VEHICLES]

// Validation function
export function validateAgainstGolden(
  assetId: string,
  score: number,
  grade: string,
  confidence: number
): { passed: boolean; errors: string[] } {
  const golden = GOLDEN_DATASET.find(g => g.id === assetId)
  if (!golden) {
    return { passed: false, errors: ['Asset not found in golden dataset'] }
  }

  const errors: string[] = []

  const [scoreMin, scoreMax] = golden.expected_score_range
  if (score < scoreMin || score > scoreMax) {
    errors.push(`Score ${score} outside expected range [${scoreMin}, ${scoreMax}]`)
  }

  if (grade !== golden.expected_grade) {
    errors.push(`Grade ${grade} != expected ${golden.expected_grade}`)
  }

  if (confidence < golden.expected_confidence_range[0] || 
      confidence > golden.expected_confidence_range[1]) {
    errors.push(`Confidence ${confidence} outside expected range [${golden.expected_confidence_range.join(', ')}]`)
  }

  return { passed: errors.length === 0, errors }
}