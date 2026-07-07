# DATA INTELLIGENCE LAYER — Architecture
## Hermes Opportunity Intelligence Platform

**Versión:** 1.0.0
**Fecha:** 2026-07-02
**Estado:** BORRADOR PARA REVISIÓN

---

## 1. System Overview

La Data Intelligence Layer es un sistema de procesamiento analítico multicapa diseñado para transformar datos inmobiliarios crudos en inteligencia de inversión estructurada, explicable y accionable.

### 1.1 Arquitectura en Capas

```
┌──────────────────────────────────────────────────────────────────────┐
│                      7. PRESENTATION LAYER                           │
│  Dashboard / API / Reports / Notifications                          │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      6. INTEGRATION LAYER                            │
│  Opportunity Engine ←→ Data Intelligence ←→ Decision Engine         │
│  Supabase Sync  │  Webhook Publisher  │  Cache Layer               │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      5. ORCHESTRATION LAYER                          │
│  Pipeline Scheduler  │  Engine Runner  │  Dependency Resolver       │
│  Batch Coordinator   │  Cache Manager  │  Invalidation Engine       │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      4. INTELLIGENCE ENGINES                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Market│ │Locat.│ │Rental│ │Liquid│ │Valuat│ │Neigh.│ │Trend │  │
│  │Intel │ │Intel │ │Intel │ │Intel │ │Intel │ │Intel │ │Detect│  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐               │
│  │Investment│ │Historical    │ │Opportunity       │               │
│  │Classif.  │ │Intel Engine  │ │Timeline Engine   │               │
│  └──────────┘ └──────────────┘ └──────────────────┘               │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      3. COMPUTATION LAYER                            │
│  Score Calculators  │  Statistical Functions  │  Geometry Engine    │
│  Time Series Analysis│  Regression Models     │  Weighted Scoring  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      2. DATA ACCESS LAYER                            │
│  Repositories  │  Query Builders  │  Caching  │  Migrations         │
│  Supabase Client│  Redis Client   │  Connection Pool                │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────┴───────────────────────────────────────────┐
│                      1. STORAGE LAYER                                │
│  PostgreSQL (Supabase)  │  Redis  │  File Storage (images)          │
│  16 new tables          │  Cache  │  Migration scripts              │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Principios Arquitectónicos

1. **Separación de Concerns** — Cada engine es un módulo independiente con su propio archivo, tests y ciclo de vida
2. **Dependency Injection** — Los engines reciben dependencias (DB client, cache, logger) por constructor/función
3. **Event-Driven** — Los engines se comunican mediante eventos, no llamadas directas
4. **Fail Independent** — Si un engine falla, los demás continúan
5. **Cache-First** — Siempre consultar cache antes de calcular
6. **Log Everything** — Cada cálculo se registra en `calculation_log`

---

## 2. Module Architecture

### 2.1 Estructura de Directorios

```
apps/data-intelligence/
├── src/
│   ├── index.ts                    # Entry point, exports
│   ├── types/
│   │   ├── index.ts                # Barrel exports
│   │   ├── market.ts               # Market Intel types
│   │   ├── location.ts             # Location Intel types
│   │   ├── rental.ts               # Rental Intel types
│   │   ├── liquidity.ts            # Liquidity Intel types
│   │   ├── valuation.ts            # Valuation Intel types
│   │   ├── historical.ts           # Historical Intel types
│   │   ├── timeline.ts             # Timeline types
│   │   ├── neighborhood.ts         # Neighborhood types
│   │   ├── trends.ts               # Trend types
│   │   ├── investment.ts           # Investment classification types
│   │   └── common.ts               # Shared types
│   │
│   ├── engines/
│   │   ├── market-intelligence.ts       # Market Intelligence Engine
│   │   ├── location-intelligence.ts     # Location Intelligence Engine
│   │   ├── rental-intelligence.ts       # Rental Intelligence Engine
│   │   ├── liquidity-intelligence.ts    # Liquidity Intelligence Engine
│   │   ├── valuation-intelligence.ts    # Valuation Intelligence Engine
│   │   ├── historical-intelligence.ts   # Historical Intelligence Engine
│   │   ├── timeline-engine.ts           # Opportunity Timeline Engine
│   │   ├── neighborhood-intelligence.ts # Neighborhood Intelligence Engine
│   │   ├── market-trend-engine.ts       # Market Trend Engine
│   │   └── investment-intelligence.ts   # Investment Intelligence Engine
│   │
│   ├── calculators/
│   │   ├── price-metrics.ts        # Avg, median, per-m2 calculations
│   │   ├── statistical.ts          # Std dev, confidence intervals
│   │   ├── time-series.ts          # Trend analysis, slopes
│   │   ├── spatial.ts              # Distance calculations, geo queries
│   │   ├── rental-calculator.ts    # Yield, cap rate, cash flow
│   │   ├── liquidity-calculator.ts # DOM, absorption, pressure
│   │   └── scoring-engine.ts       # Weighted score composition
│   │
│   ├── repository/
│   │   ├── zone-metrics.repository.ts
│   │   ├── location-scores.repository.ts
│   │   ├── rental-estimates.repository.ts
│   │   ├── valuation.repository.ts
│   │   ├── timeline.repository.ts
│   │   ├── neighborhood.repository.ts
│   │   ├── trends.repository.ts
│   │   └── calculation-log.repository.ts
│   │
│   ├── services/
│   │   ├── orchestrator.ts         # Engine orchestration
│   │   ├── cache.service.ts        # Redis/memory cache
│   │   ├── poi.service.ts          # POI data management
│   │   ├── zone.service.ts         # Zone hierarchy management
│   │   └── validation.service.ts   # Input/output validation
│   │
│   ├── events/
│   │   ├── event-bus.ts            # Event bus implementation
│   │   ├── event-types.ts          # Event type definitions
│   │   └── event-handlers.ts       # Event handler registry
│   │
│   ├── pipeline/
│   │   ├── data-intelligence-pipeline.ts  # Pipeline integration
│   │   └── pipeline-steps.ts              # Pipeline step definitions
│   │
│   └── config/
│       ├── index.ts                # Configuration loader
│       ├── poi-categories.ts        # POI category definitions
│       ├── zone-factors.ts          # Zone adjustment factors
│       └── weights.ts              # Score weight configurations
│
├── tests/
│   ├── engines/                    # Unit tests per engine
│   ├── calculators/                # Calculator unit tests
│   ├── repository/                 # Repository tests
│   └── integration/               # Integration tests
│
├── migrations/
│   ├── 003_data_intelligence_schema.sql
│   └── 003_data_intelligence_functions.sql
│
├── package.json
├── tsconfig.json
└── README.md
```

### 2.2 Package Configuration

```json
{
  "name": "@hermes/data-intelligence",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "lint": "eslint src/**/*.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@hermes/types": "workspace:*",
    "zod": "^3.24.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0",
    "eslint": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  }
}
```

---

## 3. Engine Contract Interface

Cada engine implementa el siguiente contrato:

```typescript
interface DataIntelligenceEngine<TInput, TOutput> {
  /** Identificador único del engine */
  readonly engineId: string;
  
  /** Versión semántica del engine */
  readonly version: string;
  
  /** Dependencias del engine (otros engine IDs requeridos) */
  readonly dependencies?: string[];
  
  /** Ejecuta el cálculo principal */
  calculate(input: TInput, context?: EngineContext): Promise<EngineResult<TOutput>>;
  
  /** Valida que los datos de entrada sean correctos */
  validateInput(input: unknown): asserts input is TInput;
  
  /** Obtiene metadatos del último cálculo */
  getMetadata(): EngineMetadata;
}

interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: EngineError;
  performanceMs: number;
  cacheHit: boolean;
  version: string;
}

interface EngineContext {
  assetId?: string;
  zoneId?: string;
  forceRecalculate?: boolean;
  timestamp?: Date;
  sourceRunId?: string;
}
```

### 3.1 Especificación de cada Engine

| Engine ID | Versión | Input | Output | Dependencias |
|-----------|---------|-------|--------|-------------|
| `market_intelligence` | 1.0.0 | `zoneId` + `filter` | `ZoneMetrics` | Ninguna |
| `location_intelligence` | 1.0.0 | `assetId` + `coordinates` | `LocationScores` | `poi.service` |
| `rental_intelligence` | 1.0.0 | `assetId` + `Asset` | `RentalEstimate` | `market_intelligence` |
| `liquidity_intelligence` | 1.0.0 | `zoneId` + `assetType` | `LiquidityScore` | `market_intelligence` |
| `valuation_intelligence` | 1.0.0 | `assetId` + `Asset` | `ValuationEstimate` | `market_intelligence` |
| `historical_intelligence` | 1.0.0 | `assetId` | `AssetHistory` | Ninguna |
| `timeline_engine` | 1.0.0 | `assetId` | `AssetTimeline` | `historical_intelligence` |
| `neighborhood_intelligence` | 1.0.0 | `zoneId` | `NeighborhoodProfile` | Todos los engines anteriores |
| `market_trend_engine` | 1.0.0 | `zoneId` | `TrendSignal[]` | `market_intelligence` |
| `investment_intelligence` | 1.0.0 | `assetId` | `InvestmentClassification[]` | Todos los engines anteriores |

---

## 4. Data Flow Architecture

### 4.1 Procesamiento de un Nuevo Activo

```
1. SCRAPER COMPLETE
   │
   ▼
2. NORMALIZER
   │  produce: RawAsset
   ▼
3. PIPELINE EVENT: 'asset.ingested'
   │
   ▼
4. ORCHESTRATOR recibe evento
   │
   ├─ 4a. Historical Intel → crear versión inicial en asset_versions
   ├─ 4b. Location Intel → calcular location_scores
   ├─ 4c. Market Intel → actualizar zone_metrics para la zona
   │
   ▼
5. PIPELINE EVENT: 'asset.enriched'
   │
   ▼
6. ENGINES DE SEGUNDO NIVEL
   ├─ 6a. Valuation Intel → calcular valuation (usa comparables + location)
   ├─ 6b. Rental Intel → calcular rental_estimates (usa market + location)
   ├─ 6c. Liquidity Intel → calcular liquidity_scores (usa market)
   │
   ▼
7. PIPELINE EVENT: 'asset.analyzed'
   │
   ▼
8. ENGINES DE TERCER NIVEL
   ├─ 7a. Neighborhood Intel → actualizar perfil de zona
   ├─ 7b. Market Trend → detectar señales (si hay suficientes datos)
   ├─ 7c. Timeline Engine → crear primer timeline event
   │
   ▼
9. PIPELINE EVENT: 'asset.intelligence_ready'
   │
   ▼
10. INVESTMENT CLASSIFICATION
    ├─ 8a. Investment Intel → clasificar activo (usa todos los scores)
    │
    ▼
11. PIPELINE EVENT: 'asset.classified'
    │
    ▼
12. OPPORTUNITY ENGINE CONSUMES
    ├─ Lee: market context, location quality, rental potential,
    │       liquidity, valuation, historical context
    ├─ Recalcula score con nuevos features
    ├─ Produce: nuevo OpportunityScore
    │
    ▼
13. DECISION ENGINE
    ├─ Consume: nuevo score + métricas expandidas
    ├─ Produce: InvestmentDecision mejorada
    │
    ▼
14. PIPELINE EVENT: 'pipeline.complete'
    │
    ▼
15. DASHBOARD ACTUALIZADO
```

### 4.2 Procesamiento Batch (Actualización de Zonas)

```
SCHEDULER (cron: 0 2 * * * — 2 AM daily)
   │
   ▼
1. RECALCULAR ZONE METRICS
   ├─ Para cada zona activa:
   │  ├─ Market Intel → full zone recalculation
   │  ├─ Liquidity Intel → recalcular DOM promedios
   │  └─ Market Trend → detectar nuevas señales
   │
   ▼
2. RECALCULAR NEIGHBORHOOD PROFILES
   ├─ Para cada zona:
   │  ├─ Leer métricas actualizadas
   │  ├─ Calcular composite ratings
   │  └─ Actualizar investment rating
   │
   ▼
3. GENERAR MARKET SNAPSHOT
   ├─ Congelar estado actual del mercado
   ├─ Calcular métricas agregadas
   └─ Almacenar como snapshot versionado
```

---

## 5. Event System

### 5.1 Event Bus Architecture

```
┌─────────────────────────────────────────┐
│              EVENT BUS                   │
├─────────────────────────────────────────┤
│  publish(event: DomainEvent): void       │
│  subscribe(type, handler): unsubscribe   │
│  once(type, handler): Promise            │
│  getHistory(type): DomainEvent[]         │
└─────────────────────────────────────────┘
```

### 5.2 Catálogo Completo de Eventos

| Evento | Emisor | Consumidores | Descripción |
|--------|--------|-------------|-------------|
| `asset.ingested` | Pipeline | Historical Intel, Location Intel, Market Intel | Nuevo activo disponible |
| `asset.enriched` | Orchestrator | Valuation Intel, Rental Intel, Liquidity Intel | Datos básicos calculados |
| `asset.analyzed` | Orchestrator | Neighborhood Intel, Trend Engine | Análisis completo listo |
| `asset.intelligence_ready` | Orchestrator | Investment Classification | Todos los scores listos |
| `asset.classified` | Orchestrator | Opportunity Engine, Decision Engine, Dashboard | Clasificación completa |
| `pipeline.complete` | Orchestrator | Dashboard, Reports, Notifications | Pipeline terminado |
| `zone.metrics_updated` | Market Intel | Neighborhood Intel, Trend Engine | Métricas de zona recalculadas |
| `zone.trend_detected` | Trend Engine | Dashboard, Notifications | Nueva señal de mercado |
| `price.change_detected` | Scraper/Manual | Historical Intel, Timeline Engine | Cambio de precio detectado |
| `score.recalculated` | Opportunity Engine | Timeline Engine, Dashboard | Score recalculado |
| `decision.changed` | Decision Engine | Timeline Engine, Dashboard | Decisión modificada |
| `classification.changed` | Investment Intel | Timeline Engine, Dashboard | Clasificación de inversión cambiada |
| `cache.invalidated` | Cache Manager | Orchestrator | Caché expirada para zona/activo |
| `snapshot.generated` | Scheduler | Reports, Analytics | Snapshot de mercado semanal |

### 5.3 Formato de Evento

```typescript
interface DomainEvent {
  id: string;              // UUID v4
  type: EventType;         // Del catálogo
  source: string;          // Engine ID
  version: string;         // Schema version
  timestamp: Date;
  data: Record<string, unknown>;
  correlationId?: string;  // Para tracing de pipeline
  causationId?: string;    // ID del evento causal
  metadata?: {
    userId?: string;
    sourceRunId?: string;
    environment?: string;
  };
}
```

### 5.4 Dependencia entre Eventos

```
pipeline.start
    │
    ▼
asset.ingested ──────────────────────────────┐
    │                                          │
    ├─→ market_intelligence calculate          │
    ├─→ location_intelligence calculate        │
    ├─→ historical_intelligence calculate      │
    │                                          │
    ▼                                          │
asset.enriched ←───────────────────────────────┘
    │
    ├─→ valuation_intelligence calculate
    ├─→ rental_intelligence calculate
    ├─→ liquidity_intelligence calculate
    │
    ▼
asset.analyzed ───────────────────────────────┐
    │                                          │
    ├─→ neighborhood_intelligence calculate    │
    ├─→ market_trend calculate                 │
    ├─→ timeline_engine calculate              │
    │                                          │
    ▼                                          │
asset.intelligence_ready ←────────────────────┘
    │
    ├─→ investment_intelligence calculate
    │
    ▼
asset.classified
    │
    ├─→ opportunity_engine calculate
    │
    ▼
decision.updated
    │
    ▼
pipeline.complete
```

---

## 6. Cache Architecture

### 6.1 Estrategia de Cache

| Cache | Tipo | TTL | Invalidación | Propósito |
|-------|------|-----|-------------|-----------|
| Engine Results | Redis/Memoria | 1h-24h | Por evento | Resultados de engines costosos |
| Zone Metrics | Memoria | 1h | zone.metrics_updated | Métricas agregadas de zona |
| POI Data | Memoria | 24h | Manual | Datos de puntos de interés |
| Comparables Query | Redis | 30min | asset.ingested | Resultados de búsqueda de comparables |
| Dashboard Aggregates | Redis | 5min | pipeline.complete | Métricas del dashboard |
| Configuration | Memoria | ∞ | Deploy | Pesos, factores de zona, thresholds |

### 6.2 Cache Invalidation Rules

```
1. asset.ingested → invalidar comparables_query + zone_metrics (zona afectada)
2. zone.metrics_updated → invalidar zone_metrics + neighborhood_profiles
3. asset.classified → invalidar dashboard_aggregates
4. snapshot.generated → invalidar market_snapshots viejos
5. Manual (admin) → invalidar zona específica o todo
```

### 6.3 Cache Interface

```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;  // zone:* 
  flush(): Promise<void>;
  getStats(): Promise<CacheStats>;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  oldestKey: string | null;
}
```

---

## 7. Pipeline Integration

### 7.1 Nuevo Archivo: data-intelligence-pipeline.mjs

```
scripts/data-intelligence-pipeline.mjs

Propósito: Extiende el pipeline principal con pasos de Data Intelligence
Integración: Llamado automáticamente por pipeline.mjs después de normalización

Pasos añadidos al pipeline existente:
  1. market_intelligence_step    (después de normalización)
  2. location_intelligence_step  (después de market)
  3. valuation_step              (después de location)
  4. rental_step                 (después de valuation)
  5. liquidity_step              (después de rental)
  6. historical_step             (paralelo, desde ingesta)
  7. timeline_step               (después de historical + score)
  8. trend_step                  (después de market, batch)
  9. neighborhood_step           (después de trend)
  10. investment_step            (después de todo)
```

### 7.2 Pipeline Step Definition

```typescript
interface PipelineStep {
  id: string;
  name: string;
  engine: string;
  dependencies: string[];     // Step IDs que deben completarse antes
  inputSelector: (context: PipelineContext) => unknown;
  outputHandler: (result: unknown, context: PipelineContext) => Promise<void>;
  timeout: number;            // ms
  retryCount: number;
  retryDelay: number;         // ms
}

const DATA_INTELLIGENCE_STEPS: PipelineStep[] = [
  {
    id: 'di-market',
    name: 'Market Intelligence',
    engine: 'market_intelligence',
    dependencies: [],
    inputSelector: ctx => ({ zoneId: ctx.asset.zoneId }),
    outputHandler: async (result, ctx) => {
      ctx.marketMetrics = result;
    },
    timeout: 10000,
    retryCount: 2,
    retryDelay: 1000,
  },
  // ... más steps
];
```

---

## 8. Integration with Opportunity Engine

### 8.1 Data Flow: Data Intelligence → Opportunity Engine

```
DATA INTELLIGENCE LAYER
    │
    ▼
┌─────────────────────────────────┐
│  IntelligenceResult {            │
│    location: LocationScore,      │
│    market: ZoneMetricsSnapshot,  │
│    rental: RentalEstimate,       │
│    liquidity: LiquidityScore,    │
│    valuation: ValuationEstimate, │
│    neighborhood?: NeighProfile,  │
│    trend?: TrendSignal,          │
│    classification?: Investment,  │
│    timeline: TimelineSummary     │
│  }                               │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  OPPORTUNITY ENGINE              │
│                                  │
│  Functions:                      │
│  - integrateMarketContext()      │
│  - integrateLocationScore()      │
│  - integrateRentalPotential()    │
│  - integrateLiquidityScore()     │
│  - integrateValuation()          │
│  - integrateHistoricalTrend()    │
│                                  │
│  Enhanced Score =                │
│    baseScore                     │
│    + locationBonus               │
│    + marketBonus                 │
│    + liquidityBonus              │
│    + rentalBonus                 │
│                                  │
│  Enhanced Confidence =           │
│    baseConfidence                │
│    + valuationConfidenceBoost    │
│    + historicalTrendConfidence   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  DECISION ENGINE                 │
│                                  │
│  Nuevos inputs:                  │
│  - Liquidity (exit ease)         │
│  - Investment classification     │
│  - Neighborhood rating           │
│  - Historical velocity           │
│  - Market temperature            │
└──────────────────────────────────┘
```

### 8.2 Enhanced Scoring Formula

```typescript
interface EnhancedScoreInput {
  // Existing
  discount: number;           // 0-100
  sellerType: 'bank' | 'owner';
  comparableCount: number;
  
  // New from Data Intelligence
  locationScore: number;      // 0-100
  marketTemperature: 'hot' | 'warm' | 'cool' | 'cold';
  rentalYield: number;        // decimal
  liquidityScore: number;     // 0-100
  valuationConfidence: number; // 0-100
  historicalTrend: 'improving' | 'stable' | 'declining';
  investmentType: string;     // Primary classification
}

function calculateEnhancedScore(input: EnhancedScoreInput): number {
  // Base (existing)
  let score = 37 + input.discount * 1.8;
  
  // Seller bonus (existing)
  if (input.sellerType === 'bank') score += 5;
  
  // Comparable bonus (existing)
  score += Math.min(input.comparableCount * 0.25, 1);
  
  // LOCATION BONUS (new)
  if (input.locationScore > 70) {
    score += (input.locationScore - 70) * 0.3;  // Up to +9
  }
  
  // MARKET BONUS (new)
  const marketFactors = { hot: 8, warm: 4, cool: -4, cold: -8 };
  score += marketFactors[input.marketTemperature];
  
  // LIQUIDITY BONUS (new)
  if (input.liquidityScore >= 70) {
    score += (input.liquidityScore - 70) * 0.25;  // Up to +7.5
  } else if (input.liquidityScore < 40) {
    score -= (40 - input.liquidityScore) * 0.15;  // Penalty up to -9
  }
  
  // RENTAL BONUS (new)
  if (input.rentalYield >= 0.05) {
    score += Math.min((input.rentalYield - 0.05) * 500, 12);
  }
  
  // HISTORICAL TREND (new)
  if (input.historicalTrend === 'improving') score += 4;
  if (input.historicalTrend === 'declining') score -= 3;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

### 8.3 Enhanced Confidence Formula

```typescript
function calculateEnhancedConfidence(input: EnhancedScoreInput): number {
  let confidence = 60;  // Base
  
  // Valuation confidence boost
  confidence += (input.valuationConfidence - 50) * 0.2;
  
  // Liquidity data availability
  if (input.liquidityScore > 0) confidence += 5;
  
  // Historical data availability
  if (input.historicalTrend !== 'stable') confidence += 5;
  
  // Location data quality
  if (input.locationScore > 0) confidence += 5;
  
  // Cap at 100
  return Math.min(100, Math.round(confidence));
}
```

---

## 9. Performance Architecture

### 9.1 Processing Modes

| Modo | Disparador | Latencia | Alcance |
|------|-----------|----------|---------|
| **Real-time** | asset.ingested | < 30s | Location + Historical + Market para 1 activo |
| **Batch (rápido)** | Cada 5 assets o 5 min | < 2min | Valuation + Rental + Liquidity |
| **Batch (completo)** | Schedule 2 AM | < 10min | Neighborhood + Trends + Snapshots |
| **On-demand** | API call | Bajo demanda | Cualquier engine para activo/zona específica |

### 9.2 Cost Estimates (100k propiedades)

| Operación | Costo Computacional | Tiempo Estimado | Frecuencia |
|-----------|-------------------|-----------------|------------|
| Location Score (100k) | Alto (geo) | ~30 min | Batch diario |
| Market Metrics (500 zonas) | Bajo (agregación) | ~30s | Cada nuevo activo |
| Valuation (100k) | Alto (comparables) | ~2 horas | Batch nocturno |
| Rental (100k) | Medio (fórmulas) | ~10 min | Batch nocturno |
| Liquidity (500 zonas) | Medio (histórico) | ~5 min | Cada nuevo activo |
| Trend Detection (500 zonas) | Medio (series) | ~2 min | Batch nocturno |
| Neighborhood (500 zonas) | Medio | ~1 min | Batch nocturno |
| Timeline (activos cambiados) | Bajo | ~5s | Inmediato |

---

## 10. Deployment Architecture

### 10.1 Componentes

```
┌──────────────────────────────────────────────────────┐
│                  HERMES PLATFORM                      │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Pipeline         │  │  Data Intelligence        │  │
│  │  (scripts/)       │  │  (apps/data-intelligence) │  │
│  │                   │  │                           │  │
│  │  - pipeline.mjs   │  │  - 10 engines             │  │
│  │  - health-check   │  │  - calculators            │  │
│  │  - db-migrate     │  │  - repositories           │  │
│  │  - db-seed        │  │  - event bus              │  │
│  └──────────────────┘  └──────────────────────────┘  │
│                                                        │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Opportunity      │  │  Decision                │  │
│  │  Engine           │  │  Engine                  │  │
│  │  (hoie-agent)     │  │  (hoie-agent)            │  │
│  └──────────────────┘  └──────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │              Supabase (PostgreSQL)                 │ │
│  │  7 existing tables + 16 data intelligence tables  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │              Redis Cache                           │ │
│  │  TTL-based caching for engines and dashboard       │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## 11. Error Handling

### 11.1 Estrategia

| Error | Comportamiento | Recuperación |
|-------|---------------|-------------|
| Engine timeout | Skip engine, log error, continue pipeline | Reintentar en batch nocturno |
| Invalid input data | Log error, skip asset, continue batch | Reparar datos manualmente |
| Database connection failure | Retry 3 veces con backoff exponencial | Fallar pipeline si persiste |
| Cache failure | Degradar a cálculo directo (sin cache) | Alertar en health check |
| POI service unavailable | Usar últimos datos cacheados de POIs | Recalcular cuando servicio recupere |
| Concurrent calculation conflict | Lock por asset_id, encolar | Procesar en orden de llegada |

### 11.2 Graceful Degradation

```
Cada engine tiene modo degraded:

location_intelligence degraded:
  if POI data unavailable → usar score default (50) + flag 'degraded'

valuation_intelligence degraded:
  if comparables < minimum → extender radio de búsqueda
  if still insufficient → usar market_avg_price como fallback

market_intelligence degraded:
  if no hay datos históricos → usar datos actuales como tendencia plana
```

---

## 12. Security Architecture

### 12.1 Principios

1. **Least Privilege** — Cada engine accede solo a los datos que necesita
2. **Input Validation** — Zod schemas en cada endpoint y engine
3. **Audit Trail** — Cada cálculo registrado con timestamp y versión
4. **Rate Limiting** — APIs de Data Intelligence tienen rate limiting
5. **Data Isolation** — Datos de diferentes fuentes perfectamente separados

### 12.2 Data Access Matrix

| Engine | Tablas Lectura | Tablas Escritura |
|--------|---------------|-----------------|
| Market Intel | assets, asset_versions | zone_metrics, market_snapshots |
| Location Intel | assets, point_of_interest | location_scores, location_score_components |
| Rental Intel | assets, zone_metrics | rental_estimates |
| Liquidity Intel | assets, asset_versions, zone_metrics | liquidity_scores |
| Valuation Intel | assets, zone_metrics, location_scores | valuation_estimates, valuation_comparables_used |
| Historical Intel | assets | asset_versions |
| Timeline Engine | asset_versions, opportunity_scores | asset_timeline_events |
| Neighborhood Intel | todas las métricas de zona | neighborhood_profiles |
| Trend Engine | zone_metrics, market_snapshots | trend_signals |
| Investment Intel | todas las tablas anteriores | investment_classifications |

---

## 13. Monitoring & Observability

### 13.1 Métricas Clave

| Métrica | Engine | Alarma si |
|---------|--------|-----------|
| Calculation time | Todos | > 30s por asset |
| Cache hit rate | Cache Service | < 60% |
| Error rate | Todos | > 5% en última hora |
| Queue depth | Pipeline | > 1000 |
| Stale zone metrics | Market Intel | > 24h sin actualizar |
| Missing valuations | Valuation Intel | > 10% de assets sin valuation |
| Degraded calculations | Todos | > 1% en modo degraded |

### 13.2 Health Check Endpoints

```
GET /health/data-intelligence
  → { status, engines: { market: OK, location: DEGRADED, ... } }

GET /health/data-intelligence/{engine}
  → { engineId, version, lastRun, lastError, totalCalculations, 
      averagePerformance, cacheHitRate, status }
```

---

**Fin del documento de Arquitectura — Siguiente: DATA_INTELLIGENCE_SCHEMA.md**
