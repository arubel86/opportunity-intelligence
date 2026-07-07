// Opportunity Scorer v1.1
// Core engine implementing Hermes Knowledge Rules

import type { Asset, OpportunityScore } from '@hermes/types'

interface OpportunityComponents {
  price_vs_estimated_value: { score: number; weight: number; details?: any }
  comparables_analysis: { score: number; weight: number; details?: any }
  location_quality: { score: number; weight: number; details?: any }
  market_trend: { score: number; weight: number; details?: any }
  exit_strategy: { score: number; weight: number; details?: any }
  liquidity: { score: number; weight: number; details?: any }
  seller_motivation: { score: number; weight: number; details?: any }
  risk_assessment: { score: number; weight: number; details?: any }
}

export class OpportunityScorer {
  private readonly WEIGHTS = {
    price_vs_estimated_value: 0.25,
    comparables_analysis: 0.25,
    location_quality: 0.20,
    market_trend: 0.10,
    exit_strategy: 0.05,
    liquidity: 0.05,
    seller_motivation: 0.05,
    risk_assessment: 0.05
  }

  async calculate(asset: Asset, comparables: any[] = []): Promise<OpportunityScore> {
    const components = await this.calculateComponents(asset, comparables)
    const finalScore = this.calculateFinalScore(components)
    const grade = this.calculateGrade(finalScore)
    const confidence = this.calculateConfidence(components, comparables)

    return {
      asset_id: asset.asset_id || crypto.randomUUID(),
      version: 1,
      components,
      final_score: finalScore,
      grade,
      confidence,
      model_version: 'opportunity-scorer-v1.1',
      calculated_at: new Date()
    }
  }

  private async calculateComponents(asset: Asset, comparables: any[]): Promise<OpportunityComponents> {
    // Price vs Estimated Value Score (v1.1: RULE-V-001)
    const priceScore = await this.calculatePriceScore(asset, comparables)

    // Comparables Score (v1.1: RULE-C-001)
    const comparablesScore = this.calculateComparablesScore(comparables)

    // Location Score (v1.1: RULE-L-001)
    const locationScore = await this.calculateLocationScore(asset)

    // Market Trend Score (v1.1: RULE-M-001 - Auto detected)
    const marketTrendScore = await this.calculateMarketTrendScore(asset)

    // Exit Strategy Score (v1.1)
    const exitStrategyScore = await this.calculateExitStrategyScore(asset)

    // Liquidity Score
    const liquidityScore = this.calculateLiquidityScore(asset)

    // Seller Motivation Score (v1.1: RULE-SR-001 - Multi-signal)
    const sellerMotivationScore = this.calculateSellerMotivationScore(asset)

    // Risk Assessment Score (v1.1: RULE-R-001 - No litigation/block)
    const riskScore = await this.calculateRiskScore(asset)

    return {
      price_vs_estimated_value: {
        score: priceScore.normalized,
        weight: this.WEIGHTS.price_vs_estimated_value,
        details: priceScore.details
      },
      comparables_analysis: {
        score: comparablesScore.score,
        weight: this.WEIGHTS.comparables_analysis,
        details: { count: comparables.length, quality_avg: comparablesScore.qualityAvg }
      },
      location_quality: {
        score: locationScore.score,
        weight: this.WEIGHTS.location_quality,
        details: locationScore.factors
      },
      market_trend: {
        score: marketTrendScore.score,
        weight: this.WEIGHTS.market_trend,
        details: marketTrendScore.trend
      },
      exit_strategy: {
        score: exitStrategyScore.score,
        weight: this.WEIGHTS.exit_strategy,
        details: exitStrategyScore.factors
      },
      liquidity: {
        score: liquidityScore.score,
        weight: this.WEIGHTS.liquidity,
        details: { days_on_market: liquidityScore.dom }
      },
      seller_motivation: {
        score: sellerMotivationScore.score,
        weight: this.WEIGHTS.seller_motivation,
        details: { seller_type: asset.seller_type, motivation_index: sellerMotivationScore.index }
      },
      risk_assessment: {
        score: riskScore.normalized,
        weight: this.WEIGHTS.risk_assessment,
        details: { risk_factors: riskScore.factors }
      }
    }
  }

  // RULE-V-001: Minimum 3 comparables
  private async calculatePriceScore(asset: Asset, comparables: any[]): Promise<{ normalized: number; details: any }> {
    // If no comparables, return 0 (needs investigation)
    if (comparables.length < 3) {
      return {
        normalized: 0,
        details: { status: 'INVESTIGANDO', reason: 'INSUFFICIENT_COMPARABLES' }
      }
    }

    // Calculate estimated value from comparables
    const estimatedValue = this.calculateEstimatedValue(comparables)
    const listedPrice = asset.price_amount || 0
    const discount = ((estimatedValue - listedPrice) / estimatedValue) * 100

    // RULE-V-001 Price Score table
    let score = 0
    if (discount >= 25) score = 10
    else if (discount >= 15) score = 8
    else if (discount >= 8) score = 6
    else if (discount >= 3) score = 4
    else if (discount >= 0) score = 2
    else score = 0 // Overpriced

    return {
      normalized: score / 10,
      details: { listed_price: listedPrice, estimated_value: estimatedValue, discount_pct: discount }
    }
  }

  private calculateEstimatedValue(comparables: any[]): number {
    // RULE-C-001: Weight by quality factor
    let totalWeighted = 0
    let totalWeight = 0

    for (const comp of comparables) {
      const weight = this.calculateComparableWeight(comp)
      totalWeighted += comp.price * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? totalWeighted / totalWeight : 0
  }

  private calculateComparableWeight(comparable: any): number {
    let weight = 1.0

    // Distance factor
    if (comparable.distance_km < 1) weight *= 1.0
    else if (comparable.distance_km < 3) weight *= 0.8
    else if (comparable.distance_km < 5) weight *= 0.6
    else weight *= 0.3

    // Age factor
    if (comparable.age_days < 30) weight *= 1.0
    else if (comparable.age_days < 90) weight *= 0.8
    else if (comparable.age_days < 180) weight *= 0.6
    else weight *= 0.4

    return weight
  }

  private calculateComparablesScore(comparables: any[]): { score: number; qualityAvg: number } {
    if (comparables.length === 0) return { score: 0, qualityAvg: 0 }

    const qualitySum = comparables.reduce((sum, c) => sum + (c.quality_score || 70), 0)
    const qualityAvg = qualitySum / comparables.length

    // Score based on count and quality
    let score = 0
    if (comparables.length >= 5 && qualityAvg >= 80) score = 10
    else if (comparables.length >= 3 && qualityAvg >= 70) score = 8
    else if (comparables.length >= 3) score = 6
    else score = 4

    return { score: score / 10, qualityAvg }
  }

  private async calculateLocationScore(asset: Asset): Promise<{ score: number; factors: any }> {
    // Placeholder - will integrate with real location analysis
    let score = 5 // Default moderate

    const factors = {
      accessibility: 0.7,
      amenities: 0.6,
      safety: 0.75,
      urban_growth: 0.65
    }

    // Boost for known good areas (will be auto-detected in v1.1)
    if (asset.location?.district) {
      const goodDistricts = ['Panamá', 'San Francisco', 'Bella Vista']
      if (goodDistricts.includes(asset.location.district)) {
        score += 1.5
      }
    }

    return { score: Math.min(10, score) / 10, factors }
  }

  private async calculateMarketTrendScore(asset: Asset): Promise<{ score: number; trend: any }> {
    // RULE-M-001: Auto-detected (placeholder)
    return {
      score: 0.65,
      trend: { trend_direction: 'stable', price_trend_12m: 5.2 }
    }
  }

  private async calculateExitStrategyScore(asset: Asset): Promise<{ score: number; factors: any }> {
    // Based on market absorption and demand
    return {
      score: 0.7,
      factors: { 
        historical_sale_speed: 'moderate', 
        buyer_market_depth: 'medium',
        asset_uniqueness: 'standard'
      }
    }
  }

  private calculateLiquidityScore(asset: Asset): { score: number; dom: number } {
    // Placeholder - would need listing metadata for real calculation
    // RULE-F-002: Freshness affects liquidity
    return { score: 0.6, dom: 45 } // Assume 45 days on market
  }

  // RULE-SR-001: Multi-signal seller motivation
  private calculateSellerMotivationScore(asset: Asset): { score: number; index: number } {
    // Bank sellers = high motivation (RULE-SR-001)
    const bankMotivation = { 
      score: 0.9, 
      index: 9 // From knowledge rules
    }

    // Other seller types would have different logic
    const scores: Record<string, { score: number; index: number }> = {
      bank: { score: 0.9, index: 9 },
      inheritance: { score: 1.0, index: 9 },
      divorce: { score: 0.8, index: 8 },
      owner: { score: 0.7, index: 7 }
    }

    return scores[asset.seller_type || 'unknown'] || { score: 0.5, index: 5 }
  }

  // RULE-R-001: Block litigation/lien
  private async calculateRiskScore(asset: Asset): Promise<{ normalized: number; factors: string[] }> {
    const factors: string[] = []
    let score = 10 // Start with no risk

    // Would check actual asset data in production
    // For now, banks are low-risk
    if (asset.seller_type === 'bank') {
      score = 8
    }

    return {
      normalized: score / 10,
      factors
    }
  }

  private calculateFinalScore(components: OpportunityComponents): number {
    let total = 0
    for (const [key, component] of Object.entries(components)) {
      total += component.score * (this.WEIGHTS as any)[key]
    }
    return Math.round(total * 100)
  }

  private calculateGrade(score: number): OpportunityScore['grade'] {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'A-'
    if (score >= 80) return 'B+'
    if (score >= 75) return 'B'
    if (score >= 70) return 'B-'
    if (score >= 65) return 'C+'
    if (score >= 60) return 'C'
    if (score >= 55) return 'C-'
    if (score >= 50) return 'D'
    return 'F'
  }

  private calculateConfidence(components: OpportunityComponents, comparables: any[]): number {
    // RULE: Based on comparables, data quality, source quality
    let confidence = 50

    if (comparables.length >= 5) confidence += 20
    else if (comparables.length >= 3) confidence += 10

    // Source quality boost
    confidence = Math.min(100, confidence)

    return confidence
  }
}