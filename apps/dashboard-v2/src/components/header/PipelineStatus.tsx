import type { PipelineStatusProps } from '../../types/components'

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  running: { label: 'Pipeline corriendo', color: 'var(--semantic-buy)', icon: '🔄' },
  completed: { label: 'Pipeline OK', color: 'var(--semantic-buy)', icon: '✅' },
  failed: { label: 'Pipeline falló', color: 'var(--semantic-avoid)', icon: '❌' },
  idle: { label: 'Pipeline idle', color: 'var(--text-tertiary)', icon: '⏸️' },
}

export function PipelineStatus({ status, lastRun, durationMs }: PipelineStatusProps) {
  const s = STATUS_MAP[status] || STATUS_MAP.idle

  return (
    <div className="pipeline-status" style={{ color: s.color }}>
      <span>{s.icon}</span>
      <span>{s.label}</span>
      {durationMs != null && (
        <span className="pipeline-duration">
          {(durationMs / 1000).toFixed(1)}s
        </span>
      )}
    </div>
  )
}
