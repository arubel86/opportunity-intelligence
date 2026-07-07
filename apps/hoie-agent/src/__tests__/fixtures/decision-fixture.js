// Investment Decision Engine for Reality Benchmark
// Matches Golden Dataset decision logic exactly
export class DecisionEngine {
  makeDecision(score, asset, marketContext = {}) {
    const s = score.final_score
    const conf = score.confidence

    // Golden Dataset formula
    if (s >= 80 && conf >= 75) {
      return {
        asset_id: asset.assetId,
        recommended_action: 'BUY_NOW',
        priority: 'immediate',
        reason: `Score ${s} (${score.grade}) con ${conf}% confianza. Cumple criterios BUY_NOW (score≥80, confidence≥75).`,
        risk_level: 'low',
        confidence_level: conf,
        score_components: score.components
      }
    }
    if (s >= 65 && conf >= 70) {
      return {
        asset_id: asset.assetId,
        recommended_action: 'WATCH_HIGH_PRIORITY',
        priority: 'high',
        reason: `Score ${s} (${score.grade}) con ${conf}% confianza. Cumple criterios WATCH (score≥65, confidence≥70).`,
        risk_level: 'medium',
        confidence_level: conf,
        score_components: score.components
      }
    }
    if (s >= 50 && conf >= 65) {
      return {
        asset_id: asset.assetId,
        recommended_action: 'NEGOTIATE',
        priority: 'medium',
        reason: `Score ${s} (${score.grade}) con ${conf}% confianza. Cumple criterios NEGOTIATE (score≥50, confidence≥65). Requiere negociación.`,
        risk_level: 'medium_high',
        confidence_level: conf,
        score_components: score.components
      }
    }
    if (conf < 65) {
      return {
        asset_id: asset.assetId,
        recommended_action: 'MANUAL_REVIEW_REQUIRED',
        priority: 'pending',
        reason: `Confianza insuficiente (${conf}%) para decisión automatizada. Requiere revisión manual.`,
        risk_level: 'high',
        confidence_level: conf,
        score_components: score.components
      }
    }
    return {
      asset_id: asset.assetId,
      recommended_action: 'AVOID',
      priority: 'none',
      reason: `Score ${s} (${score.grade}) con ${conf}% confianza. No cumple criterios mínimos de inversión.`,
      risk_level: 'high',
      confidence_level: conf,
      score_components: score.components
    }
  }
}
