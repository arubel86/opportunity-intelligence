import type { KpiCardProps } from '../../types/components'

export function KpiCard({ label, value, icon, trend, color = 'default', loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="kpi-card kpi-loading">
        <div className="skeleton-block" style={{ width: '40px', height: '24px' }} />
        <div className="skeleton-block" style={{ width: '60px', height: '12px' }} />
      </div>
    )
  }

  return (
    <div className={`kpi-card kpi-${color}`}>
      {icon && <span className="kpi-icon">{icon}</span>}
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
      {trend && (
        <span className={`kpi-trend trend-${trend.direction}`}>
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
          {Math.abs(trend.pct)}%
        </span>
      )}
    </div>
  )
}
