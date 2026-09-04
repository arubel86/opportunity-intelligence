/**
 * Pipeline Stage: Scorer
 * Computes opportunity scores using the REAL Comparable Engine.
 *
 * Flow:
 *  1. Find real comparables from Supabase (via Comparable Engine)
 *  2. Calculate estimated market value (weighted average by quality_score)
 *  3. Compute multi-factor opportunity score
 *  4. Grade the result
 */

import { findComparables } from './comparable-engine.mjs'
import { gradeForScore, cleanTitle } from './utils.mjs'

/**
 * Score normalized assets using real comparable analysis.
 * @param {object} ctx Pipeline context { validated, supabase, log, report }
 * @returns {Promise<Array>} Scored results
 */
export async function run(ctx) {
  const { validated, supabase, log, report } = ctx
  const scoreStart = Date.now()
  const logStage = log.module('SCORER')
  logStage.section('OPPORTUNITY SCORING')

  const scored = []

  for (const asset of validated) {
    try {
      // ── Step 1: Find REAL comparables ─────────────────────────────
      const comparables = await findComparables(asset, supabase)
      const compCount = comparables.length

      // ── Step 2: Valuation (weighted average) ──────────────────────
      let estimatedValue = asset.price_amount
      let valuationConfidence = 10
      let weightedQuality = 0

      if (compCount > 0) {
        const totalWeight = comparables.reduce((s, c) => s + c.quality_score, 0)
        if (totalWeight > 0) {
          estimatedValue = Math.round(
            comparables.reduce((s, c) => s + c.price * c.quality_score, 0) / totalWeight
          )
          weightedQuality = totalWeight / compCount
        }

        // Confidence based on number and quality of comparables
        valuationConfidence = Math.min(95, Math.round(
          20 + compCount * 8 + weightedQuality * 30
        ))
      }

      // ── Step 3: Discount Percentage ───────────────────────────────
      const discount = estimatedValue > 0 && asset.price_amount > 0
        ? ((estimatedValue - asset.price_amount) / estimatedValue) * 100
        : 0

      // Round to 2 decimal places
      const discountRounded = Math.round(discount * 100) / 100

      // ── Step 4: Multi-Factor Opportunity Score ─────────────────────
      // All sub-scores are [0..100]

      // 4a. Price Score (weight: 35%)
      // If price is below estimated value (discount > 0), price is good
      // If price is above estimated value (discount < 0), price is bad
      // Baseline at 50 for at-market price
      const priceScore = Math.min(100, Math.max(0,
        50 + discountRounded * 2.5
      ))

      // 4b. Comparable Quality Score (weight: 25%)
      // Based on average quality score of comparables found
      const compQualityScore = compCount > 0 && weightedQuality > 0
        ? Math.round(weightedQuality * 100)
        : 15 // Low score if no comparables

      // 4c. Confidence / Data Quality Score (weight: 15%)
      const dataQualityScore = Math.min(100, Math.max(10,
        valuationConfidence
      ))

      // 4d. Liquidity Score (weight: 10%)
      // Cheaper properties are more liquid
      const price = asset.price_amount || 0
      const liquidityScore = price > 0
        ? Math.min(100, Math.max(10,
            price <= 50000 ? 90 :
            price <= 150000 ? 75 :
            price <= 300000 ? 60 :
            price <= 500000 ? 45 :
            price <= 1000000 ? 30 : 15
          ))
        : 50

      // 4e. Seller Motivation Score (weight: 10%)
      // Bank/agent-sold properties may have more motivation
      const sellerType = (asset.seller_type || '').toLowerCase()
      const sellerScore = sellerType === 'bank' ? 70
        : sellerType === 'agent' ? 55
        : 45 // individual owner

      // 4f. Location Specificity Score (weight: 5%)
      // More specific location data = more confidence
      const loc = asset.location || {}
      const locScore = (loc.neighborhood || '').trim()
        ? 80
        : (loc.district || '').trim()
          ? 60
          : (loc.province || '').trim()
            ? 40
            : 20

      // ═══════════════════════════════════════════════════════════
      // FINAL COMPOSITE SCORE (configurable weights from .env)
      // ═══════════════════════════════════════════════════════════
      const wPrice = parseFloat(process.env.SCORE_WEIGHT_PRICE_VALUE) || 0.35
      const wComps = parseFloat(process.env.SCORE_WEIGHT_COMPARABLES) || 0.25
      const wData = parseFloat(process.env.SCORE_WEIGHT_RISK || process.env.SCORE_WEIGHT_CONFIDENCE) || 0.15
      const wLiq = parseFloat(process.env.SCORE_WEIGHT_LIQUIDITY) || 0.10
      const wSeller = parseFloat(process.env.SCORE_WEIGHT_SELLER_MOTIVATION) || 0.10
      const wLoc = parseFloat(process.env.SCORE_WEIGHT_LOCATION) || 0.05

      const finalScore = Math.min(100, Math.max(0, Math.round(
        priceScore         * wPrice +
        compQualityScore   * wComps +
        dataQualityScore   * wData +
        liquidityScore     * wLiq +
        sellerScore        * wSeller +
        locScore           * wLoc
      )))

      const confidence = valuationConfidence

      logStage.info(`Scored: ${cleanTitle(asset.title) || asset.asset_id} → ${finalScore}/100 (${gradeForScore(finalScore)}), comps: ${compCount}, est: $${estimatedValue}, disc: ${discountRounded}%`)

      scored.push({
        asset,
        comparables,
        estimatedValue,
        discount: discountRounded,
        score: finalScore,
        grade: gradeForScore(finalScore),
        confidence,
        // Sub-scores for explainability
        scoreFactors: {
          priceScore: Math.round(priceScore),
          compQualityScore,
          dataQualityScore,
          liquidityScore,
          sellerScore,
          locScore,
        },
      })
    } catch (err) {
      logStage.error(`Error scoring asset ${asset.title || 'unknown'}`, err.message)
      // Still push with fallback to avoid breaking the pipeline
      scored.push({
        asset,
        comparables: [],
        estimatedValue: asset.price_amount,
        discount: 0,
        score: 25,
        grade: 'D',
        confidence: 10,
        scoreFactors: {
          priceScore: 25,
          compQualityScore: 10,
          dataQualityScore: 10,
          liquidityScore: 50,
          sellerScore: 50,
          locScore: 20,
        },
        error: err.message,
      })
    }
  }

  report.scorer.analyzed = scored.length
  report.scorer.duration_ms = Date.now() - scoreStart

  // Log distribution
  const dist = { A: 0, B: 0, C: 0, D: 0 }
  for (const s of scored) {
    const g = s.grade.charAt(0)
    dist[g] = (dist[g] || 0) + 1
  }
  logStage.stats({
    'Assets analyzed': report.scorer.analyzed,
    'Grade distribution': Object.entries(dist).map(([k, v]) => `${k}=${v}`).join(', '),
    'Scoring time': log.module().duration(report.scorer.duration_ms),
  })

  return scored
}
