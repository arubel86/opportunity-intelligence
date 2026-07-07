import { useComparables } from '../../hooks/useComparables'
import { ComparableCard } from './ComparableCard'
import { LoadingState } from '../shared/LoadingState'

interface ComparablesListProps {
  assetId: string
  onSelectComparable: (assetId: string) => void
}

export function ComparablesList({ assetId, onSelectComparable }: ComparablesListProps) {
  const { comparables, isLoading } = useComparables(assetId)

  if (isLoading) {
    return (
      <div className="detail-section">
        <h4>📋 Comparables</h4>
        <LoadingState type="skeleton" count={3} />
      </div>
    )
  }

  if (comparables.length === 0) {
    return (
      <div className="detail-section">
        <h4>📋 Comparables</h4>
        <p className="dim">Sin comparables disponibles</p>
      </div>
    )
  }

  return (
    <div className="detail-section">
      <h4>📋 Comparables ({comparables.length} propiedades)</h4>
      <p className="comparables-subtitle">Usados por Hermes para evaluación</p>
      <div className="comparables-list">
        {comparables.map((c: any) => (
          <ComparableCard
            key={c.comparison_id}
            comparable={c}
            onClick={onSelectComparable}
          />
        ))}
      </div>
    </div>
  )
}
