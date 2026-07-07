import { create } from 'zustand'

interface FilterState {
  provincia: string | null
  distrito: string | null
  corregimiento: string | null
  tipos: string[]
  precioMin: number | null
  precioMax: number | null
  areaMin: number | null
  bedrooms: number[]
  fuentes: string[]
  scoreMin: number | null
  roiMin: number | null
  confidenceMin: number | null
  riesgo: 'bajo' | 'medio' | 'alto' | null
  acciones: string[]
  fechaDesde: string | null
  fechaHasta: string | null
  searchQuery: string
  setFilter: (key: string, value: any) => void
  clearAll: () => void
  activeFilterCount: () => number
}

const initialState = {
  provincia: null,
  distrito: null,
  corregimiento: null,
  tipos: [],
  precioMin: null,
  precioMax: null,
  areaMin: null,
  bedrooms: [],
  fuentes: [],
  scoreMin: null,
  roiMin: null,
  confidenceMin: null,
  riesgo: null,
  acciones: [],
  fechaDesde: null,
  fechaHasta: null,
  searchQuery: '',
}

export const useFilterStore = create<FilterState>((set, get) => ({
  ...initialState,
  setFilter: (key, value) => set({ [key]: value }),
  clearAll: () => set(initialState),
  activeFilterCount: () => {
    const s = get()
    let count = 0
    if (s.provincia) count++
    if (s.distrito) count++
    if (s.corregimiento) count++
    if (s.tipos.length > 0) count++
    if (s.precioMin !== null || s.precioMax !== null) count++
    if (s.areaMin !== null) count++
    if (s.bedrooms.length > 0) count++
    if (s.fuentes.length > 0) count++
    if (s.scoreMin !== null) count++
    if (s.roiMin !== null) count++
    if (s.confidenceMin !== null) count++
    if (s.riesgo) count++
    if (s.acciones.length > 0) count++
    if (s.fechaDesde || s.fechaHasta) count++
    if (s.searchQuery) count++
    return count
  },
}))
