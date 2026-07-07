import * as maplibregl from 'maplibre-gl'
import type { AssetPipelineRow } from '../types/components'
import { assetsToGeoJSON } from '../types/map'

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export class MapService {
  private map: maplibregl.Map | null = null
  private loaded = false

  init(container: HTMLElement): Promise<maplibregl.Map> {
    return new Promise((resolve) => {
      this.map = new maplibregl.Map({
        container,
        style: DARK_STYLE,
        center: [-79.5199, 8.9824], // Panamá
        zoom: 10,
        attributionControl: {} as any,
      })

      this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      this.map.on('load', () => {
        this.loaded = true
        resolve(this.map!)
      })
    })
  }

  isLoaded(): boolean {
    return this.loaded
  }

  addAssetMarkers(
    assets: AssetPipelineRow[],
    onSelect: (id: string) => void
  ) {
    if (!this.map || !this.loaded) return

    const geojson = assetsToGeoJSON(assets)

    // Update existing source data instead of remove+recreate (prevents flicker)
    if (this.map.getSource('assets')) {
      ;(this.map.getSource('assets') as maplibregl.GeoJSONSource).setData(geojson)
      return
    }

    // First time — add source + layer
    this.map.addSource('assets', { type: 'geojson', data: geojson })

    this.map.addLayer({
      id: 'asset-circles',
      type: 'circle',
      source: 'assets',
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['get', 'price'],
          0, 16,
          100000, 16,
          500000, 24,
          2000000, 32,
          5000000, 40,
        ],
        'circle-color': [
          'match', ['get', 'action'],
          'BUY_NOW', '#238636',
          'WATCH_HIGH_PRIORITY', '#1f6feb',
          'NEGOTIATE', '#d29922',
          'RESEARCH_MORE', '#d96c1a',
          'AVOID', '#f85149',
          '#64748b',
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff44',
        'circle-opacity': 0.85,
      },
    })

    // Click handler
    this.map.on('click', 'asset-circles', (e) => {
      const feature = e.features?.[0]
      if (feature?.properties?.id) {
        onSelect(feature.properties.id)
      }
    })

    // Hover handlers — cursor change
    this.map.on('mouseenter', 'asset-circles', () => {
      if (this.map) this.map.getCanvas().style.cursor = 'pointer'
    })

    this.map.on('mouseleave', 'asset-circles', () => {
      if (this.map) this.map.getCanvas().style.cursor = ''
    })
  }

  addHeatmapLayer(assets: AssetPipelineRow[]) {
    if (!this.map || !this.loaded) return

    const geojson = assetsToGeoJSON(
      assets.filter(a => (a.final_score ?? 0) >= 70)
    )

    if (this.map.getSource('heatmap-source')) {
      ;(this.map.getSource('heatmap-source') as maplibregl.GeoJSONSource).setData(geojson)
    } else {
      this.map.addSource('heatmap-source', { type: 'geojson', data: geojson })
    }

    if (!this.map.getLayer('heatmap-layer')) {
      this.map.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'score'], 70, 0, 100, 1],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(31, 111, 235, 0)',
            0.3, 'rgba(31, 111, 235, 0.3)',
            0.6, 'rgba(210, 153, 34, 0.5)',
            1, 'rgba(248, 81, 73, 0.8)',
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 0.75,
        },
      }, 'asset-circles')
    }
  }

  removeHeatmapLayer() {
    if (!this.map || !this.loaded) return
    if (this.map.getLayer('heatmap-layer')) {
      this.map.removeLayer('heatmap-layer')
    }
    if (this.map.getSource('heatmap-source')) {
      this.map.removeSource('heatmap-source')
    }
  }

  flyTo(lng: number, lat: number, zoom = 14) {
    this.map?.flyTo({ center: [lng, lat], zoom, duration: 1000 })
  }

  getMap() {
    return this.map
  }

  destroy() {
    this.map?.remove()
    this.map = null
    this.loaded = false
  }
}