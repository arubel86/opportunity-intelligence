// Test script to verify Opportunity Scorer logic
import { OpportunityScorer } from './opportunity-scorer.js'

const scorer = new OpportunityScorer()

// Mock asset with 3 comparables
const mockAsset = {
  asset_id: 'test-123',
  source_id: 'banco-nacional-source',
  vertical: 'real_estate' as const,
  status: 'active' as const,
  price_currency: 'USD',
  title: 'Test Property',
  price_amount: 200000,
  location: {
    province: 'Panamá',
    district: 'Bella Vista'
  },
  seller_type: 'bank'
}

const mockComparables = [
  { price: 250000, distance_km: 0.5, age_days: 15, quality_score: 85 },
  { price: 240000, distance_km: 1.2, age_days: 30, quality_score: 80 },
  { price: 245000, distance_km: 2.0, age_days: 45, quality_score: 75 }
]

async function testScorer() {
  console.log('Testing Opportunity Scorer...')
  
  const score = await scorer.calculate(mockAsset, mockComparables)
  
  console.log('Opportunity Score:', score.final_score)
  console.log('Grade:', score.grade)
  console.log('Confidence:', score.confidence)
  console.log('Price Score:', score.components?.price_vs_estimated_value?.score)
  console.log('Comparables Score:', score.components?.comparables_analysis?.score)
  console.log('Seller Motivation:', score.components?.seller_motivation?.score)
  console.log('Risk Assessment:', score.components?.risk_assessment?.score)
  
  console.log('Test Completed!')
}

testScorer().catch(console.error)