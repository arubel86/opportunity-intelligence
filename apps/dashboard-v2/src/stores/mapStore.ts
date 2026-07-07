import { create } from 'zustand'

interface MapState {
  zoom: number
  center: [number, number] // [lng, lat]
  layers: {
    propiedades: boolean
    vehiculos: boolean
    bancos: boolean
    remates: boolean
    heatmap: boolean
    poligonos: boolean
    marketTrend: boolean
  }
  setZoom: (z: number) => void
  setCenter: (c: [number, number]) => void
  toggleLayer: (layer: string) => void
}

export const useMapStore = create<MapState>((set) => ({
  zoom: 10,
  center: [-79.5199, 8.9824], // Panamá
  layers: {
    propiedades: true,
    vehiculos: false,
    bancos: false,
    remates: false,
    heatmap: false,
    poligonos: false,
    marketTrend: false,
  },
  setZoom: (z) => set({ zoom: z }),
  setCenter: (c) => set({ center: c }),
  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !(state.layers as any)[layer],
      },
    })),
}))
