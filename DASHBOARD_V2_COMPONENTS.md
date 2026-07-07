# Dashboard V2: Catálogo de Componentes

**Versión:** 2.0
**Estado:** BORRADOR PARA APROBACIÓN
**Fecha:** 2026-07-06
**Stack:** React 18 + TypeScript + MapLibre GL JS + Zustand + SWR

---

## Convenciones

Cada componente se documenta con:
- **Props interface** (TypeScript)
- **Estados** (loading, empty, error, selected, etc.)
- **Eventos** (onClick, onChange, onSelect, etc.)
- **Dependencias** (hooks, stores, services que usa)

---

## 1. `<HeaderBar />`

Barra superior de 60px con KPIs y estado del sistema.

```typescript
interface HeaderBarProps {
  // Sin props — lee de useSummary() y usePipelineRuns()
}

// Internamente usa:
// - useSummary() → SWR hook para v_dashboard_summary
// - usePipelineRuns(limit=1) → estado pipeline
// - useRealtime('pipeline_runs') → actualización live
```

**Estados:**
- `loading` → Skeleton de 4 KpiCards
- `loaded` → KPIs reales + pipeline status
- `error` → Banner rojo "Sin conexión"

**Eventos:**
- Click "Modo Admin" → `uiStore.toggleAdmin()`
- Click logo → reset a vista inicial (mapa Panamá zoom 10)

**Dependencias:** useSummary, usePipelineRuns, uiStore

---

## 2. `<KpiCard />`

Tarjeta de KPI reutilizable.

```typescript
interface KpiCardProps {
  label: string           // "Activos Totales"
  value: string | number  // 450
  icon?: React.ReactNode  // 🏠 (SVG)
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    pct: number            // +12.5
  }
  color?: 'default' | 'buy' | 'negotiate' | 'watch' | 'avoid'
  loading?: boolean
}
```

**Estados:** `loading` → skeleton block, `loaded` → valor

**Dependencias:** Ninguna (presentacional)

---

## 3. `<PipelineStatus />`

Indicador de estado del pipeline en header.

```typescript
interface PipelineStatusProps {
  status: 'running' | 'completed' | 'failed' | 'idle'
  lastRun?: string  // ISO timestamp
  durationMs?: number
}
```

**Estados:** running (spinner verde), completed (check verde), failed (x rojo), idle (dot gris)

---

## 4. `<FilterSidebar />`

Sidebar izquierdo (240px) con 15 filtros dinámicos.

```typescript
interface FilterSidebarProps {
  // Sin props — lee/escribe filterStore
}

// Internamente usa:
// - filterStore (Zustand)
// - useAssets() → para poblar dropdown options
// - useDebounce(callback, 300ms)
```

**Filtros incluidos:**

| Filtro | Componente | Source |
|--------|-----------|--------|
| Provincia | `<select>` | `DISTINCT location->>'province'` |
| Distrito | `<select>` (dependiente) | `DISTINCT location->>'district' WHERE province = $1` |
| Corregimiento | `<select>` (dependiente) | `DISTINCT location->>'corregimiento' WHERE district = $1` |
| Tipo | `<multi-select>` | `DISTINCT raw_data->>'property_type'` |
| Precio | `<range-slider min max>` | `MIN/MAX(price_amount)` |
| Área | `<range-slider>` | `MIN/MAX(raw_data->>'area_m2')` |
| Habitaciones | `<multi-select [1,2,3,4,5+]>` | — |
| Fuente | `<multi-select>` | `sources.display_name` |
| Opportunity Score | `<range-slider 0-100>` | — |
| ROI | `<range-slider>` | — |
| Confidence | `<range-slider 0-100>` | — |
| Riesgo | `<select bajo/medio/alto>` | Calculado |
| Acción | `<multi-select>` | `recommended_action` VALUES |
| Banco | `<select>` | Solo si hay fuente banco |
| Fecha | `<date-range-picker>` | `scraped_at` range |

**Eventos:**
- Change en cualquier filtro → `filterStore.setFilter(key, value)` con debounce 300ms
- Click "Limpiar todo" → `filterStore.clearAll()`

**Dependencias:** filterStore, useAssets, useDebounce

---

## 5. `<FilterChip />`

Chip de filtro activo removable.

```typescript
interface FilterChipProps {
  label: string   // "Provincia: Panamá"
  onRemove: () => void
}
```

**Estados:** default, hover (background más oscuro)

**Eventos:** Click "✕" → `onRemove()`

---

## 6. `<MapContainer />`

Wrapper de MapLibre GL JS. Centro del dashboard.

```typescript
interface MapContainerProps {
  // Sin props — lee assets de useAssets() + filterStore
  // Escribe selección a selectionStore
  // Lee/escribe mapStore para zoom, center, layers
}

// Internamente:
// - mapService.init(container) en useEffect
// - mapService.addAssetSource(filteredAssets) en cada update
// - supercluster en web worker para clustering
// - Realtime subscription para updates incrementales
```

**Estados:**
- `loading` → spinner centrado
- `loaded` → mapa con marcadores
- `no-coordinates` → mensaje "Assets sin ubicación, ver tabla"

**Eventos:**
- Map `click` marcador → `selectionStore.selectAsset(id)`
- Map `zoom` change → `mapStore.setZoom(z)`
- Map `move` → `mapStore.setCenter([lng, lat])`

**Dependencias:** useAssets, filterStore, selectionStore, mapStore, mapService, clusterWorker

---

## 7. `<MapLayerToggle />`

Panel de toggles de capas del mapa (esquina superior derecha).

```typescript
interface MapLayerToggleProps {
  // Sin props — lee/escribe mapStore.layers
}

// Capas:
// ☑ Propiedades (default on)
// ☐ Vehículos
// ☐ Bancos
// ☐ Caja de Ahorros
// ☐ Banco Nacional
// ☐ Remates Judiciales
// ☑ Oportunidades (default on)
// ☐ Riesgos
// ☐ Market Trend
// ☐ Heatmap
// ☐ Polígonos
```

**Eventos:** Toggle → `mapStore.toggleLayer(layerName)`

**Dependencias:** mapStore

---

## 8. `<AssetMarker />`

Marcador individual en el mapa.

```typescript
interface AssetMarkerProps {
  asset: AssetPipelineRow
  isSelected: boolean
  onSelect: (assetId: string) => void
}
```

**Cálculo de color:**

```typescript
const ACTION_COLORS: Record<string, string> = {
  BUY_NOW: '#238636',
  WATCH_HIGH_PRIORITY: '#1f6feb',
  NEGOTIATE: '#d29922',
  RESEARCH_MORE: '#d96c1a',
  AVOID: '#f85149',
  MANUAL_REVIEW_REQUIRED: '#64748b',
}

function markerColor(action: string): string {
  return ACTION_COLORS[action] || '#64748b'
}
```

**Cálculo de tamaño:**

```typescript
function markerSize(price: number): number {
  // Escala log: $100K=16px, $500K=24px, $2M=32px, $5M+=40px
  const size = Math.log(price / 100000) * 8 + 16
  return Math.max(16, Math.min(40, size))
}
```

**Estados:** default, hover (scale 1.15), selected (outline blanco + size +4px)

**Eventos:** Click → `onSelect(asset.asset_id)`

---

## 9. `<MarkerCluster />`

Clustering de marcadores para zoom bajo.

```typescript
interface MarkerClusterProps {
  clusters: Supercluster.ClusterFeature[]
  onClusterClick: (clusterId: number, center: [number, number]) => void
}
```

**Cálculo:** Usa supercluster en web worker. El worker recibe GeoJSON de assets y responde con clusters por bbox+zoom.

**Render:** CircleMarker del tamaño del cluster (count). Color dominante del cluster (acción más común).

**Eventos:** Click → `onClusterClick(id, center)` → map zoom in

**Dependencias:** clusterWorker

---

## 10. `<HeatmapLayer />`

Capa de calor del mapa (MapLibre heatmap expression).

```typescript
interface HeatmapLayerProps {
  assets: AssetPipelineRow[]
  visible: boolean
  // Solo assets con final_score >= threshold
  threshold?: number  // default 70
}
```

**Configuración MapLibre:**

```typescript
{
  type: 'heatmap',
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'score'], 70, 0, 100, 1],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(31, 111, 235, 0)',
      0.3, 'rgba(31, 111, 235, 0.3)',   // azul
      0.6, 'rgba(210, 153, 34, 0.5)',   // amarillo
      1, 'rgba(248, 81, 73, 0.8)'       // rojo
    ],
    'heatmap-radius': 30,
    'heatmap-opacity': 0.75,
  }
}
```

---

## 11. `<ZonePolygon />`

Polígono de zona con métricas overlay.

```typescript
interface ZonePolygonProps {
  zoneId: string
  geometry: GeoJSON.Polygon
  metrics: {
    roiPromedio: number
    liquidez: number        // 0-1
    confidence: number      // 0-100
    riesgo: 'bajo' | 'medio' | 'alto'
    marketTrend: 'hot' | 'warm' | 'cool' | 'cold'
    cantidadActivos: number
    tiempoPromedioVenta: number  // días
  }
  isSelected: boolean
  onSelect: (zoneId: string) => void
}
```

**Render:** Polígono semi-transparente con fill color según market trend (hot=verde, warm=amarillo, cool=azul, cold=gris) + outline.

**Label:** Texto flotante en centroide con "Cantidad: X | ROI: Y% | Trend: hot"

**Eventos:** Click → `onSelect(zoneId)` → zoom a polygon bounds + filtra assets por zona

---

## 12. `<MapPopup />`

Popup al hover sobre marcador.

```typescript
interface MapPopupProps {
  asset: AssetPipelineRow
  onClose: () => void
  // Posicionado por MapLibre en lng/lat del marcador
}
```

**Contenido (compacto, <8 campos):**

```
┌──────────────────────────────┐
│ [foto 64x64]  Título (1 línea)  │
│               $250,000          │
│               🟢 COMPRAR  A-     │
│               📊 Score: 85      │
└──────────────────────────────┘
```

**Estados:** visible (opacity 1), closing (opacity 0, 150ms)

**Eventos:** Mouseout del marcador → `onClose()`

---

## 13. `<DetailPanel />`

Panel lateral derecho (360px) con expediente completo.

```typescript
interface DetailPanelProps {
  assetId: string | null  // null = panel cerrado
  onClose: () => void
}

// Internamente:
// - useAssets() → encuentra asset por id
// - useComparables(assetId) → fetch lazy solo si panel abierto
// - useRealtime('assets', assetId) → update si asset cambia
```

**Secciones (scrollable vertical):**

1. `<DetailPhoto />` — foto + galería
2. Ubicación — provincia, distrito, corregimiento + mini mapa
3. Precio — `<PriceRow>` precio, valor estimado, descuento
4. ROI esperado — `<KpiCard>` con `capital_recommendation.expected_roi_year1`
5. `<DetailExplainability />` — razones transparentes
6. `<ComparablesList />` — lista de comparables
7. Historial de precios — `asset_events` timeline
8. Confidence — barra de progreso + número
9. Decision Engine — thesis_text, investment_profile, urgency_level
10. Seller Analysis — seller_type, owner_name
11. Risk Analysis — risk_factors JSONB desglosado
12. Market Trend — por zona o "Datos insuficientes"
13. Fuente original — link + nombre del source

**Botones:**
- "Ver publicación original ↗" → `<a href={source_listing_url} target="_blank">`
- "Abrir expediente completo" → expande todas las secciones colapsadas

**Estados:** closed (translateX 100%), open (translateX 0, 200ms), loading (skeleton)

**Dependencias:** useAssets, useComparables, selectionStore

---

## 14. `<DetailPhoto />`

Foto principal + galería de thumbnails.

```typescript
interface DetailPhotoProps {
  photos: string[]  // URLs de fotos
  alt: string       // title del asset
}
```

**Estados:** loading (skeleton gris 240x160), loaded (foto visible), error (placeholder "Sin foto")

**Galería:** Horizontal scroll de thumbnails (64x48). Click thumbnail → expand foto principal.

**Lazy load:** `loading="lazy"` en `<img>`. IntersectionObserver para cargar cuando visible.

---

## 15. `<DetailExplainability />`

Razones transparentes tipo "✔ Precio 18% debajo del mercado".

```typescript
interface DetailExplainabilityProps {
  score: OpportunityScore | null   // opportunity_scores.components
  riskFactors: RiskFactors | null  // investment_decisions.risk_factors
}

interface RiskFactors {
  estimated_value?: number
  discount_pct?: number
  score_grade?: string
  confidence_pct?: number
  comparable_quality?: number
}
```

**Lógica de razones:**

```typescript
function generateReasons(score: OpportunityScore, risk: RiskFactors): Reason[] {
  const reasons: Reason[] = []
  const components = score.components || {}

  // price_vs_estimated_value
  if (components.price_vs_estimated_value) {
    const disc = risk?.discount_pct ?? 0
    if (disc > 5) {
      reasons.push({ positive: true, text: `Precio ${disc}% debajo del mercado` })
    } else if (disc < -5) {
      reasons.push({ positive: false, text: `Precio ${Math.abs(disc)}% sobre el mercado` })
    }
  }

  // comparables_analysis
  if (components.comparables_analysis) {
    const q = risk?.comparable_quality ?? 0
    if (q > 0.7) {
      reasons.push({ positive: true, text: `Comparables de alta calidad (Quality Score: ${q.toFixed(2)})` })
    } else if (q < 0.4) {
      reasons.push({ positive: false, text: `Comparables de baja calidad (Quality Score: ${q.toFixed(2)})` })
    }
  }

  // location_quality
  if (components.location_quality?.score > 0.7) {
    reasons.push({ positive: true, text: 'Ubicación premium' })
  } else if (components.location_quality?.score < 0.4) {
    reasons.push({ positive: false, text: 'Ubicación deficiente' })
  }

  // market_trend
  if (components.market_trend?.score > 0.7) {
    reasons.push({ positive: true, text: 'Zona con crecimiento anual alto' })
  }

  // liquidity
  if (components.liquidity?.score > 0.7) {
    reasons.push({ positive: true, text: 'Alta liquidez' })
  }

  // risk_assessment
  if (components.risk_assessment?.score > 0.7) {
    reasons.push({ positive: true, text: 'Riesgo legal bajo' })
  } else if (components.risk_assessment?.score < 0.4) {
    reasons.push({ positive: false, text: 'Riesgo legal alto' })
  }

  // confidence
  const conf = score.confidence ?? 0
  if (conf > 80) {
    reasons.push({ positive: true, text: `Confidence ${conf.toFixed(0)}%` })
  }

  return reasons
}
```

**Render:**

```tsx
<ul className="reasons-list">
  {reasons.map((r, i) => (
    <li key={i} className={r.positive ? 'reason-positive' : 'reason-negative'}>
      <span>{r.positive ? '✔' : '✘'}</span>
      <span>{r.text}</span>
    </li>
  ))}
</ul>
```

---

## 16. `<ComparablesList />`

Lista de comparables del asset seleccionado con transparencia total.

```typescript
interface ComparablesListProps {
  assetId: string
}

// Internamente: useComparables(assetId) → SWR lazy fetch
```

**Estados:** loading (3 skeleton cards), loaded (lista de ComparableCard), empty ("Sin comparables disponibles")

**Dependencias:** useComparables

---

## 17. `<ComparableCard />`

Card individual de comparable.

```typescript
interface ComparableCardProps {
  comparable: {
    comparison_id: string
    comp_asset_id: string
    price: number
    distance_km: number
    age_days: number
    quality_score: number  // 0-1, usado como "peso"
    match_reason: string
    comp_asset: {
      title: string
      price_amount: number
      raw_data: {
        area_m2?: number
        bedrooms?: number
        photos?: string[]
      }
      source_listing_url: string
    }
  }
  onClick: (compAssetId: string) => void
}
```

**Render:**

```
┌──────────────────────────────────────────────┐
│ [foto 64x48]  $235,000    📏 1.2 km          │
│               120 m² · 3 hab                  │
│               Peso: ████████░░ 0.85          │
│               "Misma zona, tipo similar"      │
└──────────────────────────────────────────────┘
```

**Eventos:** Click → `onClick(comp_asset_id)` → mapa flyTo + detail panel actualiza

---

## 18. `<OpportunityTable />`

Tabla profesional con sort, filter, export, virtualización.

```typescript
interface OpportunityTableProps {
  // Sin props — lee de useAssets() + filterStore + selectionStore
}

// Internamente:
// - useAssets() → datos
// - filterStore → filtros aplicados client-side
// - selectionStore → row seleccionada
// - @tanstack/react-virtual para virtualización
```

**Columnas:**

| # | Columna | Campo | Sortable | Format |
|---|---------|-------|----------|--------|
| 1 | Score | `final_score` | ✅ | `<GradeBadge score=X />` |
| 2 | Acción | `recommended_action` | ✅ | `<ActionBadge action=X />` |
| 3 | Tipo | `raw_data.property_type` | ✅ | Texto |
| 4 | Precio | `price_amount` | ✅ | `$250,000` |
| 5 | Valor Est. | `risk_factors.estimated_value` | ✅ | `$300,000` |
| 6 | ROI | `capital_recommendation.expected_roi_year1` | ✅ | `+12.5%` |
| 7 | Confidence | `confidence` | ✅ | Barra progreso |
| 8 | Riesgo | Calculado | ✅ | Badge bajo/medio/alto |
| 9 | Fuente | `source_name` | ✅ | Texto |
| 10 | Fecha | `scraped_at` | ✅ | `2024-07-06` |
| 11 | Ver | — | ❌ | Botón "→" |

**Features:**
- **Sort:** Click header toggle asc/desc, icono ▲▼
- **Search:** Input global con debounce 300ms, busca en title, location, source_name
- **Export:** Dropdown "Exportar" → CSV (papaparse) o JSON
- **Virtualización:** @tanstack/react-virtual, overscan 5 filas
- **Row click:** `selectionStore.selectAsset(asset_id)`

**Estados:** loading (8 skeleton rows), empty ("Sin resultados"), loaded

**Dependencias:** useAssets, filterStore, selectionStore

---

## 19. `<GradeBadge />`

Badge de score/grade.

```typescript
interface GradeBadgeProps {
  grade?: string   // 'A+', 'B', 'D', etc.
  score?: number   // 0-100
  size?: 'sm' | 'md' | 'lg'
}
```

**Color mapping:**

```typescript
function gradeColor(grade: string): string {
  const first = grade?.charAt(0) || 'D'
  return {
    A: 'var(--grade-a)',  // verde
    B: 'var(--grade-b)',  // azul
    C: 'var(--grade-c)',  // amarillo
    D: 'var(--grade-d)',  // rojo
  }[first] || 'var(--grade-d)'
}
```

**Render:** `<span class="grade-badge grade-a">{grade}</span>` con score opcional

---

## 20. `<ActionBadge />`

Badge de acción recomendada.

```typescript
interface ActionBadgeProps {
  action: string  // 'BUY_NOW' | 'NEGOTIATE' | etc.
  size?: 'sm' | 'md' | 'lg'
}
```

**Mapping:**

```typescript
const ACTION_MAP: Record<string, { label: string; color: string }> = {
  BUY_NOW: { label: 'COMPRAR', color: 'var(--semantic-buy)' },
  WATCH_HIGH_PRIORITY: { label: 'ALTA PRIORIDAD', color: 'var(--semantic-watch-high)' },
  NEGOTIATE: { label: 'NEGOCIAR', color: 'var(--semantic-negotiate)' },
  RESEARCH_MORE: { label: 'OBSERVAR', color: 'var(--semantic-watch)' },
  AVOID: { label: 'EVITAR', color: 'var(--semantic-avoid)' },
  MANUAL_REVIEW_REQUIRED: { label: 'REVISIÓN', color: 'var(--semantic-neutral)' },
}
```

**Render:** Pill con bg color + text white

---

## 21. `<TimelineSlider />`

Slider temporal 2024-2026.

```typescript
interface TimelineSliderProps {
  minDate: string   // ISO '2024-01-01'
  maxDate: string   // ISO '2026-07-06'
  value: { from: string; to: string }
  onChange: (range: { from: string; to: string }) => void
  // Play mode
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
}
```

**Render:** Range slider con dos handles + botón play/pause. Label de fecha actual.

**Lógica:** al cambiar el range → filtra `useAssets()` por `scraped_at >= from AND scraped_at <= to`

**Play mode:** avanza 1 mes/segundo hasta maxDate

---

## 22. `<MarketDashboard />`

Grid de cards con indicadores por provincia.

```typescript
interface MarketDashboardProps {
  // Sin props — usa useAssets() + agregación client-side GROUP BY province
}

// Internamente:
// - useAssets() → todos los assets
// - useMemo(() => aggregateByProvince(assets), [assets])
```

**Métricas por provincia:**

```typescript
interface ProvinceMetrics {
  province: string
  avgPrice: number
  avgRoi: number
  avgDom: number           // days on market
  marketTrend: 'hot' | 'warm' | 'cool' | 'cold' | 'insufficient'
  totalAssets: number
  opportunityDensity: number  // BUY_NOW count / area km²
  avgConfidence: number
}
```

**Render:** Grid de cards (3 cols en desktop, 1 col mobile). Cada card:

```
┌─────────────────────────┐
│ Panamá            🔥 hot │
│ $250,000 promedio        │
│ ROI: +12.5%              │
│ 450 activos              │
│ Density: 2.3/km²         │
│ Confidence: 78%          │
└─────────────────────────┘
```

**Eventos:** Click card → `filterStore.setFilter('provincia', province)`

---

## 23. `<AdminPanel />`

Dashboard técnico para administradores.

```typescript
interface AdminPanelProps {
  // Solo visible si uiStore.adminMode === true
}

// Internamente:
// - usePipelineRuns(limit=50)
// - useSources() → estado scrapers
// - supabase.auth.getUser() → verificar admin
```

**Secciones:**

1. **Estado Scrapers** — tabla de sources con `is_active` (verde/rojo), `last_run`
2. **Estado Pipeline** — último run: status, duración, assets procesados
3. **Estado Supabase** — ping conectividad
4. **Logs recientes** — `pipeline_runs.error_log` expandible
5. **Métricas** — avg scraping time, avg assets/run, error rate
6. **Pipeline Runs** — tabla de últimos 50 runs

**Eventos:** Click run → expande error_log JSONB en textarea

**Dependencias:** usePipelineRuns, useSources, uiStore

---

## 24. `<LoadingState />`

```typescript
interface LoadingStateProps {
  type: 'spinner' | 'skeleton' | 'dots'
  count?: number  // para skeleton rows
  height?: string // '100px' | '100vh'
  message?: string
}
```

**Variantes:**
- `spinner` → CSS spinner centrado + mensaje
- `skeleton` → N bloques grises con shimmer animation
- `dots` → 3 puntos animados

**Usado por:** HeaderBar, MapContainer, DetailPanel, OpportunityTable, ComparablesList

---

## 25. `<EmptyState />`

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode  // SVG o emoji
  title: string            // "Sin propiedades"
  message: string          // "No hay propiedades disponibles."
  action?: {
    label: string          // "Ejecutar pipeline"
    onClick: () => void
  }
}
```

**Estados:**

| Escenario | Icon | Title | Message |
|-----------|------|-------|---------|
| Sin assets | 🗺️ | "Sin propiedades" | "No hay propiedades disponibles. Ejecuta el pipeline." |
| Sin resultados | 🔍 | "Sin resultados" | "Ninguna propiedad coincide con los filtros activos." |
| Sin comparables | 📋 | "Sin comparables" | "No hay comparables para esta propiedad." |
| Sin coordenadas | 📍 | "Ubicación no disponible" | "Esta propiedad no tiene coordenadas geográficas." |

**Usado por:** OpportunityTable, MapContainer, ComparablesList, DetailPanel

---

## Resumen de Dependencias

```
HeaderBar
├── KpiCard
├── PipelineStatus
└── uiStore (admin toggle)

FilterSidebar
├── FilterChip
├── filterStore
└── useAssets (options)

MapContainer
├── MapLayerToggle
├── AssetMarker
├── MarkerCluster (clusterWorker)
├── HeatmapLayer
├── ZonePolygon
├── MapPopup
├── mapStore
├── selectionStore
└── useAssets

DetailPanel
├── DetailPhoto
├── DetailExplainability
├── ComparablesList
│   └── ComparableCard
├── OpportunityScore (components)
├── InvestmentDecisions (risk_factors)
└── useComparables

OpportunityTable
├── GradeBadge
├── ActionBadge
├── selectionStore
├── filterStore
└── useAssets

TimelineSlider → filterStore (scraped_at range)
MarketDashboard → useAssets (agregación)
AdminPanel → usePipelineRuns, useSources, uiStore
LoadingState / EmptyState → usados por todos
```

---

**Fin del Components — DASHBOARD_V2_COMPONENTS.md**