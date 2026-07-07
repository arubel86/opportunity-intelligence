import type { ComparableCardProps } from '../../types/components'

function formatPrice(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—'
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function ComparableCard({ comparable, onClick }: ComparableCardProps) {
  const qualityPct = Math.round((comparable.quality_score || 0) * 100)

  return (
    <div
      className="comparable-card"
      onClick={() => onClick(comparable.comp_asset_id)}
    >
      <div className="comparable-main">
        <div className="comparable-price">{formatPrice(comparable.price)}</div>
        <div className="comparable-meta">
          <span>📏 {comparable.distance_km?.toFixed(1)} km</span>
          {comparable.comp_asset?.raw_data?.area_m2 && (
            <span>📐 {comparable.comp_asset.raw_data.area_m2} m²</span>
          )}
          {comparable.comp_asset?.raw_data?.bedrooms && (
            <span>🛏 {comparable.comp_asset.raw_data.bedrooms} hab</span>
          )}
        </div>
      </div>
      <div className="comparable-quality">
        <div className="quality-bar">
          <div className="quality-fill" style={{ width: `${qualityPct}%` }} />
        </div>
        <span className="quality-label">Peso: {qualityPct}%</span>
      </div>
      {comparable.match_reason && (
        <div className="comparable-reason">"{comparable.match_reason}"</div>
      )}
    </div>
  )
}
