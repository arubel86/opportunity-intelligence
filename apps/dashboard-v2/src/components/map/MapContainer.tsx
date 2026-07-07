import { useEffect, useRef, useCallback, useState } from 'react'
import { MapService } from '../../services/mapService'
import { useAssets } from '../../hooks/useAssets'
import { useSelectionStore } from '../../stores/selectionStore'
import { useMapStore } from '../../stores/mapStore'
import { MapLayerToggle } from './MapLayerToggle'
import { LoadingState } from '../shared/LoadingState'

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapService | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const { assets, isLoading } = useAssets()
  const { openDetail } = useSelectionStore()
  const { layers } = useMapStore()

  const handleSelect = useCallback((id: string) => {
    openDetail(id)
  }, [openDetail])

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return

    const service = new MapService()
    mapRef.current = service

    service.init(containerRef.current).then(() => {
      setMapReady(true)
    })

    return () => {
      service.destroy()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Update markers when assets change or map becomes ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || assets.length === 0) return
    mapRef.current.addAssetMarkers(assets, handleSelect)
  }, [mapReady, assets, handleSelect])

  // Toggle heatmap
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    if (layers.heatmap) {
      mapRef.current.addHeatmapLayer(assets)
    } else {
      mapRef.current.removeHeatmapLayer()
    }
  }, [mapReady, layers.heatmap, assets])

  return (
    <div className="map-area">
      <div ref={containerRef} className="map-container" />
      {mapReady && <MapLayerToggle />}
      {isLoading && !mapReady && (
        <div className="map-loading-overlay">
          <LoadingState type="spinner" message="Cargando mapa..." />
        </div>
      )}
    </div>
  )
}