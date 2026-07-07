import { useMapStore } from '../../stores/mapStore'

const LAYERS = [
  { key: 'propiedades', label: '📍 Propiedades', default: true },
  { key: 'heatmap', label: '🔥 Heatmap', default: false },
  { key: 'poligonos', label: '🔷 Polígonos', default: false },
  { key: 'marketTrend', label: '📈 Market Trend', default: false },
]

export function MapLayerToggle() {
  const { layers, toggleLayer } = useMapStore()

  return (
    <div className="map-layers-panel">
      <h4>Capas</h4>
      {LAYERS.map(l => (
        <label key={l.key} className="layer-toggle-item">
          <input
            type="checkbox"
            checked={(layers as any)[l.key]}
            onChange={() => toggleLayer(l.key)}
          />
          <span>{l.label}</span>
        </label>
      ))}
    </div>
  )
}
