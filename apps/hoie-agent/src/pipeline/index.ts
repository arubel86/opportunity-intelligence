// Main Pipeline - End-to-end in-memory processing
// No persistence until validated

import { BaseScraper } from '../scraper/base-scraper.js'
import { AssetNormalizer } from './normalizer.js'
import { OpportunityScorer } from '../scorer/opportunity-scorer.js'
import { InvestmentDecisionEngine } from '../decision/investment-decision-engine.js'
import { ComparableEngine, type Comparable } from '../engine/comparable-engine.js'
import { ValuationEngine, type ValuationResult } from '../engine/valuation-engine.js'
import type { Asset, OpportunityScore, InvestmentDecision } from '@hermes/types'

export interface PipelineResult {
  asset: Asset
  opportunityScore?: OpportunityScore
  investmentDecision?: InvestmentDecision
  comparables: Comparable[]
  valuation?: ValuationResult
  processingTime: number
  errors: string[]
}

export class HermesPipeline {
  private scraper: BaseScraper
  private normalizer: AssetNormalizer
  private scorer: OpportunityScorer
  private decisionEngine: InvestmentDecisionEngine
  private comparableEngine: ComparableEngine
  private valuationEngine: ValuationEngine
  private listingPool: Asset[]

  constructor(source: any, listingPool: Asset[] = []) {
    this.scraper = new BaseScraper(source)
    this.normalizer = new AssetNormalizer()
    this.scorer = new OpportunityScorer()
    this.decisionEngine = new InvestmentDecisionEngine()
    this.comparableEngine = new ComparableEngine()
    this.valuationEngine = new ValuationEngine()
    this.listingPool = listingPool
  }

  async run(): Promise<PipelineResult[]> {
    const startTime = Date.now()
    const rawAssets = await this.scraper.scrape()
    const results: PipelineResult[] = []

    // First pass: normalize all assets
    const normalizedAssets: Asset[] = []
    for (const raw of rawAssets) {
      try {
        const normalizedAsset = this.normalizer.normalize(raw, raw.source_id, raw.vertical)
        normalizedAssets.push(normalizedAsset)
      } catch (error) {
        console.error(`Normalization error for asset ${raw.title}:`, error)
      }
    }

    // Combine with listing pool for broader comparable search
    const pool = [...this.listingPool, ...normalizedAssets]

    // Second pass: score each asset using real comparables
    for (const normalizedAsset of normalizedAssets) {
      const result: PipelineResult = {
        asset: normalizedAsset,
        comparables: [],
        processingTime: 0,
        errors: []
      }

      try {
        // Find real comparables from the pool
        const compResult = this.comparableEngine.findComparables(normalizedAsset, pool)
        result.comparables = compResult.comparables

        // Calculate valuation
        result.valuation = this.valuationEngine.estimate(normalizedAsset, compResult.comparables)

        // Score the opportunity using real comparables
        result.opportunityScore = await this.scorer.calculate(normalizedAsset, result.comparables)

        // Generate investment decision
        result.investmentDecision = this.decisionEngine.generateDecision(
          result.opportunityScore,
          normalizedAsset
        )

        result.processingTime = Date.now() - startTime
      } catch (error) {
        result.errors.push((error as Error).message)
        console.error(`Pipeline error for asset ${normalizedAsset.title}:`, error)
      }

      results.push(result)
    }

    return results
  }

  // Method for testing with real comparable engine
  async runWithMockData(mockAssets: Asset[]): Promise<PipelineResult[]> {
    const results: PipelineResult[] = []
    const pool = [...this.listingPool, ...mockAssets]

    for (const asset of mockAssets) {
      const compResult = this.comparableEngine.findComparables(asset, pool)

      const opportunityScore = await this.scorer.calculate(asset, compResult.comparables)
      const investmentDecision = this.decisionEngine.generateDecision(opportunityScore, asset)

      results.push({
        asset,
        opportunityScore,
        investmentDecision,
        comparables: compResult.comparables,
        processingTime: 100,
        errors: []
      })
    }

    return results
  }
}

// CLI Runner
async function main() {
  console.log('🚀 Hermes Pipeline - End-to-End Test')
  console.log('=' .repeat(50))

  // Mock data for testing (Golden Dataset preparation)
  const mockAssets: Asset[] = [
    {
      source_id: 'test-source',
      vertical: 'real_estate',
      status: 'active',
      price_currency: 'USD',
      title: 'Casa en Bella Vista - 20% debajo del valor',
      price_amount: 180000,
      location: {
        province: 'Panamá',
        district: 'Bella Vista',
        neighborhood: 'El Cangrejo'
      },
      seller_type: 'bank'
    },
    {
      source_id: 'test-source',
      vertical: 'real_estate',
      status: 'active',
      price_currency: 'USD',
      title: 'Apartamento en San Francisco - Precio justo',
      price_amount: 250000,
      location: {
        province: 'Panamá',
        district: 'San Francisco'
      },
      seller_type: 'owner'
    },
    {
      source_id: 'test-source',
      vertical: 'real_estate',
      status: 'active',
      price_currency: 'USD',
      title: 'Terreno en Costa del Este - Precio alto',
      price_amount: 350000,
      location: {
        province: 'Panamá',
        district: 'Costa del Este'
      },
      seller_type: 'owner'
    }
  ]

  const pipeline = new HermesPipeline(null)
  const results = await pipeline.runWithMockData(mockAssets)

  console.log('\n📊 Pipeline Results:\n')
  for (const result of results) {
    console.log(`Asset: ${result.asset.title}`)
    console.log(`  Price: $${result.asset.price_amount?.toLocaleString()}`)
    console.log(`  Location: ${result.asset.location?.district}, ${result.asset.location?.neighborhood}`)
    console.log(`  Score: ${result.opportunityScore?.final_score} (${result.opportunityScore?.grade})`)
    console.log(`  Confidence: ${result.opportunityScore?.confidence}%`)
    console.log(`  Decision: ${result.investmentDecision?.recommended_action}`)
    console.log(`  Profile: ${result.investmentDecision?.investment_profile}`)
    console.log('')
  }

  console.log('✅ Pipeline validation complete!')
}

main().catch(console.error)