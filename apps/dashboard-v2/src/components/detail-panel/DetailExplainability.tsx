import type { OpportunityScore, RiskFactors, Reason } from '../../types/components'

function generateReasons(score: OpportunityScore | null, risk: RiskFactors | null): Reason[] {
  const reasons: Reason[] = []
  if (!score) return reasons

  const components = score.components || {}

  // price_vs_estimated_value
  if (components.price_vs_estimated_value) {
    const disc = risk?.discount_pct ?? 0
    if (disc > 5) {
      reasons.push({ positive: true, text: `Precio ${disc.toFixed(0)}% debajo del mercado` })
    } else if (disc < -5) {
      reasons.push({ positive: false, text: `Precio ${Math.abs(disc).toFixed(0)}% sobre el mercado` })
    }
  }

  // comparables_analysis
  if (components.comparables_analysis) {
    const q = risk?.comparable_quality ?? 0
    if (q > 0.7) {
      reasons.push({ positive: true, text: `Comparables de alta calidad (Score: ${q.toFixed(2)})` })
    } else if (q < 0.4) {
      reasons.push({ positive: false, text: `Comparables de baja calidad (Score: ${q.toFixed(2)})` })
    }
  }

  // location_quality
  if (components.location_quality) {
    const s = components.location_quality.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Ubicación premium' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Ubicación deficiente' })
  }

  // market_trend
  if (components.market_trend) {
    const s = components.market_trend.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Zona con crecimiento alto' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Zona con crecimiento bajo' })
  }

  // liquidity
  if (components.liquidity) {
    const s = components.liquidity.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Alta liquidez' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Baja liquidez' })
  }

  // risk_assessment
  if (components.risk_assessment) {
    const s = components.risk_assessment.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Riesgo legal bajo' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Riesgo legal alto' })
  }

  // seller_motivation
  if (components.seller_motivation) {
    const s = components.seller_motivation.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Vendedor motivado' })
  }

  // confidence
  const conf = score.confidence ?? 0
  if (conf > 80) {
    reasons.push({ positive: true, text: `Confidence ${conf.toFixed(0)}%` })
  } else if (conf < 50) {
    reasons.push({ positive: false, text: `Confidence baja (${conf.toFixed(0)}%)` })
  }

  return reasons
}

interface DetailExplainabilityProps {
  score: OpportunityScore | null
  riskFactors: RiskFactors | null
}

export function DetailExplainability({ score, riskFactors }: DetailExplainabilityProps) {
  const reasons = generateReasons(score, riskFactors)

  if (reasons.length === 0) {
    return (
      <div className="detail-section">
        <h4>🧠 Explainability</h4>
        <p className="dim">Sin datos de análisis disponibles</p>
      </div>
    )
  }

  return (
    <div className="detail-section">
      <h4>🧠 Explainability</h4>
      <ul className="reasons-list">
        {reasons.map((r, i) => (
          <li key={i} className={r.positive ? 'reason-positive' : 'reason-negative'}>
            <span className="reason-icon">{r.positive ? '✔' : '✘'}</span>
            <span>{r.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
