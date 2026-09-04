/**
 * Hermes Intelligence Engine (H.O.I.E) - Main Entrypoint
 */

import { HermesPipeline } from './pipeline/index.js'

async function run() {
  console.log('🤖 Starting Hermes Opportunity Intelligence Agent...')
  // Import mock or real data and trigger pipeline test
  const pipeline = new HermesPipeline(null)
  
  // Under development, execute default CLI runner of pipeline
  // Future: configure event listeners or express endpoint here
  console.log('ℹ️ Running default pipeline test...')
  
  // We can mock test data here or import directly from test fixtures
  const mockAssets = [
    {
      source_id: 'test-source',
      vertical: 'real_estate' as const,
      status: 'active' as const,
      price_currency: 'USD',
      title: 'Casa en Bella Vista - 20% debajo del valor',
      price_amount: 180000,
      location: {
        province: 'Panamá',
        district: 'Bella Vista',
        neighborhood: 'El Cangrejo'
      },
      seller_type: 'bank'
    }
  ]

  const results = await pipeline.runWithMockData(mockAssets)
  console.log('📊 Agent Execution Results:')
  for (const r of results) {
    console.log(`- ${r.asset.title}: Score ${r.opportunityScore?.final_score} (${r.opportunityScore?.grade}) -> Decision: ${r.investmentDecision?.recommended_action}`)
  }
}

run().catch(console.error)
