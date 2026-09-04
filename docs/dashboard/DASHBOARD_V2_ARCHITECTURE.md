# Dashboard V2: Arquitectura Técnica

**Versión:** 2.0
**Estado:** BORRADOR PARA APROBACIÓN
**Fecha:** 2026-07-06
**Plataforma:** Hermes Opportunity Intelligence Platform (HOIE)

---

## 1. Stack Decision

### Frontend: React 18 + TypeScript + Vite

| Decisión | React 18 + TS | Vanilla JS (V1) | Web Components |
|----------|---------------|-----------------|----------------|
| Componentes reusables | ✅ 24 componentes | ❌ monolito 487 líneas | ⚠️ verbose |
| Estado compartido | ✅ Zustand | ❌ variable global | ⚠️ manual |
| Virtualización | ✅ @tanstack/react-virtual | ❌ no existe | ⚠️ custom |
| Ecosistema | ✅ SWR, hooks, Testing Library | — | limitado |
| Bundle size | +40kb gzip | 0 | 0 |
| Learning curve | medio | bajo | medio |

**Decisión:** React 18 + TypeScript + Vite. El V1 demostró que vanilla JS no escala para 24+ componentes con estado compartido entre mapa ↔ filtros ↔ tabla ↔ detail panel. El bundle adicional de React (40kb gzip) es justificado por la complejidad del V2.

### Mapa: MapLibre GL JS

| Decisión | MapLibre GL | Leaflet | Google Maps | Deck.gl |
|----------|-------------|---------|-------------|---------|
| Costo | Gratis | Gratis | **$** | Gratis |
| Clustering nativo | ✅ | ⚠️ plugin | ✅ | ✅ |
| Heatmap nativo | ✅ | ⚠️ plugin | ✅ | ✅ |
| WebGL (performance) | ✅ | ❌ DOM | ✅ | ✅ |
| Polígonos | ✅ | ✅ | ✅ | ✅ |
| Bundle | 200kb | 40kb | — | 500kb+ |

**Decisión:** MapLibre GL JS. Gratis, WebGL para performance con miles de marcadores, clustering y heatmap nativos sin plugins. Leaflet usa DOM (lento con 5000+ marcadores). Google Maps tiene costos. Deck.gl es overkill.

### Estado: Zustand

| Decisión | Zustand | Redux Toolkit | Context API |
|----------|---------|---------------|-------------|
| Boilerplate | mínimo | medio | mínimo |
| Performance | ✅ updates selectivos | ✅ | ❌ re-render cascade |
| Devtools | ✅ | ✅ | ❌ |
| Learning curve | bajo | medio | bajo |

**Decisión:** Zustand. Updates frecuentes del mapa (zoom, pan, selección) requieren re-renders selectivos sin cascada. Context API causa re-renders innecesarios. Redux es excesivo para este caso.

### Data Fetching: SWR

**Decisión:** SWR (stale-while-revalidate). Cache en memoria, revalidación en background, deduplicación de requests. Alternativa: Tanstack Query (más features pero mayor bundle).

### Otras dependencias

| Lib | Propósito |
|-----|-----------|
| `@supabase/supabase-js` | Cliente Supabase (ya usado en V1) |
| `maplibre-gl` | Mapa WebGL |
| `zustand` | Estado global |
| `swr` | Data fetching/cache |
| `@tanstack/react-virtual` | Virtualización de tabla (10K+ filas) |
| `supercluster` | Clustering de marcadores en web worker |
| `papaparse` | Export CSV |

---

## 2. Diagrama de Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (React)                        │
│  HeaderBar │ FilterSidebar │ MapContainer │ DetailPanel │ Table     │
│  ──────────────────────────────────────────────────────────────────  │
│  Zustand Store (filters, selectedAsset, mapState, uiState, admin)   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                    DATA LAYER (SWR + Services)                       │
│  useAssets() │ useSummary() │ useComparables(id) │ usePipelineRuns()│
│  ──────────────────────────────────────────────────────────────────  │
│  supabaseService.ts  │  mapService.ts  │  geocodingService.ts       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                    REALTIME LAYER (Supabase Channels)                │
│  channel('assets') → INSERT/UPDATE/DELETE → mutate SWR               │
│  channel('pipeline_runs') → INSERT → update header status           │
│  channel('opportunity_scores') → INSERT → update marker score       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│                    PERSISTENCE LAYER (Supabase/PostgreSQL)           │
│  v_asset_pipeline │ v_dashboard_summary │ comparisons               │
│  pipeline_runs │ dashboard_metrics │ sources                        │
│  RLS: anon SELECT, service_role ALL                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura de Directorios

```
apps/dashboard-v2/
├── src/
│   ├── main.tsx                    # Entry point, React root
│   ├── App.tsx                     # Layout grid + routing logic
│   │
│   ├── components/
│   │   ├── header/
│   │   │   ├── HeaderBar.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   └── PipelineStatus.tsx
│   │   ├── map/
│   │   │   ├── MapContainer.tsx    # MapLibre lifecycle
│   │   │   ├── MapLayerToggle.tsx
│   │   │   ├── AssetMarker.tsx     # CircleMarker con color+tamaño
│   │   │   ├── MarkerCluster.tsx   # supercluster en worker
│   │   │   ├── HeatmapLayer.tsx
│   │   │   ├── ZonePolygon.tsx
│   │   │   └── MapPopup.tsx
│   │   ├── filters/
│   │   │   ├── FilterSidebar.tsx
│   │   │   └── FilterChip.tsx
│   │   ├── detail-panel/
│   │   │   ├── DetailPanel.tsx
│   │   │   ├── DetailPhoto.tsx
│   │   │   ├── DetailExplainability.tsx
│   │   │   ├── ComparablesList.tsx
│   │   │   └── ComparableCard.tsx
│   │   ├── table/
│   │   │   ├── OpportunityTable.tsx
│   │   │   ├── GradeBadge.tsx
│   │   │   └── ActionBadge.tsx
│   │   ├── timeline/
│   │   │   └── TimelineSlider.tsx
│   │   ├── admin/
│   │   │   ├── AdminPanel.tsx
│   │   │   └── PipelineRunViewer.tsx
│   │   └── shared/
│   │       ├── LoadingState.tsx
│   │       ├── EmptyState.tsx
│   │       └── MarketDashboard.tsx
│   │
│   ├── hooks/
│   │   ├── useAssets.ts            # SWR: fetch v_asset_pipeline
│   │   ├── useSummary.ts           # SWR: fetch v_dashboard_summary
│   │   ├── useComparables.ts       # SWR: fetch comparisons by asset_id
│   │   ├── usePipelineRuns.ts      # SWR: fetch pipeline_runs
│   │   ├── useRealtime.ts          # Supabase channels
│   │   └── useGeocoding.ts         # Nominatim fallback
│   │
│   ├── stores/
│   │   ├── filterStore.ts          # Zustand: filtros activos
│   │   ├── selectionStore.ts       # Zustand: asset seleccionado
│   │   ├── mapStore.ts            # Zustand: zoom, center, layers
│   │   └── uiStore.ts            # Zustand: admin mode, detail panel open
│   │
│   ├── services/
│   │   ├── supabaseClient.ts       # Cliente Supabase singleton
│   │   ├── supabaseService.ts      # Queries a vistas/tablas
│   │   ├── mapService.ts          # Gestiona MapLibre instance
│   │   └── geocodingService.ts    # Nominatim fallback + cache
│   │
│   ├── workers/
│   │   └── clusterWorker.ts       # Web worker: supercluster
│   │
│   ├── types/
│   │   ├── database.ts            # Tipos de tablas DB
│   │   ├── components.ts           # Props interfaces
│   │   └── map.ts                 # Tipos de MapLibre
│   │
│   ├── styles/
│   │   ├── theme.ts               # Paleta de colores
│   │   └── global.css             # Reset + tipografía
│   │
│   └── utils/
│       ├── format.ts              # Price, pct, date formatters
│       ├── geo.ts                 # Coordenadas, bbox, distancia
│       └── export.ts              # CSV/JSON export
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env                           # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

## 4. Estado Global (Zustand)

### filterStore

```typescript
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
  setFilter: (key: string, value: any) => void
  clearAll: () => void
  activeFilterCount: () => number
}
```

### selectionStore

```typescript
interface SelectionState {
  selectedAssetId: string | null
  selectAsset: (id: string | null) => void
}
```

### mapStore

```typescript
interface MapState {
  zoom: number
  center: [number, number]  // [lng, lat]
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
```

### uiStore

```typescript
interface UIState {
  adminMode: boolean
  detailPanelOpen: boolean
  toggleAdmin: () => void
  toggleDetailPanel: () => void
}
```

---

## 5. Service Layer

### supabaseService.ts

Usa las vistas existentes en lugar de 3 queries separadas (mejora del V1):

```typescript
// Resumen para header — usa vista existente
async function fetchSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase
    .from('v_dashboard_summary')
    .select('*')
    .single()
  if (error) throw error
  return data
}

// Assets para mapa + tabla — usa vista existente
async function fetchAssets(limit = 500): Promise<AssetPipelineRow[]> {
  const { data, error } = await supabase
    .from('v_asset_pipeline')
    .select('*')
    .order('final_score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Comparables para detail panel
async function fetchComparables(assetId: string): Promise<Comparison[]> {
  const { data, error } = await supabase
    .from('comparisons')
    .select(`
      *,
      comp_asset:assets(
        asset_id, title, price_amount, raw_data,
        source_listing_url
      )
    `)
    .eq('asset_id', assetId)
    .order('quality_score', { ascending: false })
  if (error) throw error
  return data
}

// Pipeline runs para admin
async function fetchPipelineRuns(limit = 50): Promise<PipelineRun[]> {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Sources para layer toggles
async function fetchSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
  if (error) throw error
  return data
}
```

### mapService.ts

Gestiona el lifecycle de MapLibre:

```typescript
class MapService {
  private map: maplibregl.Map | null = null

  init(container: HTMLElement): maplibregl.Map {
    this.map = new maplibregl.Map({
      container,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-79.5199, 8.9824],  // Panamá
      zoom: 10,
    })
    return this.map
  }

  addAssetSource(assets: AssetPipelineRow[]) {
    // Convierte assets a GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: assets
        .filter(a => a.location?.coordinates)
        .map(a => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [a.location.coordinates.lng, a.location.coordinates.lat] },
          properties: {
            id: a.asset_id,
            title: a.title,
            price: a.price_amount,
            score: a.final_score,
            action: a.recommended_action,
          }
        }))
    }
    this.map?.getSource('assets')?.setData(geojson)
  }

  flyToAsset(assetId: string) { /* ... */ }
  cleanup() { this.map?.remove() }
}
```

### geocodingService.ts

```typescript
// Nominatim (OpenStreetMap) — gratis, rate-limited 1 req/s
async function geocode(province: string, district?: string): Promise<{lat: number, lng: number} | null> {
  const q = [district, province, 'Panama'].filter(Boolean).join(', ')
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'HOIE-Dashboard/2.0' } })
  const data = await res.json()
  return data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
}

// Cache en IndexedDB para no repetir geocoding
async function geocodeCached(province: string, district?: string): Promise<{lat: number, lng: number} | null> {
  // 1. Check IndexedDB cache
  // 2. If miss → geocode + store
  // 3. Return cached
}
```

---

## 6. Geocoding Strategy

**Problema:** El esquema `assets.location.coordinates` es opcional. El normalizer actual no popula coordenadas.

**Estrategia:**

1. **Frontend (inmediato):** `geocodingService.ts` hace fallback en runtime para assets sin coordinates. Usa Nominatim (gratis, rate-limited 1 req/s). Cache en IndexedDB.

2. **Backend (migración propuesta, NO implementar ahora):** Migración `003_geocoding_and_zones.sql` que:
   - Agrega columna `latitude DOUBLE PRECISION` y `longitude DOUBLE PRECISION` a `assets`
   - Crea índice GIST para queries espaciales
   - Popula coords via batch geocoding en pipeline runner
   - Crea tablas `zone_hierarchy` y `zone_metrics` (del doc `DATA_INTELLIGENCE_SCHEMA.md`)

3. **Agrupación:** Geocoding por `(province, district)` — no por asset individual. Si la zona está cacheada, todos los assets de esa zona usan el centroide de la zona (suficiente para zoom bajo). Geocoding individual solo si la zona no está cacheada.

---

## 7. Migración de Datos Propuesta (NO implementar)

### 003_geocoding_and_zones.sql

```sql
-- Fase 1: Agregar coordenadas a assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS idx_assets_geo ON assets USING GIST (point(longitude, latitude));

-- Fase 2: Cache de geocoding por zona
CREATE TABLE IF NOT EXISTS zone_geocode_cache (
  cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province TEXT NOT NULL,
  district TEXT,
  corregimiento TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  source TEXT DEFAULT 'nominatim',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(province, district, corregimiento)
);

-- Fase 3: POI locations (bancos, remates)
CREATE TABLE IF NOT EXISTS poi_locations (
  poi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_type TEXT NOT NULL CHECK (poi_type IN ('bank', 'savings_bank', 'national_bank', 'judicial_auction', 'other')),
  name TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fase 4: Zone metrics (del doc DATA_INTELLIGENCE_SCHEMA.md)
-- (definición completa en ese documento)
```

---

## 8. Capas del Mapa

| Capa | Source SQL | Visible por defecto |
|------|-----------|---------------------|
| Propiedades | `SELECT * FROM v_asset_pipeline WHERE vertical='real_estate'` | ✅ |
| Vehículos | `SELECT * FROM v_asset_pipeline WHERE vertical='vehicles'` | ❌ |
| Bancos | `SELECT * FROM poi_locations WHERE poi_type='bank'` (futuro) | ❌ |
| Caja de Ahorros | `SELECT * FROM poi_locations WHERE poi_type='savings_bank'` (futuro) | ❌ |
| Banco Nacional | `SELECT * FROM poi_locations WHERE poi_type='national_bank'` (futuro) | ❌ |
| Remates | `SELECT * FROM poi_locations WHERE poi_type='judicial_auction'` (futuro) | ❌ |
| Oportunidades | `SELECT * FROM v_asset_pipeline WHERE final_score >= 70` | ✅ |
| Riesgos | `SELECT * FROM v_asset_pipeline WHERE final_score < 40` | ❌ |
| Market Trend | `zone_metrics` (futuro) | ❌ |
| Heatmap | Agregación client-side de assets con score >= 70 | Toggle |
| Polígonos | zone_hierarchy + zone_metrics (futuro) | Toggle |

---

## 9. Web Workers para Clustering

```typescript
// clusterWorker.ts
import Supercluster from 'supercluster'

const index = new Supercluster({
  radius: 40,
  maxZoom: 14,
  map: (props) => ({ count: 1, ...props }),
  reduce: (acc, props) => { acc.count += props.count }
})

self.onmessage = (e) => {
  const { type, data, bbox, zoom } = e.data
  if (type === 'load') {
    index.load(data)
  } else if (type === 'getClusters') {
    const clusters = index.getClusters(bbox, zoom)
    self.postMessage({ clusters })
  }
}
```

El worker recibe el array de assets como GeoJSON, los indexa con supercluster, y responde a queries de clusters por bbox+zoom. El hilo principal solo renderiza clusters visibles.

---

## 10. Cache Strategy

### Server-side (Pre-computado por pipeline runner)

```sql
-- dashboard_metrics table (ya existe)
INSERT INTO dashboard_metrics (metric_key, metric_value) VALUES
  ('pipeline_status', '{"status": "completed", "last_run": "2024-..."}'),
  ('summary_kpis', '{"total_assets": 450, "buy_now": 23, ...}'),
  ('source_list', '[{"source_id": "...", "name": "Encuentra24", ...}]'),
  ('province_aggregates', '[{"province": "Panamá", "avg_price": 250000, ...}]')
ON CONFLICT (metric_key) DO UPDATE SET metric_value = EXCLUDED.metric_value, updated_at = NOW();
```

### Client-side

| Capa | Tecnología | TTL |
|------|-----------|-----|
| Datos del mapa | SWR cache | 60s revalidate |
| Comparables | SWR cache | 300s |
| Pipeline runs | SWR cache | 30s |
| Map tiles | Browser cache | 7 días |
| Geocoding | IndexedDB | Permanente |

---

## 11. Autenticación

### Modo Admin (Dashboard Técnico)

- Supabase Auth para login admin
- Toggle de modo admin en header (solo visible si authenticated)
- RLS ya configurado (migración 003): `anon` SELECT only, `authenticated` SELECT only, `service_role` ALL
- Para ver logs/pipeline_runs, el usuario debe ser `authenticated` (no anon)
- El dashboard técnico usa el mismo Supabase client pero con session Auth

```typescript
// Si admin autenticado → fetch pipeline_runs con session
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  // Modo admin disponible
}
```

---

## 12. Performance

### Estrategias

| Estrategia | Problema | Solución |
|-----------|----------|---------|
| Clustering | 5000 marcadores | supercluster en web worker |
| Virtualización | 10K+ filas en tabla | @tanstack/react-virtual |
| Code splitting | MapLibre bundle 200kb | React.lazy(() => import MapContainer) |
| SWR cache | Requests repetidos | dedup + revalidate |
| Debounce | Filtros rapidísimos | 300ms delay |
| Lazy detail | Comparables no cargados | Solo en detail panel open |
| Bbox query | Assets fuera de viewport | `.filter(a => inBbox(a, mapBbox))` |

### Bundle Size Estimado

```
react + react-dom:  ~45kb gzip
maplibre-gl:        ~200kb gzip (code split)
zustand:            ~3kb
swr:                ~5kb
@tanstack/react-virtual: ~10kb
supercluster:       ~8kb
papaparse:          ~10kb
─────────────────
Total:              ~280kb gzip (sin code split)
Con code split:     ~70kb initial + 210kb lazy (mapa)
```

---

**Fin del Architecture — DASHBOARD_V2_ARCHITECTURE.md**