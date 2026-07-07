import type { EmptyStateProps } from '../../types/components'

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h2>{title}</h2>
      <p>{message}</p>
      {action && (
        <button onClick={action.onClick} className="empty-state-action">
          {action.label}
        </button>
      )}
    </div>
  )
}
