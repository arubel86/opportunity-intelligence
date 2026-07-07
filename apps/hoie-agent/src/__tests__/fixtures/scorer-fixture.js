// Opportunity Scorer v1.1 - matches Golden Dataset formula exactly
import { PANAMA_LOCATIONS } from '../data/panama-locations.js'

export class OpportunityScorer {
  async calculate(asset, comparables) {
    const startTime = Date.now()
    const discount = this._calculateDiscount(asset, comparables)
    const compsCount = comparables.length

    // Exact formula from Golden Dataset validation
    const baseScore = 37 + discount * 1.8
    const bankBonus = (asset.sellerType === 'bank') ? 1 : 0
    const compBonus = Math.min(1, compsCount * 0.25)

    let finalScore = Math.round(baseScore + bankBonus + compBonus)
    finalScore = Math.max(10, Math.min(98, finalScore))

    const confidence = this._calculateConfidence(asset, comparables)
    const grade = this._getGrade(finalScore)

    const components = {
      price_vs_estimated_value: {
        score: baseScore / 100,
        weight: 1.0,
        details: { discount_pct: discount, estimated_value: this._getEstimatedValue(comparables) }
      },
      comparables_analysis: {
        score: compBonus,
        weight: 0,
        details: { comparables_found: compsCount }
      },
      seller_motivation: {
        score: bankBonus,
        weight: 0,
        details: { seller: asset.sellerType, bonus: bankBonus }
      }
    }

    return {
      final_score: finalScore,
      components,
      grade,
      confidence,
      timestamp: new Date().toISOString(),
      calculationTimeMs: Date.now() - startTime
    }
  }

  _calculateDiscount(asset, comparables) {
    if (comparables.length === 0 || !asset.priceAmount) return 0
    const estValue = this._getEstimatedValue(comparables)
    if (estValue <= 0) return 0
    return ((estValue - asset.priceAmount) / estValue) * 100
  }

  _getEstimatedValue(comparables) {
    if (comparables.length === 0) return 0
    let totalWeighted = 0
    let totalWeight = 0
    for (const comp of comparables) {
      const w = Math.max(0, (comp.qualityScore || 50)) / 100
      totalWeighted += (comp.price || 0) * w
      totalWeight += w
    }
    return totalWeight > 0 ? totalWeighted / totalWeight
      : comparables.reduce((s, c) => s + (c.price || 0), 0) / comparables.length
  }

  _calculateConfidence(asset, comparables) {
    let score = 80
    if (comparables.length < 3) score -= 15
    else if (comparables.length < 5) score -= 5
    if (!asset.location?.lat || !asset.location?.lng) score -= 10
    if (!asset.location?.neighborhood) score -= 5
    if (!asset.priceAmount) score -= 15
    if (asset.condition === 'needs_repair' || asset.condition === 'renovation') score -= 5
    return Math.max(30, Math.min(95, score))
  }

  _getGrade(score) {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'A-'
    if (score >= 78) return 'B+'
    if (score >= 72) return 'B'
    if (score >= 65) return 'B-'
    if (score >= 58) return 'C+'
    if (score >= 50) return 'C'
    if (score >= 42) return 'C-'
    if (score >= 35) return 'D'
    return 'F'
  }
}
