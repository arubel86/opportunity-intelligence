// Golden Dataset Validator for Reality Benchmark accuracy metric
// Tests the scorer's output against manually validated expectations
import { OpportunityScorer } from './engine/scorer.js'

const GOLDEN = [
  // Real Estate
  { id:'RE-001', title:'Casa Bella Vista - Subasta BNP', price:175000, district:'Bella Vista', estimated:220000, comps:5, scoreRange:[75,85], confRange:[60,75], seller:'bank', vertical:'real_estate', decision:'WATCH_HIGH_PRIORITY', profile:'value_investment' },
  { id:'RE-002', title:'Apto San Francisco - Caja Ahorros', price:145000, district:'San Francisco', estimated:180000, comps:6, scoreRange:[72,82], confRange:[65,75], seller:'bank', vertical:'real_estate', decision:'WATCH_HIGH_PRIORITY', profile:'value_investment' },
  { id:'RE-003', title:'Terreno Arraiján - Subasta', price:85000, district:'Arraiján', estimated:120000, comps:4, scoreRange:[85,95], confRange:[55,70], seller:'bank', vertical:'real_estate', decision:'BUY_NOW', profile:'flip_opportunity' },
  { id:'RE-004', title:'Casa Bethania - Caja Ahorros', price:155000, district:'Bethania', estimated:190000, comps:4, scoreRange:[70,80], confRange:[60,70], seller:'bank', vertical:'real_estate', decision:'WATCH_HIGH_PRIORITY', profile:'value_investment' },
  { id:'RE-005', title:'Casa Costa del Este', price:480000, district:'Costa del Este', estimated:490000, comps:8, scoreRange:[30,45], confRange:[72,85], seller:'owner', vertical:'real_estate', decision:'AVOID', profile:'speculative' },
  { id:'RE-006', title:'Casa Parque Lefevre', price:185000, district:'San Francisco', estimated:210000, comps:4, scoreRange:[60,70], confRange:[60,72], seller:'owner', vertical:'real_estate', decision:'NEGOTIATE', profile:'value_investment' },
  { id:'RE-007', title:'Terreno Arraiján 2 - Subasta', price:82000, district:'Arraiján', estimated:115000, comps:3, scoreRange:[80,90], confRange:[55,68], seller:'bank', vertical:'real_estate', decision:'BUY_NOW', profile:'flip_opportunity' },
  { id:'RE-008', title:'Apto Marbella Ph', price:380000, district:'San Francisco', estimated:400000, comps:7, scoreRange:[30,45], confRange:[72,85], seller:'owner', vertical:'real_estate', decision:'AVOID', profile:'speculative' },
  { id:'RE-009', title:'Casa San Miguelito - Caja de Ahorros', price:95000, district:'San Miguelito', estimated:125000, comps:4, scoreRange:[78,88], confRange:[55,70], seller:'bank', vertical:'real_estate', decision:'BUY_NOW', profile:'flip_opportunity' },
  { id:'RE-010', title:'Terreno La Chorrera - Subasta BNP', price:65000, district:'La Chorrera', estimated:90000, comps:3, scoreRange:[80,90], confRange:[50,65], seller:'bank', vertical:'real_estate', decision:'BUY_NOW', profile:'flip_opportunity' },
  // Vehicles
  { id:'VEH-001', title:'Toyota Hilux 2019 - BNP', price:22000, district:'Panamá', estimated:28000, comps:6, make:'Toyota', model:'Hilux', year:2019, scoreRange:[75,85], confRange:[65,78], seller:'bank', vertical:'vehicles', decision:'WATCH_HIGH_PRIORITY', profile:'flip_opportunity' },
  { id:'VEH-002', title:'Honda Civic 2018', price:12500, district:'Panamá', estimated:14000, comps:5, make:'Honda', model:'Civic', year:2018, scoreRange:[58,68], confRange:[62,75], seller:'owner', vertical:'vehicles', decision:'NEGOTIATE', profile:'value_investment' },
  { id:'VEH-003', title:'Honda CRV 2020 - Caja Ahorros', price:28000, district:'San Miguelito', estimated:34000, comps:5, make:'Honda', model:'CR-V', year:2020, scoreRange:[68,78], confRange:[62,75], seller:'bank', vertical:'vehicles', decision:'WATCH_HIGH_PRIORITY', profile:'value_investment' },
  { id:'VEH-004', title:'Toyota Corolla 2021', price:18000, district:'Panamá', estimated:20000, comps:5, make:'Toyota', model:'Corolla', year:2021, scoreRange:[55,65], confRange:[65,78], seller:'owner', vertical:'vehicles', decision:'NEGOTIATE', profile:'value_investment' },
  { id:'VEH-005', title:'Nissan Frontier 2017', price:16500, district:'Panamá Este', estimated:19000, comps:4, make:'Nissan', model:'Frontier', year:2017, scoreRange:[60,70], confRange:[60,72], seller:'owner', vertical:'vehicles', decision:'NEGOTIATE', profile:'value_investment' },
]

export function getGoldenDataset() {
  return GOLDEN
}

export async function runGoldenValidation(scorer) {
  const results = { total: GOLDEN.length, scoreInRange: 0, decisionMatch: 0, confInRange: 0, details: [] }

  for (const entry of GOLDEN) {
    const asset = {
      priceAmount: entry.price,
      location: { district: entry.district },
      sellerType: entry.seller,
      vertical: entry.vertical,
      title: entry.title
    }
    if (entry.make) asset.make = entry.make
    if (entry.model) asset.model = entry.model
    if (entry.year) asset.year = entry.year

    // Create comparables with deterministic prices matching estimated value
    const comparables = Array.from({ length: entry.comps }, (_, i) => ({
      price: entry.estimated,
      distance_km: 1 + (i * 0.5),
      age_days: 20 + (i * 15),
      qualityScore: 80,
      listingUrl: `https://example.com/comparable-${i}`,
      source: 'generated'
    }))

    const score = await scorer.calculate(asset, comparables)
    const inRange = score.final_score >= entry.scoreRange[0] && score.final_score <= entry.scoreRange[1]
    const confInRange = score.confidence >= entry.confRange[0] && score.confidence <= entry.confRange[1]

    results.scoreInRange += inRange ? 1 : 0
    results.confInRange += confInRange ? 1 : 0

    // Check decision matches
    const { DecisionEngine } = await import('./engine/decision-engine.js')
    const de = new DecisionEngine()
    const decision = de.makeDecision(score, asset, { summary: 'test' })
    const decisionMatch = decision.recommended_action === entry.decision
    results.decisionMatch += decisionMatch ? 1 : 0

    results.details.push({
      id: entry.id,
      title: entry.title,
      expectedScore: entry.scoreRange,
      actualScore: score.final_score,
      scoreInRange: inRange,
      expectedConf: entry.confRange,
      actualConf: score.confidence,
      confInRange: confInRange,
      expectedDecision: entry.decision,
      actualDecision: decision.recommended_action,
      decisionMatch
    })
  }

  results.accuracy = results.scoreInRange / results.total
  return results
}
