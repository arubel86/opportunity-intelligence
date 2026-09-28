# Dashboard V2: Flujo de Datos

**Versión:** 2.0
**Estado:** BORRADOR PARA APROBACIÓN
**Fecha:** 2026-07-06
**Plataforma:** Hermes Opportunity Intelligence Platform (HOIE)

---

## 1. Queries Supabase

Todas las queries usan el cliente Supabase JS y mapean a vistas/tablas existentes (migraciones 001-006 aplicadas).

### 1.1 Dashboard Load (inicial)

Tres queries en paralelo al cargar el dashboard:

```typescript
// Query 1: KPIs del header — usa vista existente
const { data: summary } = await supabase
  .from('v_dashboard_summary')
  .select('*')
  .single()
// Retorna: { total_active_assets, buy_now_count, watch_count,
//            negotiate_count, avoid_count, avg_score, avg_confidence,
//            avg_price, total_portfolio_value }

// Query 2: Assets para mapa + tabla — usa vista existente
const { data: assets } = await supabase
  .from('v_asset_pipeline')
  .select('*')
  .order('final_score', { ascending: false, nullsFirst: false })
  .limit(500)
// Retorna: [{ asset_id, source_id, source_name, vertical, title,
//   price_amount, price_currency, location, seller_type, status,
//   final_score, grade, confidence, components, recommended_action,
//   investment_profile, thesis_text, urgency_level,
//   first_seen_at, last_seen_at, scored_at, decision_at }]

// Query 3: Sources para layer toggles
const { data: sources } = await supabase
  .from('sources')
  .select('source_id, name, display_name, vertical, is_active')
  .eq('is_active', true)
```

### 1.2 Detail Panel (selección de asset)

```typescript
// Query 4: Comparables — lazy load solo cuando detail panel se abre
const { data: comparables } = await supabase
  .from('comparisons')
  .select(`
    comparison_id, price, distance_km, age_days,
    quality_score, match_reason,
    comp_asset:assets!comparisons_comp_asset_id_fkey (
      asset_id, title, price_amount, raw_data, source_listing_url
    )
  `)
  .eq('asset_id', selectedAssetId)
  .order('quality_score', { ascending: false })

// Query 5: Asset events (historial de precios) — si asset_events existe
const { data: events } = await supabase
  .from('asset_events')
  .select('*')
  .eq('asset_id', selectedAssetId)
  .order('created_at', { ascending: false })
  .limit(20)
```

### 1.3 Admin Panel

```typescript
// Query 6: Pipeline runs recientes
const { data: runs } = await supabase
  .from('pipeline_runs')
  .select('*')
  .order('started_at', { ascending: false })
  .limit(50)

// Query 7: Dashboard metrics (cache)
const { data: metrics } = await supabase
  .from('dashboard_metrics')
  .select('metric_key, metric_value, updated_at')
  .in('metric_key', ['pipeline_status', 'source_list', 'province_aggregates'])
```

### 1.4 Market Dashboard

```typescript
// Query 8: Agregación por provincia — client-side desde assets ya cargados
// (No hay vista server-side; se calcula en frontend con useMemo)
function aggregateByProvince(assets: AssetPipelineRow[]) {
  const groups = {}
  for (const a of assets) {
    const prov = a.location?.province || 'N/D'
    if (!groups[prov]) {
      groups[prov] = { province: prov, prices: [], scores: [], confidences: [], buyNow: 0, total: 0 }
    }
    groups[prov].prices.push(a.price_amount || 0)
    groups[prov].scores.push(a.final_score || 0)
    groups[prov].confidences.push(a.confidence || 0)
    groups[prov].total++
    if (a.recommended_action === 'BUY_NOW') groups[prov].buyNow++
  }
  return Object.values(groups).map(g => ({
    province: g.province,
    avgPrice: avg(g.prices),
    avgScore: avg(g.scores),
    avgConfidence: avg(g.confidences),
    totalAssets: g.total,
    buyNowCount: g.buyNow,
    opportunityDensity: g.buyNow / g.total,
  }))
}
```

### 1.5 Timeline (slider temporal)

```typescript
// Query 9: Assets por rango de fechas — client-side filter desde assets cargados
function filterByDateRange(assets: AssetPipelineRow[], from: string, to: string) {
  return assets.filter(a => {
    const date = a.scraped_at || a.first_seen_at
    return date >= from && date <= to
  })
}
```

---

## 2. Patrones de Fetch

### 2.1 SWR (Stale-While-Revalidate)

```typescript
// hooks/useAssets.ts
import useSWR from 'swr'
import { fetchAssets } from '../services/supabaseService'

export function useAssets() {
  const { data, error, isLoading, mutate } = useSWR('v_asset_pipeline', fetchAssets, {
    revalidateOnFocus: false,     // no revalidar al volver a la tab
    revalidateIfStale: true,     // sí si hay datos stale
    dedupingInterval: 5000,      // dedup requests dentro de 5s
    refreshInterval: 60000,      // revalidar cada 60s
  })
  return { assets: data, error, isLoading, mutate }
}
```

### 2.2 Realtime Subscriptions

```typescript
// hooks/useRealtime.ts
export function useRealtime() {
  const { mutate: mutateAssets } = useAssets()
  const { mutate: mutateSummary } = useSummary()

  useEffect(() => {
    // Channel: assets — inserts/updates/deletes
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assets' },
        (payload) => {
          // Nuevo asset → mutate SWR cache (revalida)
          mutateAssets()
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'assets' },
        (payload) => {
          mutateAssets()
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'opportunity_scores' },
        () => mutateAssets()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'investment_decisions' },
        () => { mutateAssets(); mutateSummary() }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pipeline_runs' },
        () => mutateSummary()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])
}
```

### 2.3 Pagination (Tabla)

```typescript
// Cursor-based pagination para la tabla
async function fetchAssetsPaginated(cursor: number = 0, limit: number = 100) {
  const { data, error } = await supabase
    .from('v_asset_pipeline')
    .select('*')
    .order('final_score', { ascending: false, nullsFirst: false })
    .range(cursor, cursor + limit - 1)
  return data
}

// En el componente:
// const { assets, loadMore, hasMore } = usePagination('v_asset_pipeline', 100)
```

### 2.4 Debounce en Filtros

```typescript
// utils/useDebounce.ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// En FilterSidebar:
const debouncedFilters = useDebounce(filterStore, 300)
useEffect(() => {
  applyFilters(debouncedFilters)  // client-side filter
}, [debouncedFilters])
```

---

## 3. Transformaciones de Datos (DB → UI)

### 3.1 Assets → GeoJSON (MapLibre source)

```typescript
function assetsToGeoJSON(assets: AssetPipelineRow[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: assets
      .filter(a => a.location?.coordinates?.lat && a.location?.coordinates?.lng)
      .map(a => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [a.location.coordinates.lng, a.location.coordinates.lat]  // [lng, lat]
        },
        properties: {
          id: a.asset_id,
          title: a.title,
          price: a.price_amount,
          score: a.final_score,
          action: a.recommended_action,
          confidence: a.confidence,
          source: a.source_name,
        }
      }))
  }
}
```

### 3.2 Geocoding Fallback

```typescript
// Para assets SIN coordinates en DB
async function ensureCoordinates(asset: AssetPipelineRow): Promise<{lat: number, lng: number} | null> {
  // 1. Si ya tiene coordinates → usar
  if (asset.location?.coordinates?.lat) {
    return asset.location.coordinates
  }

  // 2. Geocoding por provincia+district (cacheado en IndexedDB)
  const cacheKey = `${asset.location?.province}|${asset.location?.district}`
  const cached = await idbGet(cacheKey)
  if (cached) return cached

  // 3. Nominatim fallback (rate-limited 1 req/s)
  const coords = await geocodeService.geocode(asset.location?.province, asset.location?.district)
  if (coords) await idbSet(cacheKey, coords)
  return coords
}
```

### 3.3 Action → Marker Color

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

### 3.4 Price → Marker Size

```typescript
function markerSize(price: number): number {
  // Escala log: $100K=16px, $500K=24px, $2M=32px, $5M+=40px
  if (!price || price <= 0) return 16
  const size = Math.log(price / 100000) * 8 + 16
  return Math.max(16, Math.min(40, size))
}
```

### 3.5 Score Components → Reasons (Explainability)

```typescript
function generateReasons(score: OpportunityScore, risk: RiskFactors): Reason[] {
  const reasons: Reason[] = []
  const components = score.components || {}

  // price_vs_estimated_value
  if (components.price_vs_estimated_value) {
    const disc = risk?.discount_pct ?? 0
    if (disc > 5) {
      reasons.push({ positive: true, text: `Precio ${disc.toFixed(0)}% debajo del mercado` })
    } else if (disc < -5) {
      reasons.push({ positive: false, text: `Precio ${Math.abs(disc).toFixed(0)}% sobre el mercado` })
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
  if (components.location_quality) {
    const s = components.location_quality.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Ubicación premium' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Ubicación deficiente' })
  }

  // market_trend
  if (components.market_trend) {
    const s = components.market_trend.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Zona con crecimiento anual alto' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Zona con crecimiento estancado' })
  }

  // liquidity
  if (components.liquidity) {
    const s = components.liquidity.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Alta liquidez' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Baja liquidez' })
  }

  // risk_assessment
  if (components.risk_assessment) {
    const s = components.risk_assessment.score
    if (s > 0.7) reasons.push({ positive: true, text: 'Riesgo legal bajo' })
    else if (s < 0.4) reasons.push({ positive: false, text: 'Riesgo legal alto' })
  }

  // confidence
  const conf = score.confidence ?? 0
  if (conf > 80) {
    reasons.push({ positive: true, text: `Confidence ${conf.toFixed(0)}%` })
  } else if (conf < 50) {
    reasons.push({ positive: false, text: `Confidence baja (${conf.toFixed(0)}%)` })
  }

  return reasons
}
```

### 3.6 Comparisons → ComparableCard Props

```typescript
function toComparableCardProps(comp: ComparisonRow): ComparableCardProps['comparable'] {
  return {
    comparison_id: comp.comparison_id,
    comp_asset_id: comp.comp_asset_id,
    price: comp.price,
    distance_km: comp.distance_km,
    age_days: comp.age_days,
    quality_score: comp.quality_score,
    match_reason: comp.match_reason,
    comp_asset: {
      title: comp.comp_asset?.title || 'N/D',
      price_amount: comp.comp_asset?.price_amount || 0,
      raw_data: comp.comp_asset?.raw_data || {},
      source_listing_url: comp.comp_asset?.source_listing_url || '',
    }
  }
}
```

---

## 4. Mapeo de Acciones de Usuario a Queries

### 4.1 Usuario abre dashboard

```typescript
// App.tsx
useEffect(() => {
  Promise.all([
    fetchSummary(),
    fetchAssets(500),
    fetchSources(),
  ]).then(([summary, assets, sources]) => {
    // Poblar stores
  })
}, [])

// → mapService.addAssetSource(assetsToGeoJSON(assets))
// → HeaderBar renderiza summary
// → MapContainer renderiza assets con coordinates
// → OpportunityTable renderiza assets
```

### 4.2 Usuario filtra por provincia

```typescript
// Si <500 assets cargados → client-side filter (0ms)
const filtered = useAssets().assets.filter(a =>
  a.location?.province === filterStore.provincia
)

// Si >500 assets → server-side query
if (assets.length >= 500) {
  const { data } = await supabase
    .from('v_asset_pipeline')
    .select('*')
    .ilike('location->>province', `%${filterStore.provincia}%`)
}
```

### 4.3 Usuario selecciona marcador

```typescript
// selectionStore.selectAsset(id)
// → DetailPanel se abre
// → useComparables(id) → SWR lazy fetch
// → DetailPanel renderiza expediente + comparables
```

### 4.4 Usuario mueve slider temporal

```typescript
// Client-side filter sobre assets ya cargados
const filtered = assets.filter(a => {
  const date = a.scraped_at || a.first_seen_at
  return date >= timeline.from && date <= timeline.to
})
// → mapService.addAssetSource(assetsToGeoJSON(filtered))
// → OpportunityTable re-render con filtered
```

### 4.5 Usuario toggle admin

```typescript
// uiStore.toggleAdmin()
// → AdminPanel reemplaza DetailPanel
// → usePipelineRuns() → SWR fetch pipeline_runs
// → AdminPanel renderiza tabla de runs
```

### 4.6 Usuario exporta tabla

```typescript
// 100% client-side desde assets filtrados
function exportCSV(assets: AssetPipelineRow[]) {
  const csv = Papa.unparse(assets.map(a => ({
    Score: a.final_score,
    Acción: a.recommended_action,
    Tipo: a.raw_data?.property_type,
    Precio: a.price_amount,
    ValorEstimado: a.risk_factors?.estimated_value,
    Confidence: a.confidence,
    Fuente: a.source_name,
    Fecha: a.scraped_at,
  })))
  downloadBlob(csv, 'oportunidades.csv', 'text/csv')
}
```

### 4.7 Usuario busca en tabla

```typescript
// Client-side filter con debounce 300ms
const debouncedSearch = useDebounce(searchQuery, 300)
const filtered = assets.filter(a =>
  a.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
  a.source_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
  a.location?.province?.toLowerCase().includes(debouncedSearch.toLowerCase())
)
```

---

## 5. Caché

### 5.1 Server-side (Pre-computado por pipeline runner)

```sql
-- Tabla dashboard_metrics (ya existe) poblada por pipeline runner
INSERT INTO dashboard_metrics (metric_key, metric_value) VALUES
  ('pipeline_status', '{"status": "completed", "last_run": "2026-07-06T22:00:00Z", "assets": 450}'),
  ('summary_kpis', '{"total_active_assets": 450, "buy_now_count": 23, "avg_score": 72.5, ...}'),
  ('source_list', '[{"source_id": "...", "name": "Encuentra24", "is_active": true}]'),
  ('province_aggregates', '[{"province": "Panamá", "avg_price": 250000, ...}]')
ON CONFLICT (metric_key) DO UPDATE SET
  metric_value = EXCLUDED.metric_value,
  updated_at = NOW();
```

### 5.2 Client-side

| Capa | Tecnología | TTL | Invalidación |
|------|-----------|-----|-------------|
| Assets (mapa+tabla) | SWR cache | 60s revalidate | Realtime INSERT/UPDATE |
| Summary (KPIs) | SWR cache | 30s revalidate | Realtime pipeline_runs |
| Comparables | SWR cache | 300s | Selección de asset |
| Pipeline runs | SWR cache | 30s | Realtime INSERT |
| Map tiles | Browser cache | 7 días | Cache headers del tile server |
| Geocoding | IndexedDB | Permanente | Manual (botón refresh) |

### 5.3 Invalidación

```
Realtime INSERT assets       → mutateAssets()
Realtime UPDATE assets       → mutateAssets()
Realtime INSERT scores       → mutateAssets()
Realtime INSERT decisions    → mutateAssets() + mutateSummary()
Realtime INSERT pipeline_runs → mutateSummary() + mutatePipelineRuns()
Filtro aplicado              → client-side filter (no invalidación SWR)
```

---

## 6. Realtime

### 6.1 Channels

| Channel | Event | Tabla | Acción |
|---------|-------|-------|--------|
| `dashboard-realtime` | INSERT | `assets` | `mutateAssets()` — nuevo marcador |
| `dashboard-realtime` | UPDATE | `assets` | `mutateAssets()` — refresh marcador |
| `dashboard-realtime` | INSERT | `opportunity_scores` | `mutateAssets()` — score update |
| `dashboard-realtime` | INSERT | `investment_decisions` | `mutateAssets()` + `mutateSummary()` |
| `dashboard-realtime` | INSERT | `pipeline_runs` | `mutateSummary()` + `mutatePipelineRuns()` |

### 6.2 Throttling

- Max 1 update por segundo por SWR key (SWR dedupInterval)
- Realtime events se batchean si llegan en ráfaga
- Marcadores individuales no parpadean: update batch cada 1s, no por cada event

```typescript
// SWR configura dedup para evitar spam de revalidación
useSWR('v_asset_pipeline', fetcher, { dedupingInterval: 1000 })
```

---

## 7. Performance con miles de Assets

### 7.1 Clustering en Web Worker

```typescript
// clusterWorker.ts
import Supercluster from 'supercluster'

let index: Supercluster

self.onmessage = (e) => {
  const { type, data, bbox, zoom } = e.data
  if (type === 'load') {
    index = new Supercluster({
      radius: 40,
      maxZoom: 14,
      map: props => ({ count: 1, action: props.action, color: props.color }),
      reduce: (acc, props) => {
        acc.count += props.count
        // Color dominante
        if (!acc.dominantAction || props.count > acc[props.action]) {
          acc.dominantAction = props.action
          acc.color = props.color
        }
      },
    })
    index.load(data)  // GeoJSON features
  } else if (type === 'getClusters') {
    const clusters = index.getClusters(bbox, zoom)
    self.postMessage({ clusters })
  }
}

// MapContainer.tsx
const worker = new Worker(new URL('./clusterWorker.ts', import.meta.url), { type: 'module' })

// En cada update de assets:
worker.postMessage({ type: 'load', data: assetsToGeoJSON(assets) })

// En cada move del mapa:
worker.postMessage({ type: 'getClusters', bbox: map.getBounds().toArray(), zoom: map.getZoom() })
worker.onmessage = (e) => updateMarkers(e.data.clusters)
```

### 7.2 Virtualización de Tabla

```typescript
// OpportunityTable.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: filteredAssets.length,
  getScrollElement: () => tableScrollRef.current,
  estimateSize: () => 48,  // row height
  overscan: 5,
})

// Solo renderiza filas visibles + 5 overscan
return (
  <div ref={tableScrollRef} style={{ height: '400px', overflow: 'auto' }}>
    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
      {rowVirtualizer.getVirtualItems().map(virtualRow => (
        <div key={virtualRow.key} style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)` }}>
          {renderRow(filteredAssets[virtualRow.index])}
        </div>
      ))}
    </div>
  </div>
)
```

### 7.3 Lazy Loading

| Componente | Trigger | Loading |
|------------|---------|---------|
| DetailPanel | Marcador click | Skeleton de secciones |
| ComparablesList | Detail panel abierto | 3 skeleton cards |
| MapContainer | React.lazy() | Full page spinner |
| ComparableCard photo | IntersectionObserver | Shimmer |

### 7.4 Debounce en Filtros

```typescript
// 300ms debounce antes de aplicar filtro client-side
const debouncedFilters = useDebounce(filterStore, 300)
```

### 7.5 Mapa Lazy Load

```typescript
// MapContainer se carga via React.lazy() — code split del bundle principal
const MapContainer = React.lazy(() => import('./components/map/MapContainer'))

// Solo se carga cuando el usuario llega al dashboard (no en landing o login)
```

---

## 8. Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (PostgreSQL)                            │
│  v_asset_pipeline │ v_dashboard_summary │ comparisons │ pipeline_runs   │
│  dashboard_metrics │ sources │ asset_events                              │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                    Realtime channels
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                    supabaseClient.ts (singleton)                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                    supabaseService.ts (queries)                          │
│  fetchAssets() │ fetchSummary() │ fetchComparables() │ fetchPipelineRuns│
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                    SWR Hooks                                            │
│  useAssets() │ useSummary() │ useComparables(id) │ usePipelineRuns()    │
│  + cache (in-memory) + realtime subscriptions                          │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                    Zustand Stores                                       │
│  filterStore │ selectionStore │ mapStore │ uiStore                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────────┐
│                    React Components                                     │
│  HeaderBar ← useSummary                                                │
│  MapContainer ← useAssets + filterStore + selectionStore + mapStore    │
│  OpportunityTable ← useAssets + filterStore + selectionStore           │
│  DetailPanel ← useAssets + useComparables + selectionStore             │
│  AdminPanel ← usePipelineRuns + uiStore                                 │
│  TimelineSlider → filterStore (date range)                            │
│  MarketDashboard ← useAssets (agregación useMemo)                      │
└─────────────────────────────────────────────────────────────────────────┘

TRANSFORMACIONES:
  assets → GeoJSON → MapLibre source → AssetMarker / MarkerCluster
  assets → filtered (filterStore) → OpportunityTable (virtualized)
  assets → aggregated (useMemo) → MarketDashboard
  comparisons → ComparableCard[] → ComparablesList
  score.components + risk_factors → reasons[] → DetailExplainability
  action → color → markerColor()
  price → size → markerSize() (log scale)
  location.coordinates → [lng, lat] → GeoJSON Point
  (no coordinates) → geocodingService → IndexedDB cache → fallback

REALTIME:
  INSERT assets       → mutateAssets() → map + tabla refresh
  UPDATE assets       → mutateAssets() → marcador refresh
  INSERT scores       → mutateAssets() → score update
  INSERT decisions    → mutateAssets() + mutateSummary() → full refresh
  INSERT pipeline_runs → mutateSummary() → header status update
```

---

**Fin del Dataflow — DASHBOARD_V2_DATAFLOW.md**