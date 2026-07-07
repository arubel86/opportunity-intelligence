import { create } from 'zustand'

interface UIState {
  adminMode: boolean
  toggleAdmin: () => void
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  adminMode: false,
  toggleAdmin: () => set((s) => ({ adminMode: !s.adminMode })),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
