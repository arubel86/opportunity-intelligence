import type { FilterChipProps } from '../../types/components'

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="filter-chip">
      {label}
      <button className="filter-chip-remove" onClick={onRemove}>✕</button>
    </span>
  )
}
