import type { LoadingStateProps } from '../../types/components'

export function LoadingState({ type = 'spinner', count = 5, height = '100%', message }: LoadingStateProps) {
  if (type === 'spinner') {
    return (
      <div className="loading" style={{ height }}>
        <div className="spinner" />
        {message && <p>{message}</p>}
      </div>
    )
  }

  if (type === 'skeleton') {
    return (
      <div className="skeleton-container" style={{ height }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-block" style={{ width: '60%' }} />
            <div className="skeleton-block" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
    )
  }

  // dots
  return (
    <div className="loading" style={{ height }}>
      <div className="dots">
        <span />
        <span />
        <span />
      </div>
      {message && <p>{message}</p>}
    </div>
  )
}
