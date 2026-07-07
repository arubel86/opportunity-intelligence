import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFilterStore } from '../stores/filterStore'

describe('filterStore', () => {
  beforeEach(() => {
    useFilterStore.getState().clearAll()
  })

  it('has correct initial state', () => {
    const state = useFilterStore.getState()
    expect(state.provincia).toBeNull()
    expect(state.distrito).toBeNull()
    expect(state.acciones).toEqual([])
    expect(state.searchQuery).toBe('')
  })

  it('sets a filter', () => {
    useFilterStore.getState().setFilter('provincia', 'Panamá')
    expect(useFilterStore.getState().provincia).toBe('Panamá')
  })

  it('clears all filters', () => {
    useFilterStore.getState().setFilter('provincia', 'Panamá')
    useFilterStore.getState().setFilter('acciones', ['BUY_NOW'])
    useFilterStore.getState().clearAll()
    const state = useFilterStore.getState()
    expect(state.provincia).toBeNull()
    expect(state.acciones).toEqual([])
  })

  it('counts active filters', () => {
    useFilterStore.getState().setFilter('provincia', 'Panamá')
    useFilterStore.getState().setFilter('acciones', ['BUY_NOW'])
    useFilterStore.getState().setFilter('scoreMin', 70)
    expect(useFilterStore.getState().activeFilterCount()).toBe(3)
  })

  it('returns 0 for no active filters', () => {
    expect(useFilterStore.getState().activeFilterCount()).toBe(0)
  })
})
