import type { ActionBadgeProps } from '../../types/components'

const ACTION_MAP: Record<string, { label: string; color: string }> = {
  BUY_NOW: { label: 'COMPRAR', color: 'var(--semantic-buy)' },
  WATCH_HIGH_PRIORITY: { label: 'ALTA', color: 'var(--semantic-watch-high)' },
  NEGOTIATE: { label: 'NEGOCIAR', color: 'var(--semantic-negotiate)' },
  RESEARCH_MORE: { label: 'OBSERVAR', color: 'var(--semantic-watch)' },
  WATCH: { label: 'OBSERVAR', color: 'var(--semantic-watch)' },
  AVOID: { label: 'EVITAR', color: 'var(--semantic-avoid)' },
  MANUAL_REVIEW_REQUIRED: { label: 'REVISIÓN', color: 'var(--semantic-neutral)' },
}

export function ActionBadge({ action, size = 'md' }: ActionBadgeProps) {
  const m = ACTION_MAP[action] || { label: action, color: 'var(--semantic-neutral)' }

  return (
    <span
      className={`action-badge action-badge-${size}`}
      style={{ backgroundColor: m.color + '22', color: m.color }}
    >
      {m.label}
    </span>
  )
}
