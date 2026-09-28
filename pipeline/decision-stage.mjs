/**
 * Pipeline Stage: Decision Engine
 * Generates investment decisions for scored assets.
 *
 * Thresholds (revised for new multi-factor scoring):
 *   >= 80  → BUY_NOW
 *   >= 65  → WATCH_HIGH_PRIORITY
 *   >= 50  → NEGOTIATE
 *   >= 35  → WATCH
 *   <  35  → AVOID
 */

import { profileForDecision, cleanTitle } from './utils.mjs'

/**
 * Generate investment decisions for scored assets.
 * @param {object} ctx Pipeline context { scored, log, report }
 * @returns {Promise<Array>} Scored results with decisions attached
 */
export async function run(ctx) {
  const { scored, log, report } = ctx
  const logStage = log.module('DECISION_ENGINE')
  logStage.section('INVESTMENT DECISIONS')

  let buyNow = 0
  let watchHigh = 0
  let negotiate = 0
  let watch = 0
  let avoid = 0

  const decided = scored.map(result => {
    const { score, confidence, asset, comparables, estimatedValue, discount, grade, scoreFactors } = result

    // ── Determine action ─────────────────────────────────────────
    let action = 'AVOID'
    if (score >= 80) action = 'BUY_NOW'
    else if (score >= 65) action = 'WATCH_HIGH_PRIORITY'
    else if (score >= 50) action = 'NEGOTIATE'
    else if (score >= 35) action = 'WATCH'

    if (action === 'BUY_NOW') buyNow++
    else if (action === 'WATCH_HIGH_PRIORITY') watchHigh++
    else if (action === 'NEGOTIATE') negotiate++
    else if (action === 'WATCH') watch++
    else avoid++

    const urgencyLevel = score >= 80 ? 5 : score >= 65 ? 4 : score >= 50 ? 3 : score >= 35 ? 2 : 1
    const title = cleanTitle(asset.title) || 'property'

    // ── Build explainability text ─────────────────────────────────
    const compCount = (comparables || []).length
    const factorsPositive = []
    const factorsNegative = []

    if (discount > 5) factorsPositive.push(`Precio ${discount.toFixed(1)}% por debajo del valor estimado`)
    else if (discount > 0) factorsPositive.push(`Precio ${discount.toFixed(1)}% por debajo del valor estimado`)
    else if (discount < -5) factorsNegative.push(`Precio ${Math.abs(discount).toFixed(1)}% por encima del valor estimado`)
    else if (discount < 0) factorsNegative.push(`Precio ligeramente por encima del valor estimado`)

    if (scoreFactors?.compQualityScore >= 70) factorsPositive.push(`Comparables de alta calidad (${compCount} encontrados)`)
    else if (scoreFactors?.compQualityScore >= 40) factorsPositive.push(`Calidad de comparables moderada (${compCount} encontrados)`)
    else factorsNegative.push(`Datos comparables limitados (${compCount} comps)`)

    if (scoreFactors?.liquidityScore >= 60) factorsPositive.push('Buena liquidez (rango de precio accesible)')
    else if (scoreFactors?.liquidityScore < 30) factorsNegative.push('Baja liquidez (rango de precio alto)')

    if (scoreFactors?.locScore >= 60) factorsPositive.push('Ubicación específica disponible')
    else factorsNegative.push('Detalle de ubicación limitado')

    const thesisText = [
      `${grade} ${title} — $${asset.price_amount?.toLocaleString() || '?'}`,
      `Score: ${score}/100 | Confianza: ${confidence}% | Comps: ${compCount}`,
      `Valor estimado: $${estimatedValue?.toLocaleString() || '?'} | Descuento: ${discount?.toFixed(1) || '0'}%`,
      factorsPositive.length ? `✅ ${factorsPositive.join(', ')}` : '',
      factorsNegative.length ? `⚠️ ${factorsNegative.join(', ')}` : '',
    ].filter(Boolean).join(' | ')

    return {
      ...result,
      decision: action,
      decisionDetails: {
        recommended_action: action,
        investment_profile: profileForDecision(action),
        thesis_text: thesisText,
        urgency_level: urgencyLevel,
        capital_recommendation: {
          max_bid_pct: discount > 0
            ? Math.min(100, 100 + Math.round(discount * 0.5))
            : 95,
          hold_period_months: score >= 65 ? 12 : score >= 50 ? 18 : 24,
        },
        risk_factors: {
          score_grade: grade,
          confidence_pct: confidence,
          comparable_quality: comparables?.length > 0
            ? Math.round(comparables.reduce((s, c) => s + c.quality_score, 0) / comparables.length * 100) / 100
            : null,
          discount_pct: discount,
          estimated_value: estimatedValue,
        },
        score_factors: scoreFactors || {},
      },
    }
  })

  report.scorer.buy_now = buyNow
  report.scorer.watch_high = watchHigh
  report.scorer.negotiate = negotiate
  report.scorer.watch = watch
  report.scorer.avoid = avoid

  logStage.stats({
    'Decisions generated': decided.length,
    BUY_NOW: buyNow,
    'WATCH_HIGH': watchHigh,
    NEGOTIATE: negotiate,
    WATCH: watch,
    AVOID: avoid,
  })

  return decided
}
