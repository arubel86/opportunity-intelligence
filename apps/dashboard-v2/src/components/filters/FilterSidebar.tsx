import { useFilterStore } from '../../stores/filterStore'
import { useAssets } from '../../hooks/useAssets'
import { FilterChip } from './FilterChip'
import { useDebounce } from '../../hooks/useDebounce'

const ACCIONES = [
  { value: 'BUY_NOW', label: '🟢 Comprar' },
  { value: 'WATCH_HIGH_PRIORITY', label: '🔵 Alta Prioridad' },
  { value: 'NEGOTIATE', label: '🟡 Negociar' },
  { value: 'RESEARCH_MORE', label: '🟠 Observar' },
  { value: 'AVOID', label: '🔴 Evitar' },
]

export function FilterSidebar() {
  const filters = useFilterStore()
  const { assets } = useAssets()

  // Get unique provinces
  const provincias = [...new Set(assets.map(a => a.location?.province).filter(Boolean))] as string[]
  const fuentes = [...new Set(assets.map(a => a.source_name).filter(Boolean))] as string[]

  const activeFilters: { key: string; label: string }[] = []
  if (filters.provincia) activeFilters.push({ key: 'provincia', label: `Provincia: ${filters.provincia}` })
  if (filters.distrito) activeFilters.push({ key: 'distrito', label: `Distrito: ${filters.distrito}` })
  if (filters.acciones.length > 0) activeFilters.push({ key: 'acciones', label: `Acción: ${filters.acciones.join(', ')}` })
  if (filters.scoreMin) activeFilters.push({ key: 'scoreMin', label: `Score ≥ ${filters.scoreMin}` })
  if (filters.searchQuery) activeFilters.push({ key: 'searchQuery', label: `Buscar: "${filters.searchQuery}"` })

  return (
    <aside className="filter-sidebar">
      <div className="filter-header">
        <h2>Filtros</h2>
        {filters.activeFilterCount() > 0 && (
          <button className="filter-clear" onClick={filters.clearAll}>
            Limpiar ({filters.activeFilterCount()})
          </button>
        )}
      </div>

      {/* Active chips */}
      {activeFilters.length > 0 && (
        <div className="filter-chips">
          {activeFilters.map(f => (
            <FilterChip
              key={f.key}
              label={f.label}
              onRemove={() => filters.setFilter(f.key, null)}
            />
          ))}
        </div>
      )}

      {/* Provincia */}
      <div className="filter-group">
        <label>📍 Provincia</label>
        <select
          value={filters.provincia || ''}
          onChange={e => filters.setFilter('provincia', e.target.value || null)}
        >
          <option value="">Todas</option>
          {provincias.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Acción */}
      <div className="filter-group">
        <label>🏷 Acción</label>
        <div className="filter-checkboxes">
          {ACCIONES.map(a => (
            <label key={a.value} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.acciones.includes(a.value)}
                onChange={e => {
                  const next = e.target.checked
                    ? [...filters.acciones, a.value]
                    : filters.acciones.filter(x => x !== a.value)
                  filters.setFilter('acciones', next)
                }}
              />
              {a.label}
            </label>
          ))}
        </div>
      </div>

      {/* Opportunity Score */}
      <div className="filter-group">
        <label>📊 Opportunity Score ≥ {filters.scoreMin ?? 0}</label>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.scoreMin ?? 0}
          onChange={e => filters.setFilter('scoreMin', Number(e.target.value) || null)}
        />
      </div>

      {/* Confidence */}
      <div className="filter-group">
        <label>🎯 Confidence ≥ {filters.confidenceMin ?? 0}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={filters.confidenceMin ?? 0}
          onChange={e => filters.setFilter('confidenceMin', Number(e.target.value) || null)}
        />
      </div>

      {/* Fuente */}
      <div className="filter-group">
        <label>🔗 Fuente</label>
        <select
          value={filters.fuentes[0] || ''}
          onChange={e => filters.setFilter('fuentes', e.target.value ? [e.target.value] : [])}
        >
          <option value="">Todas</option>
          {fuentes.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Search */}
      <div className="filter-group">
        <label>🔍 Buscar</label>
        <input
          type="text"
          placeholder="Título, ubicación..."
          value={filters.searchQuery}
          onChange={e => filters.setFilter('searchQuery', e.target.value)}
        />
      </div>
    </aside>
  )
}
