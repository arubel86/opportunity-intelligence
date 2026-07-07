import { usePipelineRuns } from '../../hooks/usePipelineRuns'
import { useAssets } from '../../hooks/useAssets'
import { useUIStore } from '../../stores/uiStore'
import { LoadingState } from '../shared/LoadingState'
import type { PipelineRun } from '../../types/components'

function formatDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleString('es-PA')
}

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'var(--semantic-buy)'
    case 'running': return 'var(--semantic-watch-high)'
    case 'failed': return 'var(--semantic-avoid)'
    default: return 'var(--text-tertiary)'
  }
}

export function AdminPanel() {
  const { runs, isLoading } = usePipelineRuns(50)
  const { assets } = useAssets()
  const { adminMode } = useUIStore()

  if (!adminMode) return null

  if (isLoading) {
    return (
      <div className="admin-panel">
        <LoadingState type="spinner" message="Cargando admin..." />
      </div>
    )
  }

  const lastRun = runs[0] || null
  const totalScraped = runs.reduce((s, r) => s + (r.assets_scraped || 0), 0)
  const totalErrors = runs.reduce((s, r) => s + (r.errors_count || 0), 0)
  const avgDuration = runs.length
    ? Math.round(runs.reduce((s, r) => s + (r.duration_ms || 0), 0) / runs.length)
    : 0

  return (
    <div className="admin-panel">
      <h3>⚙️ Panel Técnico (Admin)</h3>

      {/* Status cards */}
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat-label">Último run</span>
          <span className="admin-stat-value" style={{ color: lastRun ? statusColor(lastRun.status) : 'var(--text-tertiary)' }}>
            {lastRun?.status || 'N/A'}
          </span>
          <span className="admin-stat-sub">{lastRun ? formatDate(lastRun.started_at) : '—'}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Assets totales</span>
          <span className="admin-stat-value">{assets.length}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Scrapeados</span>
          <span className="admin-stat-value">{totalScraped.toLocaleString()}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Errores</span>
          <span className="admin-stat-value" style={{ color: totalErrors > 0 ? 'var(--semantic-avoid)' : 'var(--text-secondary)' }}>
            {totalErrors}
          </span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Duración prom.</span>
          <span className="admin-stat-value">{(avgDuration / 1000).toFixed(1)}s</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Pipeline runs</span>
          <span className="admin-stat-value">{runs.length}</span>
        </div>
      </div>

      {/* Pipeline runs table */}
      <h4>📜 Pipeline Runs</h4>
      <div className="admin-table">
        <div className="admin-table-header">
          <span>Status</span>
          <span>Inicio</span>
          <span>Assets</span>
          <span>Scored</span>
          <span>Errores</span>
          <span>Duración</span>
        </div>
        {runs.slice(0, 20).map((r) => (
          <div key={r.run_id} className="admin-table-row">
            <span style={{ color: statusColor(r.status) }}>{r.status}</span>
            <span>{formatDate(r.started_at)}</span>
            <span>{r.assets_scraped ?? '—'}</span>
            <span>{r.assets_scored ?? '—'}</span>
            <span style={{ color: (r.errors_count ?? 0) > 0 ? 'var(--semantic-avoid)' : 'var(--text-secondary)' }}>
              {r.errors_count ?? 0}
            </span>
            <span>{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
