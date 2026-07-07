import { create } from 'zustand'

interface SelectionState {
  selectedAssetId: string | null
  selectAsset: (id: string | null) => void
  detailPanelOpen: boolean
  openDetail: (id: string) => void
  closeDetail: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedAssetId: null,
  selectAsset: (id) => set({ selectedAssetId: id }),
  detailPanelOpen: false,
  openDetail: (id) => set({ selectedAssetId: id, detailPanelOpen: true }),
  closeDetail: () => set({ detailPanelOpen: false, selectedAssetId: null }),
}))
