import { useSummary } from '../../hooks/useSummary'
import { useAssets } from '../../hooks/useAssets'
import { usePipelineRuns } from '../../hooks/usePipelineRuns'
import { useUIStore } from '../../stores/uiStore'
import { KpiCard } from './KpiCard'
import { PipelineStatus } from './PipelineStatus'

export function HeaderBar() {
  const { summary, isLoading } = useSummary()
  const { assets } = useAssets()
  const { runs } = usePipelineRuns(1)
  const { adminMode, toggleAdmin } = useUIStore()

  const totalAssets = summary?.total_active_assets ?? 0
  const buyNow = summary?.buy_now_count ?? 0
  const watch = summary?.watch_count ?? 0
  const negotiate = summary?.negotiate_count ?? 0
  const avoid = summary?.avoid_count ?? 0
  const avgScore = summary?.avg_score ?? 0
  const avgConf = summary?.avg_confidence ?? 0
  const highPriority = buyNow + watch

  const lastRun = runs[0] || null
  const pipelineStatus = lastRun?.status || 'idle'
  const pipelineDuration = lastRun?.duration_ms

  const lastScraped = assets.length > 0
    ? new Date(assets[0].last_seen_at).toLocaleString('es-PA')
    : null

  return (
    <header className="header-bar">
      <div className="header-left">
        <h1 className="header-logo">🏠 HOIE</h1>
        <span className="header-subtitle">Geospatial Intelligence Center</span>
      </div>

      <div className="header-kpis">
        <KpiCard label="Activos" value={totalAssets} loading={isLoading} />
        <KpiCard label="Oportunidades" value={highPriority} color="buy" loading={isLoading} />
        <KpiCard label="BUY NOW" value={buyNow} color="buy" loading={isLoading} />
        <KpiCard label="NEGOTIATE" value={negotiate} color="negotiate" loading={isLoading} />
        <KpiCard label="WATCH" value={watch} color="watch" loading={isLoading} />
        <KpiCard label="AVOID" value={avoid} color="avoid" loading={isLoading} />
        <KpiCard label="Score Avg" value={avgScore.toFixed(0)} loading={isLoading} />
        <KpiCard label="Confidence" value={`${avgConf.toFixed(0)}%`} loading={isLoading} />
      </div>

      <div className="header-right">
        <PipelineStatus status={pipelineStatus as any} durationMs={pipelineDuration ?? undefined} />
        {lastScraped && (
          <span className="header-timestamp">
            🕐 {lastScraped}
          </span>
        )}
        <button
          className={`admin-toggle ${adminMode ? 'active' : ''}`}
          onClick={toggleAdmin}
        >
          ⚙️ Admin
        </button>
      </div>
    </header>
  )
}