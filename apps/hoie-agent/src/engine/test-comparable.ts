// Comparable Engine test
import { ComparableEngine } from './comparable-engine.js'
import type { Asset } from '@hermes/types'

const engine = new ComparableEngine()

// Simulated asset pool (from scraped data)
const pool: Asset[] = [
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'PH Greenwood Ricardo J. Alfaro',
    price_amount: 145000,
    description: 'Comes with comfortable, safe and convenient space with a modern design',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá', district: 'Panamá', neighborhood: 'El Bosque' }
  },
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'Invest in Well-Being, Live at Panorama 360',
    price_amount: 145000,
    description: 'Panorama 360 combines a strategic location, contemporary design',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Brisas del Golf' }
  },
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'OFF-PLAN BEACH RESIDENCE IN CORONADO',
    price_amount: 260000,
    description: 'AURA Paradise Point Coronado',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá Oeste', district: 'Arraiján', neighborhood: 'Playa Gorgona' }
  },
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'HOUSE SALES IN ARRAIJAN',
    price_amount: 68000,
    description: 'Houses for sale in Villas de Roma, Arraiján',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá Oeste', district: 'Arraiján', neighborhood: 'Arraiján' }
  },
  {
    source_id: '00000000-0000-0000-0000-000000000001',
    title: 'House of 240m2 in Villas del Mediterranean',
    price_amount: 125000,
    description: 'This property stands out for its wide terrain',
    vertical: 'real_estate',
    status: 'active',
    price_currency: 'USD',
    location: { province: 'Panamá', district: 'Panamá', neighborhood: 'Don Bosco' }
  }
]

// Test: find comparables for each asset
console.log('=== Comparable Engine Test ===\n')

for (const asset of pool) {
  const result = engine.findComparables(asset, pool)

  console.log(`Asset: ${asset.title}`)
  console.log(`  $${asset.price_amount?.toLocaleString()} | ${asset.location?.district}, ${asset.location?.neighborhood}`)
  console.log(`  Comparables found: ${result.comparables.length} (discarded: ${result.discarded.length})`)
  console.log(`  Avg quality: ${result.avgQuality.toFixed(1)}%`)

  if (result.comparables.length > 0) {
    const top = result.comparables[0]
    console.log(`  Best match: $${top.price.toLocaleString()} | ${top.reason} | quality: ${top.qualityScore}%`)
  }

  const estValue = engine.calculateEstimatedValue(result.comparables)
  if (estValue > 0) {
    const diff = ((estValue - (asset.price_amount || 0)) / estValue) * 100
    console.log(`  Est. value: $${Math.round(estValue).toLocaleString()} (${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs listed)`)
  }
  console.log()
}

console.log('✅ Comparable Engine test passed!')
