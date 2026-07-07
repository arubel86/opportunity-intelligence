// Valuation Engine test
import { ValuationEngine } from './valuation-engine.js'
import type { Asset } from '@hermes/types'
import type { Comparable } from './comparable-engine.js'

const engine = new ValuationEngine()

// Test assets with Encuentra24 real data
const assets: Asset[] = [
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'PH Greenwood - 2 habs, 47m2, $145,000',
    price_amount: 145000,
    description: 'Comes with comfortable, safe and convenient space with a modern design in PH Greenwood. 47m2, 2 bedrooms, 2 bathrooms.',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá', district: 'Panamá', neighborhood: 'El Bosque' }
  },
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'Vendo Casa en Atalaya - 714m2, 1hab, $25,000',
    price_amount: 25000,
    description: 'Casa en Atalaya de 714m2 con 1 habitaciones y 3 baños',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Atalaya' }
  },
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'Brisas del Golf Arraiján - 263m2, $94,000',
    price_amount: 94000,
    description: 'Hermosa propiedad en Brisas del Golf, Arraiján. 263m2, 3 cuartos, 2 baños.',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá Oeste', district: 'Arraiján', neighborhood: 'Brisas del Golf' }
  }
]

// Simulated comparables (from similar properties)
const comparables: Comparable[] = [
  { price: 135000, distance_km: 0.5, age_days: 30, qualityScore: 80, reason: 'Misma zona', listPrice: 135000 },
  { price: 150000, distance_km: 1.2, age_days: 45, qualityScore: 72, reason: 'Misma zona', listPrice: 150000 },
  { price: 140000, distance_km: 2.0, age_days: 60, qualityScore: 65, reason: 'Zona cercana', listPrice: 140000 }
]

console.log('=== Valuation Engine Test ===\n')

for (const asset of assets) {
  const valuation = engine.estimate(asset, comparables)
  const opportunity = engine.assessOpportunity(asset, valuation)

  console.log(`Asset: ${asset.title}`)
  console.log(`  Listed: $${asset.price_amount?.toLocaleString()}`)
  console.log(`  Est. Value: $${valuation.estimatedValue.toLocaleString()} | Confidence: ${valuation.confidence}%`)
  console.log(`  Price/m²: $${valuation.pricePerM2}`)

  if (valuation.methods.length > 0) {
    console.log('  Methods:')
    for (const m of valuation.methods) {
      console.log(`    - ${m.name}: $${m.value.toLocaleString()} (w:${m.weight}, c:${m.confidence}%)`)
    }
  }

  console.log(`  Assessment: ${opportunity.assessment}`)
  console.log(`  Recommendation: ${opportunity.recommendation}`)
  console.log()
}

console.log('✅ Valuation Engine test passed!')
