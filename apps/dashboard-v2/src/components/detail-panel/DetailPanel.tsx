import { useSelectionStore } from '../../stores/selectionStore'
import { useAssets } from '../../hooks/useAssets'
import { ActionBadge } from '../table/ActionBadge'
import { GradeBadge } from '../table/GradeBadge'
import { DetailExplainability } from './DetailExplainability'
import { ComparablesList } from './ComparablesList'
import { DetailPhoto } from './DetailPhoto'

function formatPrice(n: number | null): string {
  if (n == null || isNaN(n)) return '—'
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-PA')
}

export function DetailPanel() {
  const { selectedAssetId, detailPanelOpen, closeDetail } = useSelectionStore()
  const { assets } = useAssets()

  if (!detailPanelOpen || !selectedAssetId) return null

  const asset = assets.find(a => a.asset_id === selectedAssetId)
  if (!asset) return null

  const loc = asset.location
  const locStr = [loc?.province, loc?.district, loc?.corregimiento].filter(Boolean).join(', ') || 'N/D'
  const estimatedValue = asset.risk_factors?.estimated_value
  const discountPct = asset.risk_factors?.discount_pct
  const roi = asset.capital_recommendation?.expected_roi_year1
  const raw = asset.raw_data || {}
  const photos: string[] = raw.photos || []
  const specs = [
    raw.bedrooms && `${raw.bedrooms} hab`,
    raw.bathrooms && `${raw.bathrooms} bañ`,
    raw.area_m2 && `${raw.area_m2} m²`,
    raw.parking && `${raw.parking} estac.`,
  ].filter(Boolean).join(' · ')

  // Build OpportunityScore from asset fields for Explainability
  const scoreForExplain = asset.final_score != null ? {
    score_id: '',
    asset_id: asset.asset_id,
    version: 1,
    components: asset.components,
    final_score: asset.final_score,
    grade: asset.grade || '',
    confidence: asset.confidence ?? 0,
    model_version: '',
    calculated_at: asset.scored_at || '',
  } : null

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h2>Detalle</h2>
        <button className="detail-close" onClick={closeDetail}>✕</button>
      </div>

      <div className="detail-content">
        {/* Photo */}
        <DetailPhoto photos={photos} alt={asset.title || 'Propiedad'} />

        {/* Title + badges */}
        <div className="detail-title">
          <div className="detail-badges">
            <ActionBadge action={asset.recommended_action || ''} />
            <GradeBadge grade={asset.grade || undefined} score={asset.final_score ?? undefined} />
          </div>
          <h3>{asset.title || 'Sin título'}</h3>
          <p className="detail-location">📍 {locStr}</p>
          {specs && <p className="detail-specs">{specs}</p>}
        </div>

        {/* Price */}
        <div className="detail-section">
          <h4>💰 Precio</h4>
          <div className="detail-price-row">
            <span className="detail-price">{formatPrice(asset.price_amount)}</span>
            {estimatedValue != null && (
              <span className="detail-estimated">
                Est: {formatPrice(estimatedValue)}
                {discountPct != null && (
                  <span className={`detail-discount ${discountPct > 0 ? 'positive' : 'negative'}`}>
                    {' '}{discountPct > 0 ? '+' : ''}{discountPct.toFixed(1)}%
                  </span>
                )}
              </span>
            )}
          </div>
          {roi != null && (
            <p className="detail-roi">📈 ROI esperado: +{roi.toFixed(1)}% YoY</p>
          )}
        </div>

        {/* Explainability — pass proper OpportunityScore object */}
        <DetailExplainability score={scoreForExplain} riskFactors={asset.risk_factors} />

        {/* Confidence */}
        <div className="detail-section">
          <h4>🎯 Confidence</h4>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{ width: `${asset.confidence ?? 0}%` }} />
          </div>
          <span className="confidence-value">{asset.confidence ?? 0}%</span>
        </div>

        {/* Comparables */}
        <ComparablesList
          assetId={asset.asset_id}
          onSelectComparable={() => {}}
        />

        {/* Decision Engine */}
        <div className="detail-section">
          <h4>⚙️ Decision Engine</h4>
          <div className="decision-grid">
            <div className="decision-item">
              <span className="decision-label">Perfil</span>
              <span>{asset.investment_profile || '—'}</span>
            </div>
            <div className="decision-item">
              <span className="decision-label">Urgencia</span>
              <span>{asset.urgency_level ?? '—'}/5</span>
            </div>
          </div>
          {asset.thesis_text && <p className="detail-thesis">{asset.thesis_text}</p>}
        </div>

        {/* Seller Analysis */}
        <div className="detail-section">
          <h4>🏢 Seller Analysis</h4>
          <div className="decision-grid">
            <div className="decision-item">
              <span className="decision-label">Tipo</span>
              <span>{asset.seller_type === 'agent' ? 'Agente/Agencia' : 'Dueño directo'}</span>
            </div>
            <div className="decision-item">
              <span className="decision-label">Propietario</span>
              <span>{asset.owner_name || '—'}</span>
            </div>
          </div>
        </div>

        {/* Source */}
        <div className="detail-section">
          <h4>🔗 Fuente</h4>
          <p>{asset.source_name}</p>
          <p className="dim">Visto: {formatDate(asset.last_seen_at)}</p>
          {(asset as any).source_listing_url && (
            <a href={(asset as any).source_listing_url} target="_blank" rel="noopener noreferrer" className="detail-link">
              Ver publicación original ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}