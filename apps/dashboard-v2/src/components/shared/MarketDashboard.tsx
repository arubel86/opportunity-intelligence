import { useMemo } from 'react'
import { useAssets } from '../../hooks/useAssets'
import { useFilterStore } from '../../stores/filterStore'
import type { AssetPipelineRow } from '../../types/components'

interface ProvinceMetrics {
  province: string
  totalAssets: number
  avgPrice: number
  avgScore: number
  buyNowCount: number
  avgConfidence: number
}

function aggregateByProvince(assets: AssetPipelineRow[]): ProvinceMetrics[] {
  const groups: Record<string, { prices: number[]; scores: number[]; confidences: number[]; buyNow: number; total: number }> = {}

  for (const a of assets) {
    const prov = a.location?.province || 'N/D'
    if (!groups[prov]) {
      groups[prov] = { prices: [], scores: [], confidences: [], buyNow: 0, total: 0 }
    }
    if (a.price_amount) groups[prov].prices.push(a.price_amount)
    if (a.final_score) groups[prov].scores.push(a.final_score)
    if (a.confidence) groups[prov].confidences.push(a.confidence)
    groups[prov].total++
    if (a.recommended_action === 'BUY_NOW') groups[prov].buyNow++
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return Object.entries(groups)
    .map(([province, g]) => ({
      province,
      totalAssets: g.total,
      avgPrice: avg(g.prices),
      avgScore: avg(g.scores),
      buyNowCount: g.buyNow,
      avgConfidence: avg(g.confidences),
    }))
    .sort((a, b) => b.totalAssets - a.totalAssets)
}

function formatPrice(n: number): string {
  if (!n) return '—'
  return '$' + Math.round(n).toLocaleString('en-US')
}

export function MarketDashboard() {
  const { assets } = useAssets()
  const { setFilter } = useFilterStore()
  const provinces = useMemo(() => aggregateByProvince(assets), [assets])

  if (provinces.length === 0) return null

  return (
    <div className="market-dashboard">
      <h3>📊 Mercado por Provincia</h3>
      <div className="province-grid">
        {provinces.map(p => (
          <div
            key={p.province}
            className="province-card"
            onClick={() => setFilter('provincia', p.province)}
          >
            <div className="province-header">
              <span className="province-name">{p.province}</span>
              <span className="province-count">{p.totalAssets} activos</span>
            </div>
            <div className="province-stats">
              <div className="province-stat">
                <span className="stat-label">Precio prom.</span>
                <span className="stat-value">{formatPrice(p.avgPrice)}</span>
              </div>
              <div className="province-stat">
                <span className="stat-label">Score</span>
                <span className="stat-value">{p.avgScore.toFixed(0)}</span>
              </div>
              <div className="province-stat">
                <span className="stat-label">BUY NOW</span>
                <span className="stat-value stat-buy">{p.buyNowCount}</span>
              </div>
              <div className="province-stat">
                <span className="stat-label">Confidence</span>
                <span className="stat-value">{p.avgConfidence.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
