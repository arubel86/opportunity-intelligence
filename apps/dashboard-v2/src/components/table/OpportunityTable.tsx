import { useMemo, useState } from 'react'
import { useAssets } from '../../hooks/useAssets'
import { useFilterStore } from '../../stores/filterStore'
import { useSelectionStore } from '../../stores/selectionStore'
import { GradeBadge } from './GradeBadge'
import { ActionBadge } from './ActionBadge'
import { EmptyState } from '../shared/EmptyState'
import { LoadingState } from '../shared/LoadingState'

type SortKey = 'final_score' | 'price_amount' | 'confidence' | 'last_seen_at' | 'source_name'
type SortDir = 'asc' | 'desc'

function formatPrice(n: number | null): string {
  if (n == null || isNaN(n)) return '—'
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatDate(s: string | null): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-PA')
}

export function OpportunityTable() {
  const { assets, isLoading } = useAssets()
  const filters = useFilterStore()
  const { openDetail } = useSelectionStore()
  const [sortKey, setSortKey] = useState<SortKey>('final_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    const filtered = assets.filter(a => {
      if (filters.provincia && a.location?.province !== filters.provincia) return false
      if (filters.distrito && a.location?.district !== filters.distrito) return false
      if (filters.acciones.length > 0 && !filters.acciones.includes(a.recommended_action || '')) return false
      if (filters.scoreMin && (a.final_score ?? 0) < filters.scoreMin) return false
      if (filters.confidenceMin && (a.confidence ?? 0) < filters.confidenceMin) return false
      if (filters.fuentes.length > 0 && !filters.fuentes.includes(a.source_name || '')) return false
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase()
        const haystack = [a.title, a.location?.province, a.location?.district, a.source_name]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    filtered.sort((a, b) => {
      let av: any, bv: any
      switch (sortKey) {
        case 'final_score': av = a.final_score ?? 0; bv = b.final_score ?? 0; break
        case 'price_amount': av = a.price_amount ?? 0; bv = b.price_amount ?? 0; break
        case 'confidence': av = a.confidence ?? 0; bv = b.confidence ?? 0; break
        case 'last_seen_at': av = a.last_seen_at || ''; bv = b.last_seen_at || ''; break
        case 'source_name': av = a.source_name || ''; bv = b.source_name || ''; break
        default: return 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [assets, filters, sortKey, sortDir])

  if (isLoading) {
    return <LoadingState type="skeleton" count={8} />
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="Sin resultados"
        message="Ninguna propiedad coincide con los filtros activos."
      />
    )
  }

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="sort-icon">
      {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </span>
  )

  return (
    <div className="opportunity-table-wrapper">
      <div className="table-toolbar">
        <span className="table-count">{sorted.length} propiedades</span>
      </div>
      <div className="opportunity-table">
        <div className="table-header">
          <span className="col-score sortable" onClick={() => handleSort('final_score')}>
            Score <SortIcon col="final_score" />
          </span>
          <span className="col-action">Acción</span>
          <span className="col-title">Título</span>
          <span className="col-price sortable" onClick={() => handleSort('price_amount')}>
            Precio <SortIcon col="price_amount" />
          </span>
          <span className="col-confidence sortable" onClick={() => handleSort('confidence')}>
            Conf <SortIcon col="confidence" />
          </span>
          <span className="col-source sortable" onClick={() => handleSort('source_name')}>
            Fuente <SortIcon col="source_name" />
          </span>
          <span className="col-date sortable" onClick={() => handleSort('last_seen_at')}>
            Fecha <SortIcon col="last_seen_at" />
          </span>
          <span className="col-detail">→</span>
        </div>
        {sorted.map(a => (
          <div
            key={a.asset_id}
            className={`table-row ${useSelectionStore.getState().selectedAssetId === a.asset_id ? 'row-selected' : ''}`}
            onClick={() => openDetail(a.asset_id)}
          >
            <span className="col-score">
              <GradeBadge grade={a.grade || undefined} score={a.final_score ?? undefined} size="sm" />
            </span>
            <span className="col-action">
              <ActionBadge action={a.recommended_action || ''} size="sm" />
            </span>
            <span className="col-title" title={a.title || ''}>
              {(a.title || 'Sin título').slice(0, 50)}
            </span>
            <span className="col-price">{formatPrice(a.price_amount)}</span>
            <span className="col-confidence">{a.confidence != null ? `${a.confidence}%` : '—'}</span>
            <span className="col-source">{a.source_name}</span>
            <span className="col-date">{formatDate(a.last_seen_at)}</span>
            <span className="col-detail">→</span>
          </div>
        ))}
      </div>
    </div>
  )
}