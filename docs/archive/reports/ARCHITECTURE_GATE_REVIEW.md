# ARCHITECTURE GATE REVIEW
## Hermes Opportunity Intelligence Platform — Data Intelligence Layer

**Versión:** 1.0.0
**Fecha:** 2026-07-02
**Revisor:** Arquitecto Principal / CTO
**Estado:** 🔴 Pendiente de aprobación

---

## Tabla de Contenidos

1. [Data Flow Complete](#1-data-flow-complete)
2. [Dependency Map](#2-dependency-map)
3. [Event Driven Architecture](#3-event-driven-architecture)
4. [Calculation Strategy](#4-calculation-strategy)
5. [Cache Strategy](#5-cache-strategy)
6. [Versioning Strategy](#6-versioning-strategy)
7. [External APIs Inventory](#7-external-apis-inventory)
8. [Scalability Design](#8-scalability-design)
9. [Data Quality Framework](#9-data-quality-framework)
10. [Failure Strategy](#10-failure-strategy)
11. [Observability](#11-observability)
12. [Security Review](#12-security-review)
13. [Cost Model](#13-cost-model)
14. [Technical Risk Matrix](#14-technical-risk-matrix)
15. [Final Sprint Roadmap](#15-final-sprint-roadmap)

---

## 1. Data Flow Complete

### 1.1 End-to-End Asset Journey

```
FASE 0: DISCOVERY ──────────────────────────────────────────────────────
                                                                          
  ENCUENTRA24 ──┐                                                         
  BANCO NACIONAL ┼──► Scraper ──► Raw Data ──► Normalizer ──► Validator
  CAJA AHORROS ─┘                         ↑              ↑               
                                           │              │               
                                      Formatear     Chequear:           
                                      campos,       precio > 0,          
                                      tipos,        área > 0,             
                                      monedas       coordenadas válidas  
                                                                          
FASE 1: INGESTION ───────────────────────────────────────────────────────
                                                                          
  Validator ──► Deduplicator ──► Asset Registry ──► asset.registered
                   ↑                  ↑                                 
              Chequear:         Crear/Actualizar:                      
              URL duplicada     assets table                           
              ID duplicado      asset_versions v1                       
              fuzzy match       timeline event                         
                                                                          
FASE 2: DATA INTELLIGENCE ───────────────────────────────────────────────
                                                                          
  asset.registered ──► Market Intel ──► zone_metrics updated
                    ├──► Historical Intel ──► asset_versions created
                    ├──► Location Intel ────► location_scores calculated
                    │                                                  
                    ▼                                                   
  Market + Location Ready ──► Comparable Engine ──► Valuation Engine
                           ├──► Rental Engine                          
                           ├──► Liquidity Engine                       
                           │                                          
                           ▼                                           
  All Core Metrics Ready ──► Timeline Engine ──► timeline events
                           ├──► Trend Engine ──► trend signals        
                           ├──► Neighborhood Intel ──► profiles updated
                           │                                          
                           ▼                                           
  All Intelligence Ready ──► Investment Classification                 
                                                                          
FASE 3: DECISION ────────────────────────────────────────────────────────
                                                                          
  asset.classified ──► Opportunity Engine ──► score calculated
                      │                       (enhanced with DI data)
                      ▼                                               
              Decision Engine ──► decision produced                     
                                 (BUY_NOW/WATCH/NEGOTIATE/AVOID)       
                                                                          
FASE 4: PERSISTENCE ─────────────────────────────────────────────────────
                                                                          
  Decision Ready ──► Supabase ──► 23 tables updated                     
                  │              (7 legacy + 16 DI tables)              
                  ├──► Redis ──► Cache invalidated                      
                  ├──► Calculation Log ──► audit trail                  
                  │                                                   
                  ▼                                                    
              Dashboard Updated ──► API Ready                          
              Alerts Generated ──► Notifications                          
```

### 1.2 Step-by-Step Detail

| # | Etapa | Input | Output | Responsable | Tiempo | Dependencias |
|---|-------|-------|--------|-------------|--------|-------------|
| 0.1 | **Discovery** | URL config | HTML crudo | Scraper Worker | 5-30s | Playwright, Proxy |
| 0.2 | **Raw Parse** | HTML | Raw Listing (JSON) | Scraper Parser | 1-3s | Schemas |
| 1.1 | **Normalize** | Raw Listing | Normalized Asset | Normalizer | 50ms | Schema, Mapper |
| 1.2 | **Validate** | Normalized Asset | Validated Asset | Validator | 20ms | Zod Schemas |
| 1.3 | **Deduplicate** | Validated Asset | Asset (existing/new) | Deduplicator | 100ms | Assets DB, Fuzzy Matcher |
| 1.4 | **Register** | Asset Data | Asset Record + v1 | Registry Service | 50ms | Assets DB |
| 2.1 | **Market Intel** | Zone ID | ZoneMetrics | Market Engine | 200ms-5s | Zone Hierarchy, Assets |
| 2.2 | **Historical Intel** | Asset ID | Asset Version | Historical Engine | 50ms | Assets DB |
| 2.3 | **Location Intel** | Coordinates | LocationScores | Location Engine | 500ms-3s | POI DB, Geo Calc |
| 2.4 | **Comparable Engine** | Asset + Zone | ComparableSet | Comparable Engine | 200ms-2s | Assets DB (zona+tipo) |
| 2.5 | **Valuation Engine** | Asset + Comparables | ValuationRange | Valuation Engine | 300ms-1s | Comparable Engine, Market Intel |
| 2.6 | **Rental Engine** | Asset + Zone | RentalEstimate | Rental Engine | 100ms | Market Intel, Zone Factors |
| 2.7 | **Liquidity Engine** | Asset + Zone | LiquidityScore | Liquidity Engine | 150ms | Market Intel, Historical Intel |
| 2.8 | **Timeline Engine** | Asset ID | TimelineEvents | Timeline Engine | 50ms | Historical Intel |
| 2.9 | **Trend Engine** | Zone ID | TrendSignals | Trend Engine | 500ms-10s | Market Intel (series) |
| 2.10 | **Neighborhood Intel** | Zone ID | NeighProfile | Neighborhood Engine | 200ms-2s | Market + Liquidity + Rental |
| 2.11 | **Investment Class.** | All Scores | InvestmentCat | Investment Engine | 100ms | Todos los engines anteriores |
| 3.1 | **Opportunity Engine** | Asset + DI Scores | EnhancedScore | Opportunity Engine | 150ms | Data Intelligence (todos) |
| 3.2 | **Decision Engine** | Score + Metrics | Decision | Decision Engine | 50ms | Opportunity Engine |
| 4.1 | **Persistence** | All Results | DB Records | Persistence Service | 200ms | Supabase, 23 tables |
| 4.2 | **Cache Update** | Invalidation Keys | Fresh Cache | Cache Manager | 50ms | Redis |
| 4.3 | **Dashboard Update** | Aggregated Data | Dashboard Stats | Dashboard Service | 100ms | Vista Materializada |
| 4.4 | **Alert Check** | Decision + Trends | Alerts List | Alert Service | 50ms | Decision + Trend Engines |

**Tiempo total por activo (real-time):** ~2-15 segundos
**Tiempo total batch (100 activos):** ~30-60 segundos
**Tiempo total batch nocturno (todos los engines, todas las zonas):** ~5-15 minutos

---

## 2. Dependency Map

### 2.1 Module Dependency Matrix

```
                    ┌──────────────────────────────────────────────────────────────────────────┐
                    │                          CONSUMES                                       │
┌───────────────────├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│    PRODUCES       │Scraper│Norm. │Valid.│Dedup.│Market│Locat.│Hist. │Valua.│Rental│Liquid│Invest│
├───────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Scraper           │  -   │  ██  │      │      │      │      │      │      │      │      │      │
│ Normalizer        │      │  -   │  ██  │      │      │      │      │      │      │      │      │
│ Validator         │      │      │  -   │  ██  │      │      │      │      │      │      │      │
│ Deduplicator      │      │      │      │  -   │      │      │      │      │      │      │      │
│ Market Intel      │      │      │      │      │  -   │      │  ██  │      │      │      │      │
│ Location Intel    │      │      │      │      │      │  -   │      │      │      │      │      │
│ Historical Intel  │      │      │      │      │      │      │  -   │      │      │      │      │
│ Valuation Intel   │      │      │      │      │  ██  │  ██  │      │  -   │      │      │      │
│ Rental Intel      │      │      │      │      │  ██  │  ██  │      │      │  -   │      │      │
│ Liquidity Intel   │      │      │      │      │  ██  │      │  ██  │      │      │  -   │      │
│ Investment Class  │      │      │      │      │  ██  │  ██  │  ██  │  ██  │  ██  │  ██  │  -   │
└───────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

### 2.2 Complete Dependency Map per Module

#### Scraper
| Aspecto | Detalle |
|---------|---------|
| **Consume** | URLs de configuración, HTML de sitios web |
| **Produce** | Raw Listing (JSON sin normalizar) |
| **Tablas** | `sources` (lectura), `raw_listings` (opcional) |
| **Eventos que escucha** | `cron.tick`, `manual.trigger` |
| **Eventos que publica** | `listing.discovered`, `listing.updated`, `listing.removed`, `scraper.error` |
| **APIs externas** | Encuentra24 (HTTP), posiblemente Facebook/Instagram |
| **Dependen de él** | Normalizer, Validator, Deduplicator |

#### Normalizer
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Raw Listing |
| **Produce** | Normalized Asset (tipado, campos estandarizados) |
| **Tablas** | `raw_listings` (lectura) |
| **Eventos que escucha** | `listing.discovered`, `listing.updated` |
| **Eventos que publica** | `asset.normalized` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Validator |

#### Validator
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Normalized Asset |
| **Produce** | Validated Asset + ValidationResult |
| **Tablas** | `validation_log` (escritura) |
| **Eventos que escucha** | `asset.normalized` |
| **Eventos que publica** | `asset.validated`, `asset.validation_failed` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Deduplicator |

#### Deduplicator
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Validated Asset |
| **Produce** | Asset (nuevo) o Asset ID (existente) + merge instructions |
| **Tablas** | `assets` (lectura/escritura) |
| **Eventos que escucha** | `asset.validated` |
| **Eventos que publica** | `asset.registered` (nuevo), `asset.merged` (existente) |
| **APIs externas** | Ninguna |
| **Dependen de él** | Todos los engines de Data Intelligence |

#### Market Intelligence Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Zone ID + activos de la zona |
| **Produce** | ZoneMetrics (precios, DOM, temperatura, crecimiento) |
| **Tablas** | `zone_metrics` (escritura), `zone_hierarchy` (lectura), `assets` (lectura), `asset_versions` (lectura histórica) |
| **Eventos que escucha** | `asset.registered`, `asset.updated`, `cron.hourly` |
| **Eventos que publica** | `market.updated`, `market.temperature_changed`, `zone.metrics_updated` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Valuation Engine, Rental Engine, Liquidity Engine, Trend Engine, Neighborhood Intel, Investment Classification |

#### Location Intelligence Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Coordinates (lat/lng) del activo |
| **Produce** | LocationScores (accessibility, convenience, neighborhood, infrastructure) |
| **Tablas** | `location_scores` (escritura), `location_score_components` (escritura), `point_of_interest` (lectura) |
| **Eventos que escucha** | `asset.registered`, `asset.coordinates_updated` |
| **Eventos que publica** | `location.updated` |
| **APIs externas** | OpenStreetMap Nominatim (geocoding fallback) |
| **Dependen de él** | Valuation Engine, Rental Engine, Investment Classification |

#### Historical Intelligence Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Asset ID + snapshot de datos |
| **Produce** | AssetVersion (nueva versión con diff) |
| **Tablas** | `asset_versions` (escritura), `assets` (lectura) |
| **Eventos que escucha** | `asset.registered`, `asset.price_changed`, `asset.status_changed`, `asset.updated` |
| **Eventos que publica** | `asset.versioned` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Timeline Engine, Liquidity Engine (datos históricos), Trend Engine |

#### Valuation Intelligence Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Asset + ComparableSet + MarketMetrics + LocationScore |
| **Produce** | ValuationRange (conservador, mercado, optimista, confianza) |
| **Tablas** | `valuation_estimates` (escritura), `valuation_comparables_used` (escritura), `assets` (lectura) |
| **Eventos que escucha** | `asset.analyzed`, `comparables.generated` |
| **Eventos que publica** | `valuation.updated` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Opportunity Engine, Investment Classification |

#### Rental Intelligence Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Asset + MarketMetrics + LocationScore |
| **Produce** | RentalEstimate (yield, cap rate, cash flow, calidad) |
| **Tablas** | `rental_estimates` (escritura) |
| **Eventos que escucha** | `asset.analyzed`, `market.updated` |
| **Eventos que publica** | `rental.updated` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Investment Classification, Neighborhood Intel |

#### Liquidity Intelligence Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Asset + ZoneMetrics + Historical DOM data |
| **Produce** | LiquidityScore (score, exit difficulty, market pressure) |
| **Tablas** | `liquidity_scores` (escritura) |
| **Eventos que escucha** | `asset.analyzed`, `market.updated`, `asset.versioned` |
| **Eventos que publica** | `liquidity.updated` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Investment Classification, Neighborhood Intel |

#### Timeline Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Asset + historical events |
| **Produce** | TimelineEvents (price changes, score changes, decisions) |
| **Tablas** | `asset_timeline_events` (escritura) |
| **Eventos que escucha** | `asset.versioned`, `opportunity.updated`, `decision.updated`, `classification.updated` |
| **Eventos que publica** | `timeline.updated` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Dashboard (visualización timeline) |

#### Market Trend Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | ZoneMetrics history (series temporales) |
| **Produce** | TrendSignals (growing, declining, overvalued, etc.) |
| **Tablas** | `trend_signals` (escritura), `zone_metrics` (lectura), `market_snapshots` (lectura) |
| **Eventos que escucha** | `cron.daily`, `market.updated` (solo para check rápido) |
| **Eventos que publica** | `trend.detected`, `trend.expired` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Dashboard (alertas), Neighborhood Intel |

#### Neighborhood Intelligence Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | MarketMetrics + LiquidityMetrics + RentalMetrics + GrowthMetrics |
| **Produce** | NeighborhoodProfile (investment rating, risk level, composite score) |
| **Tablas** | `neighborhood_profiles` (escritura) |
| **Eventos que escucha** | `cron.daily`, `market.updated`, `liquidity.updated`, `rental.updated` |
| **Eventos que publica** | `neighborhood.updated`, `neighborhood.rating_changed` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Dashboard (perfiles de zona), Investment Classification |

#### Investment Classification Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Todos los scores (location, market, rental, liquidity, valuation, neighborhood) |
| **Produce** | InvestmentClassification (categoría principal + secundarias + confianza) |
| **Tablas** | `investment_classifications` (escritura) |
| **Eventos que escucha** | `asset.intelligence_ready` |
| **Eventos que publica** | `asset.classified` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Opportunity Engine, Decision Engine |

#### Opportunity Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | Asset + Data Intelligence Scores (todos) |
| **Produce** | EnhancedScore + EnhancedConfidence |
| **Tablas** | `opportunity_scores` (escritura) |
| **Eventos que escucha** | `asset.classified` |
| **Eventos que publica** | `opportunity.updated` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Decision Engine, Dashboard |

#### Decision Engine
| Aspecto | Detalle |
|---------|---------|
| **Consume** | EnhancedScore + Confidence + InvestmentClassification |
| **Produce** | Decision (BUY_NOW/WATCH/NEGOTIATE/AVOID) + Justification |
| **Tablas** | `decisions` (escritura, nueva tabla) |
| **Eventos que escucha** | `opportunity.updated` |
| **Eventos que publica** | `decision.updated`, `alert.generated` |
| **APIs externas** | Ninguna |
| **Dependen de él** | Dashboard, Notifications |

---

## 3. Event Driven Architecture

### 3.1 Event Bus Design

La plataforma utilizará un **Event Bus interno** con las siguientes características:

- **Implementación:** Pub/Sub en memoria + Redis (para persistencia entre workers)
- **Entrega:** At-least-once (con deduplicación por event ID)
- **Encolamiento:** BullMQ para eventos que requieren procesamiento asíncrono
- **Prioridades:** 3 niveles (critical, normal, background)

### 3.2 Complete Event Catalog

| # | Evento | Generador | Consumidores | Payload | Frecuencia | Prioridad | Tipo |
|---|--------|-----------|--------------|---------|-------------|-----------|------|
| 1 | `listing.discovered` | Scraper | Normalizer, RawLogger | `{source, url, raw, timestamp}` | Por listing | 🔴 Critical | Sync |
| 2 | `listing.updated` | Scraper | Normalizer, RawLogger | `{assetId, url, raw, changes[]}` | Por listing | 🔴 Critical | Sync |
| 3 | `listing.removed` | Scraper | Asset Registry, Historical | `{assetId, url, timestamp}` | Por listing | 🟡 Normal | Sync |
| 4 | `scraper.error` | Scraper | Alert Service, Logger | `{source, url, error, retryCount}` | Por error | 🔴 Critical | Async |
| 5 | `asset.normalized` | Normalizer | Validator | `{asset: NormalizedAsset, source}` | Por listing | 🔴 Critical | Sync |
| 6 | `asset.validated` | Validator | Deduplicator | `{asset: ValidatedAsset, validation}` | Por listing | 🔴 Critical | Sync |
| 7 | `asset.validation_failed` | Validator | Alert Service, Logger | `{asset, errors[], source}` | Por error | 🟡 Normal | Async |
| 8 | `asset.registered` | Deduplicator | Market Intel, Location Intel, Historical Intel | `{assetId, zoneId, coordinates, source}` | Por asset nuevo | 🔴 Critical | Async |
| 9 | `asset.merged` | Deduplicator | Market Intel, Historical Intel | `{assetId, changes[], previousVersion}` | Por asset existente | 🟡 Normal | Async |
| 10 | `asset.updated` | Scraper | Deduplicator, Historical Intel | `{assetId, changes[]}` | Por actualización | 🔴 Critical | Sync |
| 11 | `asset.price_changed` | Scraper/Dedup | Historical Intel, Timeline, Alert | `{assetId, oldPrice, newPrice, changePct}` | Por cambio precio | 🔴 Critical | Async |
| 12 | `asset.versioned` | Historical Intel | Timeline Engine, Liquidity Intel | `{assetId, version, changeReason, snapshot}` | Por versión | 🟢 Background | Async |
| 13 | `market.updated` | Market Intel | Valuation, Rental, Liquidity, Trend, Neighborhood | `{zoneId, metrics, temperature, timestamp}` | Cada run (real-time o batch) | 🟡 Normal | Async |
| 14 | `market.temperature_changed` | Market Intel | Alert Service, Dashboard | `{zoneId, oldTemp, newTemp, ratio}` | Cuando cambia temperatura | 🟡 Normal | Async |
| 15 | `location.updated` | Location Intel | Valuation, Rental, Investment, Dashboard | `{assetId, overallScore, components[]}` | Por asset | 🟡 Normal | Async |
| 16 | `comparables.generated` | Comparable Engine | Valuation Engine | `{assetId, comparableCount, comparables[]}` | Por asset | 🟡 Normal | Async |
| 17 | `valuation.updated` | Valuation Intel | Investment, Opportunity, Dashboard | `{assetId, marketValue, discount, confidence}` | Por asset | 🟡 Normal | Async |
| 18 | `rental.updated` | Rental Intel | Investment, Neighborhood, Dashboard | `{assetId, yield, capRate, quality}` | Por asset | 🟢 Background | Async |
| 19 | `liquidity.updated` | Liquidity Intel | Investment, Neighborhood, Dashboard | `{assetId, liquidityScore, exitDifficulty}` | Por asset | 🟢 Background | Async |
| 20 | `trend.detected` | Trend Engine | Alert Service, Dashboard, Notification | `{zoneId, signalType, confidence, evidence}` | Cuando se detecta | 🟡 Normal | Async |
| 21 | `trend.expired` | Trend Engine | Dashboard | `{zoneId, signalType, reason}` | Diario | 🟢 Background | Async |
| 22 | `neighborhood.updated` | Neighborhood Intel | Dashboard, Investment | `{zoneId, rating, compositeScore}` | Diario | 🟢 Background | Async |
| 23 | `neighborhood.rating_changed` | Neighborhood Intel | Alert Service, Notification | `{zoneId, oldRating, newRating, reason}` | Cuando cambia rating | 🟡 Normal | Async |
| 24 | `timeline.updated` | Timeline Engine | Dashboard | `{assetId, eventCount, latestEvent}` | Por evento | 🟢 Background | Async |
| 25 | `asset.intelligence_ready` | Orchestrator | Investment Classification | `{assetId, scores: {market, location, valuation, rental, liquidity}}` | Por asset completo | 🔴 Critical | Sync |
| 26 | `asset.classified` | Investment Class | Opportunity Engine, Timeline, Dashboard | `{assetId, primaryCategory, confidence, allClassifications[]}` | Por asset | 🔴 Critical | Sync |
| 27 | `opportunity.updated` | Opportunity Engine | Decision Engine, Timeline, Dashboard | `{assetId, score, confidence, factors{}}` | Por asset | 🔴 Critical | Sync |
| 28 | `decision.updated` | Decision Engine | Timeline, Dashboard, Alert, Notification | `{assetId, decision, previousDecision, justification}` | Por asset | 🔴 Critical | Async |
| 29 | `alert.generated` | Decision/Trend | Dashboard, Notification Service | `{type, severity, assetId?, zoneId?, message}` | Por alerta | 🟡 Normal | Async |
| 30 | `dashboard.updated` | Dashboard Service | WebSocket clients | `{metrics, alerts[], topOpportunities[]}` | Cada 5 min | 🟢 Background | Broadcast |
| 31 | `snapshot.generated` | Scheduler | Market Snapshots, Reports | `{snapshotId, date, marketMetrics}` | Semanal | 🟢 Background | Async |
| 32 | `cache.invalidated` | Cache Manager | All consumers (indirecto) | `{keys[], reason, zoneId?, assetId?}` | Por actualización | 🟡 Normal | Broadcast |

**Total: 32 eventos** (10 sync, 20 async, 2 broadcast)

### 3.3 Event Flow Diagram

```
SCRAPER ────► listing.discovered ──────► Normalizer ────► asset.normalized
  │                                              │
  ├──► listing.updated ───────► Normalizer ──────┤
  │                                              ▼
  └──► listing.removed ──────► Asset Registry   asset.validated
                                                    │
                                                    ▼
                                               Deduplicator
                                                    │
                                          ┌─────────┼─────────┐
                                          │         │         │
                                          ▼         ▼         ▼
                                   asset.   asset.   asset.
                                   registered merged  price_changed
                                          │         │
                    ┌─────────────────────┤         │
                    │          ┌──────────┼─────────┘
                    ▼          ▼          ▼
              Market Intel  Location   Historical
                    │          │          │
                    ▼          ▼          ▼
              market.updated  location.  asset.
                              updated    versioned
                    │          │          │
                    └─────┬────┴──────────┘
                          ▼
                    Comparable Engine
                          │
                          ▼
                    comparables.generated
                          │
                          ▼
                    Valuation Engine ───► valuation.updated
                    Rental Engine ───────► rental.updated
                    Liquidity Engine ────► liquidity.updated
                          │
                          ▼
              ┌─────────────────────┐
              │ intelligence_ready  │
              └──────────┬──────────┘
                         ▼
              Investment Classification
                         │
                         ▼
              asset.classified
                         │
                         ▼
              Opportunity Engine ──► opportunity.updated
                         │
                         ▼
              Decision Engine ────► decision.updated
                         │
                         ├──► alert.generated
                         ├──► timeline.updated
                         └──► dashboard.updated
```

### 3.4 Event Payload Standards

```typescript
// Standard envelope for ALL events
interface EventEnvelope<T = unknown> {
  id: string;                    // UUID v4
  type: string;                  // Del catálogo
  version: string;               // Schema version (ej. "1.0")
  source: string;                // Nombre del módulo emisor
  timestamp: string;             // ISO 8601
  correlationId: string;         // Para tracing cross-module
  causationId: string | null;    // ID del evento causal (cadena completa)
  data: T;                       // Payload específico
  metadata: {
    environment: string;         // "production" | "staging" | "development"
    sourceRunId?: string;        // ID del scraper run
    retryCount: number;         // 0 para primera entrega
    ttl: number;                 // Time-to-live en segundos (eventos expirables)
  };
}
```

---

## 4. Calculation Strategy

### 4.1 Classification Matrix

| Motor | Modo | Gatillador | Tiempo Máx | Justificación |
|-------|------|-----------|------------|---------------|
| **Historical Intel** | ⚡ Tiempo real | `asset.registered`, `asset.price_changed` | 50ms | Debe ser inmediato para no perder cambios de precio |
| **Location Intel** | ⚡ Tiempo real | `asset.registered`, `asset.coordinates_updated` | 3s | Dependencia de Valuation y Opportunity |
| **Market Intel** | ⚡ Tiempo real (parcial) | `asset.registered` (solo zona afectada) | 5s | Actualización incremental; batch completo nocturno |
| **Comparable Engine** | ⚡ Tiempo real | `asset.registered` | 2s | Necesario para Valuation inmediata |
| **Valuation Intel** | ⚡ Tiempo real | `asset.intelligence_ready` | 1s | Crítico para el scoring inmediato |
| **Opportunity Engine** | ⚡ Tiempo real | `asset.classified` | 150ms | Debe responder instantáneamente |
| **Decision Engine** | ⚡ Tiempo real | `opportunity.updated` | 50ms | Debe responder instantáneamente |
| **Rental Intel** | 🟡 Bajo demanda | Cuando se consulta el asset o batch diario | 100ms | No bloquea el flujo principal |
| **Liquidity Intel** | 🟡 Bajo demanda + Diario | Cuando se consulta o batch nocturno | 150ms | Se puede calcular lazy |
| **Timeline Engine** | 🟡 Bajo demanda | Cuando se consulta el timeline o por evento | 50ms | Generar solo cuando se necesita |
| **Investment Class.** | 🟡 Bajo demanda + Diario | `asset.intelligence_ready` o batch nocturno | 100ms | Se puede diferir si hay carga |
| **Market Trend** | 🕐 Diario (nocturno) | Cron: 2 AM | 10min | Requiere datos de varios días para ser preciso |
| **Neighborhood Intel** | 🕐 Diario (nocturno) | Cron: 2 AM | 2min | Requiere todos los engines ejecutados |
| **Market Snapshot** | 📅 Semanal | Cron: Domingo 3 AM | 5min | No necesita ser más frecuente |
| **Historical Purge** | 📅 Mensual | Cron: 1ro del mes 4 AM | 10min | Limpieza de logs viejos |

### 4.2 Estrategia de Cálculo Detallada

```
TIEMPO REAL (asset.registered → decision.updated)
  ├── Historical Intel (inmediato)
  ├── Location Intel   (inmediato)
  ├── Market Intel     (incremental, solo zona)
  ├── Comparable       (inmediato)
  ├── Valuation        (inmediato)
  ├── Rental           (lazy: solo si hay viewer esperando)
  ├── Liquidity        (lazy: solo si hay viewer esperando)
  ├── Investment Class (inmediato si todos los inputs listos)
  ├── Opportunity      (inmediato)
  └── Decision         (inmediato, último paso)

BAJO DEMANDA (cuando API/dashboard consulta)
  ├── Rental Intel     (calcular si TTL expirado)
  ├── Liquidity Intel  (calcular si TTL expirado)
  ├── Timeline         (generar bajo demanda)
  └── Trend (rápido)   (solo check de señal activa)

BATCH DIARIO (2 AM)
  ├── Market Intel     (recalcular TODAS las zonas)
  ├── Market Trend     (analizar series temporales)
  ├── Rental Intel     (recalcular todos)
  ├── Liquidity Intel  (recalcular todos)
  ├── Neighborhood     (recalcular todos los perfiles)
  └── Investment Class (recalcular clasificaciones)

BATCH SEMANAL (Domingo 3 AM)
  └── Market Snapshot  (congelar estado del mercado)
```

### 4.3 Algoritmo de Decisión de Cálculo

```
function shouldCalculate(engine: Engine, asset: Asset): CalculationMode {
  // 1. ¿Es un engine crítico en tiempo real?
  if (engine.realtimeRequired && engine.dependencies.ready(asset)) {
    return 'REALTIME';
  }

  // 2. ¿Hay un viewer esperando el resultado?
  if (hasPendingQuery(engine, asset)) {
    return 'ON_DEMAND';
  }

  // 3. ¿El TTL del último cálculo expiró?
  if (getLastCalculation(engine, asset).age > engine.ttl) {
    return 'ON_DEMAND';  // Se recalculará cuando alguien lo pida
  }

  // 4. ¿Es hora del batch nocturno?
  if (isBatchTime(engine)) {
    return 'BATCH';
  }

  // 5. Defer: no calcular ahora
  return 'SKIP';
}
```

---

## 5. Cache Strategy

### 5.1 Cache TTL Table

| Información | TTL | Almacenamiento | Justificación |
|-------------|-----|----------------|---------------|
| **Comparables Query** | 6 horas | Redis | Los listados no cambian tan rápido; 6h balancea frescura vs. carga |
| **Location Scores** | 30 días | Redis / DB | Los POIs casi no cambian; solo recalcular si el activo se mueve o hay nuevos POIs |
| **Zone Metrics** | 1 hora | Redis | Datos de mercado pueden cambiar con nuevos listings; 1h es aceptable |
| **Market Trends** | 24 horas | Redis + DB | Las tendencias son de medio plazo; diario es suficiente |
| **Rental Metrics** | 24 horas | Redis + DB | Los factores de zona cambian lentamente |
| **Liquidity Metrics** | 6 horas | Redis | DOM puede cambiar con nuevos listings, pero no tan rápido |
| **Neighborhood Profiles** | 7 días | Redis + DB | Perfiles de zona son estables; semanal es adecuado |
| **Valuation Estimate** | 6 horas | Redis | Puede cambiar si hay nuevos comparables |
| **Investment Classification** | 6 horas | Redis | Depende de valuation + otros scores |
| **Opportunity Score** | Sin TTL (por evento) | DB | Se recalcula solo cuando cambian los inputs |
| **Dashboard Aggregates** | 5 minutos | Redis | Suficientemente fresco para dashboard en tiempo real |
| **POI Database** | 24 horas + invalidación manual | Memoria local | Los POIs se cargan al iniciar; se refrescan diario |
| **Configuration (weights, factors)** | ∞ (hasta deploy) | Memoria local | Solo cambia con releases |
| **Calculation Log** | Sin cache | DB directo | Siempre escribir directo a DB para auditoría |

### 5.2 Cache Invalidation Rules

```
Regla general: invalidar el mínimo necesario, no todo.

1. asset.registered en zona X:
   → invalidar: zone_metrics:X, comparables:X:* (solo zona X)
   → NO invalidar: location_scores, neighborhood_profiles, market_trends

2. asset.price_changed para asset Y en zona X:
   → invalidar: valuation:Y, opportunity:Y, zone_metrics:X
   → NO invalidar: location:Y, rental:Y (no dependen de precio directamente)

3. POI añadido/modificado en zona X:
   → invalidar: location_scores:* (solo zona X)
   → NO invalidar: todo lo demás

4. Batch diario completado:
   → invalidar: neighborhood_profiles:*, trend_signals:*, zone_metrics:*
   → NO invalidar: valuations individuales (se invalidan solos)

5. Nueva versión de engine deployada:
   → invalidar: TODO (cambio de versión = cambio de algoritmo)
   → Recalcular todo en el próximo batch nocturno

6. Manual (admin):
   → invalidar zona específica: zone:X, neighborhood:X, trend:X
   → invalidar asset específico: valuation:Y, location:Y, opportunity:Y
   → invalidar todo: flush completa (solo si deploy o data corruption)
```

### 5.3 Cache Implementation

```typescript
interface CacheEntry<T> {
  value: T;
  expiresAt: number;           // Unix timestamp ms
  version: string;             // Engine version when cached
  createdAt: number;           // Unix timestamp ms
  hitCount: number;            // Para estadísticas
  lastAccessed: number;        // Para LRU eviction
}

// Key naming convention
// asset:{assetId}:valuation
// asset:{assetId}:location
// zone:{zoneId}:metrics
// zone:{zoneId}:trends
// zone:{zoneId}:neighborhood
// comparable:{zoneId}:{type}:{priceRange}
// dashboard:{type}:summary
```

---

## 6. Versioning Strategy

### 6.1 Engine Versioning

Cada engine tiene su propio versionado semántico independiente.

```
Formato: v{Major}.{Minor}.{Patch}

Major: Cambio en algoritmo/fórmula que altera resultados
Minor: Nuevos features, inputs adicionales, no rompe compatibilidad
Patch: Bug fixes, optimizaciones, sin cambio en resultados
```

### 6.2 Version Table

| Engine | Versión Actual | Historial de Versiones | Compatibilidad hacia atrás |
|--------|---------------|----------------------|--------------------------|
| Market Intelligence | v1.0.0 | v1.0.0 | Ninguna (primera versión) |
| Location Intelligence | v1.0.0 | v1.0.0 | Ninguna |
| Historical Intelligence | v1.0.0 | v1.0.0 | Ninguna |
| Comparable Engine | v1.0.0 | v1.0.0 | Ninguna |
| Valuation Intelligence | v1.0.0 | v1.0.0 | Ninguna |
| Rental Intelligence | v1.0.0 | v1.0.0 | Ninguna |
| Liquidity Intelligence | v1.0.0 | v1.0.0 | Ninguna |
| Timeline Engine | v1.0.0 | v1.0.0 | Ninguna |
| Market Trend Engine | v1.0.0 | v1.0.0 | Ninguna |
| Neighborhood Intelligence | v1.0.0 | v1.0.0 | Ninguna |
| Investment Classification | v1.0.0 | v1.0.0 | Ninguna |
| Opportunity Engine | v2.0.0 | v1.0.0 (legacy), v2.0.0 | v1 legacy mode disponible |
| Decision Engine | v2.0.0 | v1.0.0 (legacy), v2.0.0 | v1 legacy mode disponible |

### 6.3 Migration Path

```
v1.0.0 → v1.1.0 (Minor):
  - Nuevas features son ADDITIVAS
  - Resultados existentes no cambian
  - Cache v1.0.0 sigue siendo válida (se añade flag new_feature_available)

v1.0.0 → v2.0.0 (Major):
  - Nuevo algoritmo que cambia resultados
  - Cache v1.0.0 INVÁLIDA (diferente versión)
  - Migration: recalcular batch nocturno
  - Rollback: restaurar cache desde backup

v1.x → v1.x+1 (Patch):
  - Sin cambio en output
  - Cache válida (solo cambiar versión en metadata)
  - Sin migration necesaria
```

### 6.4 Version Tracking in Database

```
Cada resultado en DB tiene:
  - calculation_version: "1.0.0"
  - engine_version: "v1.0.0"
  
calculation_log almacena:
  - engine_version: "v1.0.0"
  - weights_used: { ... }  // Snapshot de configuración
```

### 6.5 Deprecation Policy

```
1. Announce: Marcar engine como "deprecated" en status endpoint
2. Grace period: 30 días de funcionamiento paralelo
3. Migration: Recalcular todos los resultados con nueva versión
4. Removal: Eliminar código de engine antiguo
5. Archive: Mover versión antigua a branch de archive
```

### 6.6 Rollback Strategy

```
Emergency Rollback:
  1. Feature flag: togglear a SCORING_VERSION=v1 (versión legacy)
  2. Restaurar versión anterior del engine desde git
  3. Invalidar cache del engine afectado
  4. Recalcular en batch nocturno

Sin pérdida de datos gracias al versionado:
  - Todos los resultados antiguos están en calculation_log con engine_version
  - asset_versions mantiene snapshots históricos
  - Podemos re-ejecutar cualquier cálculo con cualquier versión
```

---

## 7. External APIs Inventory

### 7.1 Complete Inventory

| API | Propósito | Costo | Límites | Rate Limits | Fallback | Prioridad | Riesgo |
|-----|-----------|-------|---------|-------------|----------|-----------|--------|
| **Encuentra24** (HTTP scraping) | Fuente principal de listings | Gratuito | Ilimitado (público) | Ninguno (web pública) | Datos mock para test | 🔴 Alta | Bloqueo de IP, cambios de HTML |
| **OpenStreetMap Nominatim** | Geocoding (dirección → coordenadas) | Gratuito | 1 req/s | 1 req/s | Cache de geocoding | 🟡 Media | Rate limiting, precisión variable |
| **OpenStreetMap Overpass** | POI queries por zona | Gratuito | Ilimitado | None (con restricciones) | POIs manuales | 🟡 Media | Disponibilidad variable |
| **Google Maps Geocoding** (futuro) | Geocoding + POIs de alta calidad | $5/1K reqs | 40K reqs/día (plan free) | 50 reqs/s | OpenStreetMap | 🟢 Baja (opcional) | Costo, vendor lock-in |
| **Banco Nacional** (scraping) | Comparables financieros | Gratuito | Ninguno | Ninguno | Datos mock | 🟡 Media | Sitio público, cambios HTML |
| **Caja de Ahorros** (scraping) | Comparables financieros | Gratuito | Ninguno | Ninguno | Datos mock | 🟡 Media | Sitio público, cambios HTML |
| **ANATI** (API futura) | Datos de propiedad registrada | Potencialmente paga | Desconocido | Desconocido | Prescindible | 🟢 Baja (ML futuro) | Disponibilidad, costo |
| **INEC** (API futura) | Datos demográficos | Gratuito | Desconocido | Desconocido | Estimaciones | 🟢 Baja (ML futuro) | Actualización lenta |

### 7.2 Rate Limit Strategy

```
OpenStreetMap Nominatim:
  - Cola de 1 req/s (respetar fair use policy)
  - Cache de geocoding: misma dirección nunca se geocode dos veces
  - Bulk geocoding en batch nocturno (1 req/s = 3,600/hora)

Scraping general:
  - 1 req cada 2-5 segundos por fuente
  - Rotación de User-Agent
  - Proxy rotativo si hay bloqueo (costo adicional)
  - Respetar robots.txt

Google Maps (si se implementa):
  - Usar API key con restricciones de dominio
  - Cache de 30 días para resultados de geocoding
```

### 7.3 Fallback Hierarchy

```
GEOCODING:
  1. OpenStreetMap Nominatim (gratuito, suficiente para MVP)
  2. Cache local (hash de dirección)
  3. Coordenadas de zona (centroide de zona como fallback)
  4. NULL + flag "sin coordenadas" (reducir location score)

POIs:
  1. OpenStreetMap Overpass API
  2. POIs precargados manualmente (seed data)
  3. Categorías genéricas por tipo de zona (estimación estadística)

VALUATION:
  1. Comparable Engine con datos reales de la zona
  2. Extender radio de búsqueda (zona → corregimiento → distrito)
  3. Ajuste de precio promedio de zona + factor de tipo
  4. Valor default = precio del activo (no modificar score)
```

---

## 8. Scalability Design

### 8.1 Scale Tiers

#### Tier 1: 100,000 activos (objetivo inmediato)

| Componente | Especificación | Costo Mensual Est. |
|------------|---------------|-------------------|
| **Base de datos** | Supabase Pro ($25/mes) | $25 |
| | 8 GB RAM, 10 GB SSD | |
| **Redis** | Redis Cloud Free (30 MB) → Pro ($15/mes) | $0-15 |
| **Cache** | En memoria + Redis para hot data | Incluido |
| **Worker** | 1 worker (proceso Node.js) | $0 |
| **Scraping** | Playwright + proxy gratuito | $0 |
| **Dashboard** | Servido por worker existente | $0 |
| **API endpoints** | Worker existente | $0 |
| **Total** | | **$25-40/mes** |

**Métricas esperadas:**
- Assets: 100K
- Versiones: 1.5M (15 por asset)
- Comparables: 1-1.5M (10-15 por valuation)
- Location scores: 100K
- Timeline events: 3M (30 por asset)
- Cálculos diarios: ~50K
- DB size: ~2-3 GB
- Query performance: < 100ms con índices

#### Tier 2: 1,000,000 activos

| Componente | Especificación | Costo Mensual Est. |
|------------|---------------|-------------------|
| **Base de datos** | Supabase Scale ($100/mes, 32 GB RAM, 100 GB SSD) | $100 |
| **Redis** | Redis Cloud Pro ($50/mes, 1 GB) | $50 |
| **Workers** | 2-3 workers (Node.js) | $0 (misma máquina) |
| **Materialized Views** | 3 views con refresh schedule | Incluido |
| **Particionamiento** | calculation_log por mes + asset_timeline por mes | Incluido |
| **Scraping** | Playwright + proxy list ($30/mes) | $30 |
| **Dashboard** | Cache de 5 min en Redis | Incluido |
| **Total** | | **$180/mes** |

**Métricas esperadas:**
- DB size: ~20-30 GB
- Query performance con particionamiento: < 200ms
- Batch diario: ~30 min
- Cache hit rate objetivo: > 85%

#### Tier 3: 5,000,000 activos

| Componente | Especificación | Costo Mensual Est. |
|------------|---------------|-------------------|
| **Base de datos** | Supabase Enterprise (~$500/mes, 64 GB RAM, 500 GB SSD) | $500 |
| | O PostgreSQL en VPS dedicado | $150 (VPS) |
| **Redis Cluster** | Redis Cloud Pro ($150/mes, 5 GB cluster) | $150 |
| **Workers** | 5-10 workers (procesos separados) | $100 |
| **Colas** | BullMQ + Redis (incluido en Redis) | $0 |
| **Read Replicas** | 1 replica de lectura para dashboard | $50 |
| **Scraping** | Proxy pool ($100/mes), 5 scraper workers | $100 |
| **Storage** | 500 GB SSD | Incluido |
| **CDN** | Cloudflare ($20/mes) para dashboard assets | $20 |
| **Total** | | **$820-920/mes** |

#### Tier 4: 10,000,000 activos

| Componente | Especificación | Costo Mensual Est. |
|------------|---------------|-------------------|
| **Base de datos** | PostgreSQL en cluster (2 primarias + 2 réplicas) | $1,000 |
| **Redis Cluster** | 3 nodos Redis | $300 |
| **Workers** | 20 workers auto-escalados | $400 |
| **Colas** | BullMQ + Redis dedicado | Incluido |
| **Sharding** | Por zona geográfica + tipo de propiedad | $0 |
| **Read Replicas** | 3 réplicas (dashboard, API, reports) | $300 |
| **Scraping pool** | 10 scrapers con proxies rotativos | $200 |
| **CDN + Cache** | Cloudflare Enterprise | $200 |
| **Storage** | 2 TB SSD en cluster | $300 |
| **Monitoring** | Grafana Cloud | $50 |
| **Total** | | **$2,750/mes** |

### 8.2 Estrategia de Particionamiento

```sql
-- Particionar por mes las tablas de alto volumen
-- Implementar desde el diseño inicial en Supabase

-- Tablas candidatas a partición:

-- 1. calculation_log (~50K/día)
   PARTITION BY RANGE (created_at);
   Partes mensuales: calculation_log_2026_01, calculation_log_2026_02, ...
   Retención: 90 días (automatizado con función de purge)

-- 2. asset_timeline_events (~3M por 100K assets)
   PARTITION BY RANGE (event_date);
   Partes mensuales: timeline_2026_01, timeline_2026_02, ...
   
-- 3. zone_metrics (~182K/año)
   PARTITION BY RANGE (snapshot_date);
   Partes trimestrales: zone_metrics_2026_Q1, zone_metrics_2026_Q2, ...

-- 4. asset_versions (~1.5M por 100K assets)
   Solo particionar si supera 10M de filas
   PARTITION BY RANGE (valid_from)
```

### 8.3 Materialized Views Strategy

```sql
-- Para consultas frecuentes de dashboard y API

-- MV1: asset_intelligence_summary (refrescar: cada 5 min)
   Unifica datos de 7 tablas para consultas de dashboard

-- MV2: zone_dashboard_metrics (refrescar: cada 1 hora)
   Métricas agregadas por zona para mapas y comparativas

-- MV3: market_snapshot_weekly (refrescar: domingo 3 AM)
   Snapshot congelado del mercado para reportes históricos
```

---

## 9. Data Quality Framework

### 9.1 Metadata Standards

Cada dato almacenado en la plataforma DEBE tener:

| Campo | Descripción | Cálculo | Almacenamiento |
|-------|-------------|---------|----------------|
| **source** | Origen del dato | Configuración del scraper/engine | `source` columna o `metadata->source` |
| **confidence** | Confianza en la precisión (0-100) | Ver abajo | Por tabla de métricas |
| **timestamp** | Cuándo se obtuvo el dato | `NOW()` del engine | `created_at`, `calculated_at` |
| **version** | Versión del engine que lo generó | `engine.version` | `calculation_version`, `engine_version` |
| **validation** | Si pasó validación | Zod schema + validation service | `validation_log` |
| **quality_score** | Score compuesto de calidad (0-100) | Ver fórmula abajo | Metadata (JSONB) |
| **completeness** | % de campos requeridos presentes | `campos_presentes / campos_requeridos * 100` | Metadata |
| **freshness** | Tiempo desde último update | `NOW() - updated_at` | No almacenar (calcular) |
| **reliability** | Fuente históricamente confiable | Basado en historial de errores de la fuente | Metadata |
| **verification_status** | Estado de verificación | `verified` / `unverified` / `inconsistent` | Metadata |

### 9.2 Quality Score Formula

```typescript
function calculateQualityScore(asset: Asset): number {
  // Completeness: qué % de campos importantes están presentes
  const requiredFields = ['price_amount', 'area_m2', 'location', 'type'];
  const completeness = requiredFields.filter(f => asset[f] != null).length 
    / requiredFields.length * 100;
  
  // Freshness: qué tan reciente es el dato
  const ageHours = (Date.now() - asset.updated_at.getTime()) / 3600000;
  const freshness = Math.max(0, 100 - ageHours * 2);  // Decae 2 pts por hora
  
  // Source reliability
  const sourceRatings = { 'encuentra24': 85, 'banco_nacional': 75, 'caja_ahorros': 70 };
  const reliability = sourceRatings[asset.source] || 50;
  
  // Data consistency checks
  const consistencyChecks = [
    asset.price_amount > 0,
    asset.area_m2 > 0 && asset.area_m2 < 10000,
    asset.price_amount / asset.area_m2 > 100,       // mínimo $100/m²
    asset.price_amount / asset.area_m2 < 20000,      // máximo $20,000/m²
  ];
  const consistency = consistencyChecks.filter(c => c).length 
    / consistencyChecks.length * 100;
  
  // Weighted score
  return Math.round(
    completeness * 0.30 +
    freshness * 0.25 +
    reliability * 0.25 +
    consistency * 0.20
  );
}
```

### 9.3 Source Reliability Tracking

```
Cada fuente (scraper) mantiene:
  - Total de assets ingeridos
  - Tasa de error (requests fallidos / total)
  - Tasa de validación (assets válidos / total ingeridos)
  - Tiempo promedio de respuesta
  - Última vez que funcionó correctamente

Score de confiabilidad = 
  (1 - error_rate) * 40 +
  validation_rate * 40 +
  (1 - age_days_since_last_failure / 30) * 20
```

### 9.4 Data Quality Gates

```
Gate 1 (Ingestion):
  - Precio > 0? Sí → continuar. No → flagged como "price_missing"
  - Área > 0? Sí → continuar. No → flagged como "area_missing"
  - Coordenadas válidas? Sí → continuar. No → geocoding automático

Gate 2 (Validation):
  - Zod schema validation
  - Rangos de valores realistas
  - Campos requeridos presentes

Gate 3 (Processing):
  - Confidence score mínimo para incluir en cálculos
  - Assets con < 50% quality score se marcan como "low_quality"
  - Assets "low_quality" no alimentan Market Intel ni Neighborhood Intel
  - Pero sí aparecen en el dashboard con flag de advertencia
```

---

## 10. Failure Strategy

### 10.1 Failure Response Matrix

| Componente | Falla | Retry | Timeout | Circuit Breaker | Fallback | Alerta |
|-----------|-------|-------|---------|-----------------|----------|--------|
| **Scraper Encuentra24** | HTTP error / timeout | 3 retries, 5s apart | 30s | 5 fallos → 5 min pause | Datos mock + flag ⚠️ | 🔴 Email/Slack |
| **OpenStreetMap** | Rate limit / timeout | 2 retries, 10s apart | 5s | No (gratuito, esperar) | Cache de geocoding | 🟡 Log |
| **Supabase** | Connection error | 3 retries, exponential backoff | 5s | 10 fallos → fallback a JSON local | Escribir a buffer.json + flag | 🔴 Email/Slack |
| **Redis** | Connection error | 3 retries, 1s apart | 2s | 5 fallos → degradar a memoria local | Degradar a LRU en proceso | 🟡 Log |
| **Location Engine** | Error de cálculo | 2 retries | 10s | No (por asset) | Score default (50) + degraded flag | 🟡 Log |
| **Valuation Engine** | Sin comparables suficientes | No retry (falta data) | 5s | No | Extender radio, fallback a precio zona | 🟡 Log (asset) |
| **Opportunity Engine** | Error de cálculo | 3 retries | 5s | 5 fallos → alert + flag | Legacy scoring v1 | 🔴 Email/Slack |
| **Decision Engine** | Error de cálculo | 3 retries | 3s | 5 fallos → alert + flag | Última decisión conocida | 🔴 Email/Slack |
| **Dashboard** | Cache miss | No retry | 2s | No | Query directa a DB | 🟢 No action |
| **Worker** | Crash/OOM | Auto-restart (PM2) | N/A | N/A | Otro worker toma el proceso | 🔴 Email/Slack |
| **Queue** | Redis down | N/A | N/A | N/A | Fallback a procesamiento síncrono | 🔴 Email/Slack |

### 10.2 Retry Policy

```typescript
const RETRY_POLICIES: Record<string, RetryPolicy> = {
  scraper: {
    maxRetries: 3,
    initialDelay: 5000,       // 5s
    backoffMultiplier: 2,     // 5, 10, 20s
    maxDelay: 60000,          // 1 min
    jitter: true,              // +-20% aleatorio
    retryOnStatus: [429, 500, 502, 503, 504],
  },
  database: {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 3,     // 1, 3, 9s
    maxDelay: 30000,
    jitter: true,
  },
  api: {
    maxRetries: 2,
    initialDelay: 2000,
    backoffMultiplier: 2,
    maxDelay: 10000,
    jitter: false,
  },
};
```

### 10.3 Circuit Breaker Configuration

```typescript
const CIRCUIT_BREAKERS: Record<string, CircuitBreakerConfig> = {
  scraper_encuentra24: {
    failureThreshold: 5,      // 5 fallos consecutivos
    successThreshold: 3,      // 3 éxitos para reabrir
    openDurationMs: 300000,   // 5 min abierto
    halfOpenMaxRequests: 2,   // 2 requests en half-open
  },
  openstreetmap: {
    failureThreshold: 10,     // Más tolerante (servicio gratuito)
    successThreshold: 3,
    openDurationMs: 60000,    // 1 min
    halfOpenMaxRequests: 1,
  },
  supabase: {
    failureThreshold: 10,     // DB failures son críticos
    successThreshold: 5,
    openDurationMs: 60000,    // 1 min
    halfOpenMaxRequests: 2,
  },
};
```

### 10.4 Graceful Degradation Tiers

```
Tier 0: ✅ Normal
  - Todos los sistemas funcionando
  - Cálculos completos en tiempo real

Tier 1: ⚠️ Degradado Leve
  - Una fuente de datos externa caída (OSM, scraper)
  - Se usa caché + datos mock
  - Todos los engines funcionan con datos reducidos

Tier 2: ⚠️ Degradado Moderado
  - Redis caído (caché deshabilitada)
  - Cálculos más lentos (sin cache)
  - Dashboard con datos de DB directa (más lentos)

Tier 3: 🔴 Degradado Crítico
  - Supabase caído
  - Fallback a buffer.json + procesamiento en memoria
  - Dashboard muestra último snapshot conocido
  - Scrapers continúan pero resultados se almacenan localmente

Tier 4: 🚫 Caída Total
  - Worker caído
  - PM2 restart automático (hasta 3 intentos)
  - Si persiste: alerta inmediata al CTO
```

---

## 11. Observability

### 11.1 Logging Strategy

| Tipo | Destino | Retención | Formato | Qué incluir |
|------|---------|-----------|---------|-------------|
| **Application logs** | `logs/` + stdout | 30 días | JSON estructurado | `{timestamp, level, module, message, assetId?, correlationId, performanceMs}` |
| **Engine calculation logs** | `calculation_log` table | 90 días | Fila SQL | Input hash, output hash, performance, error, version, weights |
| **Error logs** | `logs/errors/` + alerta | 90 días | JSON | Stack trace, input context, asset data, request/response |
| **Access logs** | `logs/access/` | 30 días | JSON | IP, endpoint, método, status code, duration |
| **Slow query logs** | `logs/slow-queries/` | 7 días | SQL + EXPLAIN | Query, duration, table scan info |
| **Audit logs** | `logs/audit/` | 1 año | JSON | Quién, qué, cuándo, desde dónde, qué cambió |

### 11.2 Metrics Collection

| Métrica | Recolector | Frecuencia | Alarma si |
|---------|-----------|-----------|-----------|
| **Engine calculation time (avg)** | StatsD | Cada cálculo | > 5s promedio última hora |
| **Engine error rate** | Prometheus | Cada minuto | > 5% última hora |
| **Cache hit rate** | Redis INFO | Cada minuto | < 60% sostenido |
| **Pipeline duration (E2E)** | Timer | Por asset | > 30s |
| **Scraper success rate** | Counter | Por listing | < 80% éxito |
| **Active assets count** | DB query | Cada 5 min | Tendencia anómala (±50% de lo normal) |
| **DB connection pool usage** | DB metric | Cada 10s | > 80% ocupado |
| **Queue depth** | BullMQ | Cada 10s | > 1,000 items |
| **API response time (p95)** | Middleware | Por request | > 1s |
| **Memory usage** | OS metrics | Cada 10s | > 85% |
| **Disk usage** | OS metrics | Cada minuto | > 80% |
| **Slow queries** | DB logs | Por query | > 500ms |

### 11.3 Health Check Endpoints

```
GET /health
  → { status, uptime, version, environment }

GET /health/live
  → { ok: true }  (simple liveness, sin dependencias)

GET /health/ready
  → { ok: true, checks: { supabase: true, redis: true, queue: true }}

GET /health/data-intelligence
  → { engines: { market: { status, lastRun, errorRate }, ... }}

GET /health/scrapers
  → { sources: { encuentrat24: { status, lastRun, successRate }, ... }}
```

### 11.4 Alert Rules

| Alerta | Condición | Canal | Severidad |
|--------|-----------|-------|-----------|
| Engine failure rate > 5% | 1 hora | Slack + Email | 🔴 Critical |
| Pipeline stalled > 10 min | Sin actividad | Slack + SMS | 🔴 Critical |
| Scraper failure rate > 50% | 30 min | Slack | 🟡 Warning |
| DB pool > 80% | 5 min | Slack | 🟡 Warning |
| Cache hit rate < 50% | 1 hora | Slack | 🟡 Warning |
| Disk > 85% | - | Slack + Email | 🟡 Warning |
| Queue backlog > 1,000 | 10 min | Slack | 🟡 Warning |
| Slow query detected | > 1s | Slack (daily digest) | 🟢 Info |
| New asset classification | Inversión categoría cambió | Slack (opcional) | 🟢 Info |
| Market temperature change | Zona cambia de hot a cold | Slack | 🟡 Warning |

### 11.5 Distributed Tracing

```
correlationId: UUID generado al inicio del pipeline
  - Se propaga a todos los eventos y logs del mismo asset
  - Permite reconstruir el recorrido completo de un asset
  - Se almacena en calculation_log y asset_timeline_events

Flujo de tracing:
  Scraper genera correlationId → se pasa a todos los eventos
  → Normalizer incluye correlationId en asset.normalized
  → Cada engine incluye correlationId en calculation_log
  → Dashboard puede mostrar "Ver trace" por asset
```

---

## 12. Security Review

### 12.1 Permissions Matrix

| Recurso | Lectura | Escritura | Admin |
|---------|---------|-----------|-------|
| **Assets** | API autenticada | Pipeline interno | Admin |
| **Data Intelligence scores** | API autenticada | Pipeline interno (engines) | Admin |
| **Configuration (weights, factors)** | Admin | Admin | Admin |
| **POI Database** | API autenticada | Admin + Seed scripts | Admin |
| **Zone Hierarchy** | API autenticada | Admin | Admin |
| **Calculation Log** | Admin | Solo escritura (engines) | Admin |
| **User data** | Usuario propio | Usuario propio | Admin |
| **API Keys** | - | - | Admin |

### 12.2 Row Level Security (Supabase)

```sql
-- Ejemplo de RLS para assets
CREATE POLICY "Assets are viewable by authenticated users"
  ON assets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Assets are writable by pipeline service"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM service_accounts));

-- RLS para Data Intelligence scores
CREATE POLICY "DI scores viewable by authenticated"
  ON location_scores FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "DI scores writable by engines"
  ON location_scores FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM engine_service_accounts));
```

### 12.3 Secrets Management

```
Reglas:
  1. NUNCA hardcodear secrets en código
  2. Usar .env + .env.example (sin valores reales)
  3. Supabase service_role key SOLO en pipeline interno
  4. API keys con restricciones de IP/dominio

Almacenamiento:
  - Desarrollo: .env local (gitignored)
  - Producción: Variables de entorno del sistema
  - Nunca: En código, en logs, en respaldos no cifrados

Rotación:
  - API keys de scraping: cada 90 días
  - Supabase anon key: cada 180 días
  - Service role key: solo si comprometida
```

### 12.4 Rate Limiting por Endpoint

| Endpoint | Rate Limit | Burst | Justificación |
|----------|-----------|-------|---------------|
| `/api/v1/data-intelligence/*` | 60 req/min | 10 | Proteger engines de abuso |
| `/api/v1/dashboard/*` | 30 req/min | 5 | Dashboard es pesado en queries |
| `/api/v1/system/*` | 10 req/min | 2 | Endpoints administrativos |
| Asset Intelligence (compuesto) | 20 req/min | 3 | Endpoint pesado (7 tablas) |
| Export | 5 req/min | 1 | Exportación intensiva |

### 12.5 PII & Compliance

```
Datos considerados PII (Personal Identifiable Information):
  - Nombre del vendedor (si está en listing)
  - Teléfono de contacto
  - Dirección exacta (vs. coordenadas aproximadas)

Política:
  1. NO almacenar PII a menos que sea estrictamente necesario
  2. Si se almacena: cifrado en reposo
  3. Datos de contacto con TTL máximo de 30 días
  4. Excluir PII de logs y exportaciones
  5. Las coordenadas se aproximan a nivel de cuadra, no de casa exacta

Cumplimiento:
  - Panamá no tiene GDPR, pero aplicamos los mismos estándares
  - Derecho de olvido: endpoint para eliminar datos de un asset específico
  - Portabilidad: exportación JSON completa de datos del usuario
```

### 12.6 Auditoría

```
TODO acceso a datos sensibles debe quedar registrado:
  - Quién accedió
  - A qué recurso
  - Cuándo
  - Qué operación (SELECT/INSERT/UPDATE/DELETE)
  - Desde qué IP
  - Con qué API key

Almacenamiento: audit_log table + logs rotados
Retención: 1 año (mínimo legal)
```

---

## 13. Cost Model

### 13.1 Cost Breakdown by Scale

| Componente | 100 activos | 1,000 activos | 10,000 activos | 100,000 activos | 1M activos |
|-----------|------------|--------------|---------------|----------------|-----------|
| **Supabase** (DB) | $0 (free tier) | $0 | $25 (Pro) | $25 (Pro) | $100 (Scale) |
| **Redis** | $0 (dev) | $0 (30 MB free) | $15 (Pro 100MB) | $15 (Pro 100MB) | $50 (Pro 1GB) |
| **Storage** | $0 (2 GB free) | $0 | $0 (10 GB) | $0 (10 GB) | $10 (100 GB) |
| **Bandwidth** | $0 (2 GB free) | $0 | $0 (50 GB) | $0 (50 GB) | $8 (200 GB) |
| **Playwright/Scraping** | $0 | $0 | $0 | $0 | $0 (local) |
| **Proxy (scraping)** | $0 | $0 | $0 | $0 | $30 |
| **OpenStreetMap** | $0 | $0 | $0 | $0 | $0 |
| **Google Maps** (opcional) | $0 | $0 | $5 | $10 | $50 |
| **Workers** (CPU/RAM) | $0 (incluido) | $0 | $0 | $0 | $0 |
| **Monitoring** | $0 (grafana free) | $0 | $0 | $0 | $10 |
| **CDN** | $0 | $0 | $0 | $0 | $20 |
| **Total/mes** | **$0** | **$0** | **$30-45** | **$40-50** | **$250-280** |

### 13.2 Cost Estimation Methodology

```
Costos Fijos (no escalan con activos):
  - Servidor actual (incluido en Hermes): $0
  - Playwright: $0 (open source)
  - OpenStreetMap: $0 (gratuito)
  - Monitoreo básico: $0 (Grafana free tier)

Costos Variables (escalan con activos):
  - Supabase: $25 para 100K activos (8 GB RAM suficiente)
  - Redis: $15 para 100K activos (100 MB suficiente para hot cache)
  - Google Maps (opcional): ~$5 por 1,000 geocoding requests

Costo por activo (100K activos):
  - Storage: ~$0.00025/activo (10 GB / 100K)
  - Compute: ~$0.0004/activo/mes
  - Total: ~$0.00065/activo/mes = $0.65 por 1,000 activos
```

### 13.3 Optimization Recommendations

```
Para minimizar costos operativos:

1. Maximizar cache hit rate (> 85%)
   → Reduce cálculos redundantes
   → Menos CPU, menos DB queries

2. Batch nocturno para cálculos pesados
   → Tarifa plana de Supabase sin costo por query
   → Aprovechar horas de menor uso

3. Compresión JSONB para metadata
   → Reduce storage en ~40%
   → Sin costo de descompresión en consultas simples

4. Retención de logs: 90 días
   → Más que suficiente para debugging
   → Particionar y purgar automáticamente

5. Sin dependencias de APIs pagas en MVP
   → OpenStreetMap gratuito para POIs y geocoding
   → Google Maps solo si se necesita precisión de coordenadas a nivel de casa
```

---

## 14. Technical Risk Matrix

| # | Riesgo | Prob. | Impacto | Nivel | Mitigación | Responsable | Prioridad |
|---|--------|-------|---------|-------|-----------|-------------|-----------|
| R1 | **Scrapers dejan de funcionar** (cambio HTML/anti-bot) | Alta (60%) | Alto (8) | 🔴 48 | Monitoreo de estructura HTML, alertas tempranas, rotación de User-Agent, proxy pool, actualización manual de selectores | DevOps | P0 |
| R2 | **Precios estimados vs reales tienen sesgo** | Alta (50%) | Alto (8) | 🔴 40 | Validación contra Golden Dataset, intervalos de confianza, flag de "estimado" | Data Scientist | P0 |
| R3 | **POI data para Panamá insuficiente** | Alta (70%) | Medio (5) | 🟡 35 | Carga manual inicial + OSM Overpass + permitir contribución de datos | Full Stack | P1 |
| R4 | **Valuation Engine impreciso sin datos históricos** | Alta (60%) | Medio (6) | 🟡 36 | Método de tendencia zonal como fallback, intervalo de confianza amplio | Data Scientist | P1 |
| R5 | **Performance se degrada con 100K+ activos** | Media (40%) | Alto (8) | 🟡 32 | Índices, MV, particionamiento, cache, diseño desde el inicio | Backend | P1 |
| R6 | **Coordenadas de propiedades imprecisas** | Alta (80%) | Medio (4) | 🟡 32 | Geocoding por dirección + aproximación a centroide de zona | Full Stack | P1 |
| R7 | **Market Temperature sin datos de demanda real** | Alta (70%) | Medio (5) | 🟡 35 | Usar proxy (views, contactos, velocidad de venta), documentar limitación | Data Scientist | P1 |
| R8 | **Circuit breaker mal configurado** (falsos positivos) | Media (30%) | Alto (7) | 🟡 21 | Thresholds conservadores al inicio, monitoreo intensivo primera semana | Backend | P2 |
| R9 | **Conflictos de concurrencia en cálculos** | Media (40%) | Medio (5) | 🟡 20 | Lock por asset_id + cola de eventos | Backend | P2 |
| R10 | **Dependencia de Redis agrega latencia** | Baja (20%) | Medio (5) | 🟢 10 | Cache en memoria como fallback inmediato | Backend | P2 |
| R11 | **Migración de Opportunity Engine v1→v2 introduce bugs** | Media (30%) | Alto (8) | 🟡 24 | A/B testing, flag de versión, legacy mode disponible | Full Stack | P1 |
| R12 | **Costo de Supabase escala más rápido de lo esperado** | Baja (20%) | Alto (7) | 🟢 14 | Migración a PostgreSQL plano planificada como contingencia | DevOps | P2 |
| R13 | **Falta de datos históricos para trends (primeros 3 meses)** | Alta (80%) | Bajo (3) | 🟡 24 | Usar datos actuales como tendencia plana, comenzar a recolectar ya | Full Stack | P2 |
| R14 | **Sobreingeniería antes de validación con datos reales** | Media (40%) | Medio (6) | 🟡 24 | Roadmap prioriza validación temprana, sprint 1 con datos reales | CTO | P1 |

**Total de Riesgos:** 14
**Nivel Crítico (🔴):** 1 (R1)
**Nivel Medio (🟡):** 9 (R2-R11, R13-R14)
**Nivel Bajo (🟢):** 3 (R10, R12)

---

## 15. Final Sprint Roadmap

### Sprint 1: Fundación + Market Intelligence + Historical Intel
**Duración:** 2 semanas
**Dependencias:** Ninguna (starting fresh)

| Objetivos | Entregables | Riesgos | Criterios de Aceptación |
|-----------|------------|---------|------------------------|
| Crear módulo `apps/data-intelligence` | package.json, tsconfig, estructura directorios | R5 (performance) | Build pasa |
| Implementar Zone Hierarchy | zone_hierarchy.sql + service + seed con zonas de Panamá | R3 (POIs) | 500+ zonas cargadas |
| Implementar Market Intelligence Engine | market_intelligence.ts + zone_metrics.sql | R7 (demanda proxy) | Precio promedio/mediano/m² calculado correctamente |
| Implementar Historical Intelligence Engine | asset_versions.sql + trigger automático | R5 (volumen) | Nuevo asset → versión 1 creada. Cambio precio → versión 2 |
| Migración SQL inicial (003) | 3 tablas + índices + funciones | R5 (índices) | Migración ejecuta sin errores |
| Tests | 30+ tests unitarios | R11 (bugs) | Cobertura > 80% |
| Integración pipeline | data-intelligence-pipeline.mjs steps | R9 (concurrencia) | Pipeline ejecuta steps DI |

### Sprint 2: Location Intelligence + Comparable Engine
**Duración:** 2 semanas
**Dependencias:** Sprint 1 (Zone Hierarchy, assets poblados)

| Objetivos | Entregables | Riesgos | Criterios de Aceptación |
|-----------|------------|---------|------------------------|
| Poblar POI database (200+ POIs Ciudad de Panamá) | point_of_interest.sql + seed script | R3 (POIs insuficientes) | 200+ POIs en DB |
| Implementar Location Intelligence Engine | location_intelligence.ts + location_scores.sql | R6 (coordenadas) | Score calculado para activos con coordenadas |
| Implementar Comparable Engine | comparable-engine.ts | R5 (performance) | 10+ comparables por activo en < 2s |
| Tests Location + Comparable | 20+ tests | R11 | Cobertura > 80% |
| Pipeline steps | Location + Comparable integrados | R9 | Pipeline ejecuta ambos steps |

### Sprint 3: Valuation Engine + Rental Engine
**Duración:** 2 semanas
**Dependencias:** Sprint 2 (Comparables + Location)

| Objetivos | Entregables | Riesgos | Criterios de Aceptación |
|-----------|------------|---------|------------------------|
| Implementar Valuation Engine | valuation_intelligence.ts + 2 tablas | R2 (sesgo), R4 (sin históricos) | Valor conservador/mercado/optimista con intervalo de confianza |
| Implementar Rental Engine | rental_intelligence.ts + rental_estimates.sql | R7 (sin demanda real) | Yield, Cap Rate, Cash Flow calculados |
| Calibrar contra Golden Dataset | validation/calibration-script.ts | R2 | Error < 15% en market_value |
| Tests Valuation + Rental | 30+ tests | R11 | Cobertura > 80% |
| Integrar con Opportunity Engine (Fase 1) | Data Intelligence disponible para consulta | R11 | DI data en DB, Opp Engine sin cambios |

### Sprint 4: Liquidity + Timeline + Trends
**Duración:** 2 semanas
**Dependencias:** Sprint 1 + Sprint 3 (datos históricos acumulados)

| Objetivos | Entregables | Riesgos | Criterios de Aceptación |
|-----------|------------|---------|------------------------|
| Implementar Liquidity Engine | liquidity_intelligence.ts + liquidity_scores.sql | R5 (DOM data) | LiquidityScore + Exit Difficulty |
| Implementar Timeline Engine | timeline-engine.ts + asset_timeline_events.sql | R5 (volumen) | Timeline generada con eventos de precio, score, decisión |
| Implementar Market Trend Engine | market_trend_engine.ts + trend_signals.sql | R13 (sin histórico) | Al menos 4 tipos de señal detectables |
| Tests | 25+ tests | R11 | Cobertura > 80% |

### Sprint 5: Neighborhood + Investment Classification + Integración Completa
**Duración:** 2 semanas
**Dependencias:** Sprints 1-4 (todos los engines funcionando)

| Objetivos | Entregables | Riesgos | Criterios de Aceptación |
|-----------|------------|---------|------------------------|
| Implementar Neighborhood Intel | neighborhood_intelligence.ts + neighborhood_profiles.sql | R5 (performance) | Perfiles completos con Investment Rating |
| Implementar Investment Classification | investment_intelligence.ts + investment_classifications.sql | R2 (clasificación correcta) | 5+ categorías, multiclasificación |
| Integración completa con Opportunity Engine (Fase 3) | data-intelligence-adapter.ts + enhanced-scoring.ts | R11 (bugs) | Enhanced scoring con 5+ features DI |
| Vista materializada | asset_intelligence_summary | R5 (performance) | Consultas < 100ms |
| API endpoints (31) | API controllers | R5 | Todos los endpoints responden |
| Market Snapshot | market_snapshots.sql + weekly cron | R13 | Snapshot semanal generable |
| Tests E2E + Performance | Integration tests + load test con 10K activos | R5 | 10K activos procesados en < 10 min |
| Documentación | README, migration docs, runbooks | - | Cobertura completa |

---

## Gate Approval Checklist

Para aprobar el inicio del Sprint 1, deben cumplirse:

| # | Criterio | Estado |
|---|----------|--------|
| 1 | **Arquitectura escalable** — 100K-10M activos soportados con diseño incremental | ⬜ |
| 2 | **Arquitectura mantenible** — Módulos desacoplados, contratos explícitos, eventos | ⬜ |
| 3 | **Arquitectura desacoplada** — Event-driven, dependency injection, 32 eventos | ⬜ |
| 4 | **Millones de activos** — Particionamiento, MV, índices, cache, escalamiento progresivo | ⬜ |
| 5 | **Evolución futura sin reescrituras** — Versionado de engines, migration paths, rollback | ⬜ |
| 6 | **Costos operativos minimizados** — $40-50/mes para 100K activos, $0 para MVP | ⬜ |
| 7 | **Trazabilidad y reproducibilidad** — Versionado total, calculation_log, correlationId | ⬜ |
| 8 | **Riesgos identificados y mitigados** — 14 riesgos con mitigación y responsable | ⬜ |
| 9 | **Roadmap realista** — 6 sprints, 9-12 semanas, dependencias claras | ⬜ |
| 10 | **Seguridad revisada** — RLS, secrets, rate limiting, PII, auditoría | ⬜ |

---

**Documento preparado para revisión del CTO. La implementación del Data Intelligence Layer comenzará únicamente cuando todos los criterios de la Gate Approval Checklist estén marcados como aprobados.**

---

## 16. Non-Functional Requirements (NFR)

### 16.1 Availability & Reliability

| Métrica | Objetivo MVP | Objetivo Producción | Medición |
|---------|-------------|---------------------|----------|
| **Disponibilidad** | 99.0% (3 días/mes) | 99.9% (8.7h/año) | Uptime del pipeline + API |
| **SLA** | Sin SLA formal (MVP) | 99.5% mensual | Prometheus + Grafana |
| **SLO** | Pipeline completo ≤ 99% | Engine individual ≥ 99.9% | SLI: éxito de cada engine |
| **MTTR** | < 60 min (manual) | < 15 min (auto + manual) | Tiempo desde alerta hasta resolución |
| **MTBF** | > 72 horas | > 336 horas (14 días) | Tiempo entre fallos del pipeline |

### 16.2 Performance

| Métrica | Objetivo MVP | Objetivo Producción |
|---------|-------------|---------------------|
| **Throughput** | 50 activos/hora | 1,000 activos/hora |
| **Latencia pipeline (E2E)** | < 30s por activo | < 10s por activo |
| **Latencia API (p95)** | < 500ms | < 200ms |
| **Latencia API (p99)** | < 1s | < 500ms |
| **Concurrencia esperada** | 1 usuario | 10 usuarios simultáneos |
| **Batch diario (todos los engines)** | < 5 min (100 activos) | < 30 min (100K activos) |
| **Tiempo de recuperación tras fallo** | < 10 min (manual) | < 2 min (automático) |

### 16.3 Scalability

| Eje | MVP | Producción |
|-----|-----|-----------|
| **Horizontal** | 1 worker (monolítico) | Múltiples workers por tipo de evento |
| **Vertical** | 2 GB RAM, 1 vCPU | 8 GB RAM, 4 vCPU |
| **DB connection pool** | 10 conexiones | 50 conexiones |
| **Storage** | 10 GB (Supabase Pro) | 500 GB (RDS + particionamiento) |

### 16.4 Backup & Disaster Recovery

| Componente | Estrategia MVP | Estrategia Producción |
|-----------|---------------|----------------------|
| **Base de datos** | Backup diario (Supabase automático) | Backup cada 6h + WAL archiving + PITR |
| **Configuración** | Git (infraestructura como código) | Git + encryptado |
| **Caché** | Sin backup (reconstruible) | Redis RDB + AOF |
| **Logs** | Rotación local 30 días | Log shipping a almacenamiento externo |

**DR Plan:**
- RPO (Recovery Point Objective): 24h (MVP) → 1h (Producción)
- RTO (Recovery Time Objective): 2h (MVP) → 30 min (Producción)
- DR Runbook: `docs/runbooks/disaster-recovery.md`

### 16.5 Observabilidad (NFR)

| Aspecto | MVP | Producción |
|---------|-----|-----------|
| **Logs** | stdout estructurado + archivos rotados | Log shipping centralizado (Grafana Cloud) |
| **Métricas** | Health check endpoint | Prometheus + Grafana dashboard |
| **Tracing** | correlationId en logs | OpenTelemetry distribuido |
| **Alertas** | Slack + Email | Slack + SMS + PagerDuty |
| **Slow queries** | PostgreSQL `auto_explain` | pganalyze o pgBadger |

---

## 17. MVP Scope

### 17.1 Incluye (MVP)

| Componente | Detalle | Prioridad |
|-----------|---------|-----------|
| **Encuentra24 Scraper** | Listings de propiedades en venta en Ciudad de Panamá | P0 |
| **Banco Nacional Scraper** | Listings de propiedades rematadas/bancarias | P1 |
| **Caja de Ahorros Scraper** | Listings de propiedades rematadas/bancarias | P1 |
| **Dashboard** | Web app con KPIs, activos, scores, decisiones | P0 |
| **Opportunity Engine** | Scoring de oportunidades con Enhanced Mode (v2) | P0 |
| **Decision Engine** | Decisión BUY_NOW/WATCH/NEGOTIATE/AVOID | P0 |
| **Supabase** | Base de datos + API REST + RLS | P0 |
| **Market Intelligence** | Precios promedio, mediano, m², DOM, temperatura por zona | P0 |
| **Historical Intelligence** | Versionado automático de assets | P0 |
| **Location Intelligence** | Scores de ubicación con POIs de OSM | P0 |
| **Comparable Engine** | Selección de comparables para valuación | P0 |
| **Valuation Intelligence** | Valor conservador/mercado/optimista con intervalos | P0 |
| **Rental Intelligence** | Yield, Cap Rate, Cash Flow estimados | P1 |
| **Liquidity Intelligence** | Liquidity Score, Exit Difficulty | P1 |
| **Investment Classification** | Categorización de inversión (flip, rental, etc.) | P1 |
| **Timeline Engine** | Línea de tiempo de precio, score, decisión | P1 |
| **Market Trend Engine** | Señales de tendencia (growing, declining, overvalued) | P1 |
| **Neighborhood Intelligence** | Perfiles completos de zona con Investment Rating | P1 |
| **Data Intelligence API** | 31 endpoints internos para consumption por dashboard y engines | P1 |

### 17.2 No Incluye (MVP explícitamente fuera de scope)

| Componente | Razón | ¿Cuándo? |
|-----------|-------|----------|
| **Machine Learning** | Sin datos históricos suficientes para entrenar modelos | Post-MVP (Mes 6+) |
| **Predicción automática de precios** | Depende de ML y datos históricos | Post-MVP (Mes 6+) |
| **Auto negociación** | Requiere integración con APIs transaccionales, agentes legales | Fase 3 |
| **CRM** | No es el core de inteligencia de inversiones | Fase 3 |
| **Alertas inteligentes (push, SMS)** | MVP usa notificaciones en dashboard y Slack | Post-MVP (Mes 3+) |
| **Multi país** | Enfoque exclusivo en Panamá para MVP | Fase 3 |
| **Mobile App** | Dashboard web responsive es suficiente para MVP | Fase 3 |
| **APIs públicas** | APIs internas solo para dashboard y engines | Post-MVP |
| **Multi usuario** | Single-user para MVP | Post-MVP (Mes 3+) |
| **Facebook Marketplace** | Anti-scraping agresivo, requiere análisis legal | Post-MVP (si aplica) |
| **ANATI** | API no pública, requiere convenio | Fase 3 |
| **Google Maps** | OpenStreetMap es suficiente para MVP | Post-MVP (mejora) |
| **Procesamiento de imágenes** | Alto costo computacional vs valor agregado | Fase 3 |
| **Generación de lenguaje natural** | Costo de LLM, no necesario para dashboard | Post-MVP |

### 17.3 MVP No-Fly List (explícitamente prohibido en MVP)

1. No introducir dependencias de APIs pagas (Google Maps, ANATI)
2. No implementar funcionalidades que requieran GPU
3. No agregar scrapers fuera de Panamá
4. No desarrollar features mobile nativas
5. No almacenar PII (nombres, teléfonos) sin necesidad justificada
6. No implementar sistemas de recomendación ML-based
7. No hacer integraciones bancarias/transaccionales
8. No desarrollar chatbots o interfaces conversacionales

---

## 18. Technical Debt Register

| ID | Descripción | Impacto | Prioridad | Sprint Objetivo | Estado |
|----|-------------|---------|-----------|----------------|--------|
| TD-001 | Cache en memoria volátil (sin persistencia entre reinicios) | Medio — pérdida de cache en restart | P2 | Sprint 4 (cuando se introduzca Redis) | ⬜ Abierto |
| TD-002 | Sin read replicas para dashboard queries | Bajo — impacto solo > 10K activos | P3 | Post-MVP | ⬜ Abierto |
| TD-003 | Sin particionamiento en calculation_log (crece ~50K filas/día) | Medio — impacto > 1M filas (~20 días de operación) | P2 | Sprint 5 o cuando calculation_log > 500K filas | ⬜ Abierto |
| TD-004 | Test coverage < 80% en algunos módulos legacy | Medio — riesgo de regresiones silenciosas | P1 | Sprint 1-2 (cubrir durante implementación DI) | ⬜ Abierto |
| TD-005 | Sin OpenAPI/Swagger para API endpoints | Bajo — dificulta integración futura | P3 | Post-MVP | ⬜ Abierto |
| TD-006 | Sin CI/CD pipeline automatizado (deploy manual) | Medio — riesgo de error humano en deploy | P2 | Sprint 2 | ⬜ Abierto |
| TD-007 | Sin migración down scripts (solo up migrations) | Medio — dificulta rollback de DB | P1 | Sprint 1 (incluir down en migraciones nuevas) | ⬜ Abierto |
| TD-008 | Sin manejo de secrets centralizado (.env local) | Medio — riesgo de leak de secrets en equipo > 1 | P2 | Sprint 3 | ⬜ Abierto |
| TD-009 | Sin rate limiting en API endpoints | Bajo — riesgo de abuso desde dashboard | P3 | Post-MVP | ⬜ Abierto |
| TD-010 | Sin health endpoint para Data Intelligence engines | Medio — dificulta monitoreo | P2 | Sprint 3 | ⬜ Abierto |
| TD-011 | Opportunity Engine v1 legacy code mantenido en paralelo | Bajo — overhead de mantenimiento de 2 versiones | P3 | Sprint 6 (deprecar v1) | ⬜ Abierto |
| TD-012 | Sin manejo de errores estandarizado (EngineError class) | Medio — errores inconsistentes entre engines | P1 | Sprint 1 (implementar desde el diseño inicial) | ⬜ Abierto |

### 12 items de deuda técnica identificados
- **P1 (Crítica):** 3 items → resolver durante Sprint 1-2
- **P2 (Media):** 5 items → resolver durante Sprint 3-5
- **P3 (Baja):** 4 items → Post-MVP

---

## 19. Open Risks

Riesgos que permanecen **no resueltos** después de las mitigaciones definidas, y requieren monitoreo activo durante la implementación.

| ID | Riesgo | Probabilidad | Impacto | Exposición | Monitoreo | Plan de Contingencia |
|----|--------|-------------|---------|-----------|-----------|---------------------|
| OR-01 | **Encuentra24 cambia estructura HTML o implementa Cloudflare anti-bot** | Alta (60%) | Alto (8) | 🔴 48 | Health check diario del scraper + alerta si success rate < 80% | Proxy pool rotativo + fingerprint rotation + actualización manual de selectores |
| OR-02 | **OpenStreetMap Nominatim rate limiting bloquea geocoding batch** | Alta (50%) | Medio (6) | 🟡 30 | Monitoreo de rate limit hits en logs | Cache de geocoding agresivo + cola de 1 req/s + coordenadas de zona como fallback |
| OR-03 | **Golden Dataset insuficiente para calibrar Valuation Engine** | Media (40%) | Alto (8) | 🟡 32 | Comparar valuación contra precios de cierre semanalmente | Validación cruzada + expandir dataset con propiedades vendidas rastreadas manualmente |
| OR-04 | **Cálculos de Market Intelligence lentos con > 10K activos** | Media (30%) | Medio (6) | 🟡 18 | Monitorear tiempo de cálculo de zone_metrics | Vistas materializadas + cache + particionamiento |
| OR-05 | **Coordenadas de propiedades imprecisas afectan Location Score** | Alta (70%) | Medio (4) | 🟡 28 | Mostrar coordenadas en dashboard para verificación manual | Aproximación a centroide de zona + flag de precisión en location score |
| OR-06 | **Sin datos históricos reales para Trend Engine (primeros 90 días)** | Alta (80%) | Bajo (3) | 🟡 24 | N/A — riesgo inevitable por naturaleza del proyecto | Usar tendencia plana + comenzar a recolectar desde el día 1 |
| OR-07 | **Redis no escalará como se espera cuando se introduzca** | Baja (20%) | Medio (5) | 🟢 10 | Load test antes de migrar a Redis | Abstracción CacheProvider permite cambiar implementación |
| OR-08 | **Valuation Engine con sesgo sistemático (sobre/subvaloración)** | Media (50%) | Alto (7) | 🟡 35 | Auditoría mensual de valuaciones contra precios de mercado reales | Ajuste de pesos + recalibración con Golden Dataset expandido |

**Total: 8 Open Risks**
- 🔴 Críticos: 1 (OR-01)
- 🟡 Medios: 5 (OR-02, OR-03, OR-04, OR-05, OR-08)
- 🟢 Bajos: 2 (OR-06, OR-07)

---

## 20. MVP Exit Criteria

El MVP se considera oficialmente completo y la plataforma pasa a **Producción Beta** cuando TODOS los siguientes criterios se cumplan:

### 20.1 Functional Criteria

| # | Criterio | Métrica | Estado |
|---|----------|---------|--------|
| F1 | Activos reales procesados | ≥ 1,000 activos únicos en DB | ⬜ |
| F2 | Fuentes de datos activas | ≥ 2 fuentes (Encuentra24 + BN o CA) | ⬜ |
| F3 | Opportunity Score preciso | Accuracy ≥ 80% contra Golden Dataset | ⬜ |
| F4 | Confidence estable | ≥ 75% promedio en los últimos 500 activos | ⬜ |
| F5 | Dashboard funcional | Todos los KPIs cargando sin errores | ⬜ |
| F6 | Pipeline E2E reproducible | `npm run pipeline` ejecuta completo sin errores | ⬜ |
| F7 | Data Intelligence activo | Market + Location + Valuation + Rental + Liquidity calculados | ⬜ |
| F8 | Decision Engine estable | Distribución de decisiones realista (no sesgada a una categoría) | ⬜ |

### 20.2 Non-Functional Criteria

| # | Criterio | Métrica | Estado |
|---|----------|---------|--------|
| N1 | Scrapers estables | Sin fallos críticos durante 30 días consecutivos | ⬜ |
| N2 | Build verde | `npm run build` 0 errores | ⬜ |
| N3 | Lint verde | `npm run lint` 0 errores | ⬜ |
| N4 | Tests verdes | `npm run test` todos pasan, coverage ≥ 80% | ⬜ |
| N5 | Supabase operativa | Conexión exitosa, todas las migraciones aplicadas | ⬜ |
| N6 | Caché funcionando | Hit rate ≥ 70% | ⬜ |
| N7 | Logging estructurado | Todos los módulos producen logs JSON con formato estándar | ⬜ |
| N8 | Health check pasando | `npm run health` 0 fallos críticos | ⬜ |

### 20.3 Quality Criteria

| # | Criterio | Métrica | Estado |
|---|----------|---------|--------|
| Q1 | Data Quality Score | Score promedio ≥ 75 en los últimos 1,000 activos | ⬜ |
| Q2 | Sin PII almacenada | Auditoría de datos confirma 0 PII en DB | ⬜ |
| Q3 | Documentation complete | README, CHANGELOG, ADRs, runbooks actualizados | ⬜ |
| Q4 | Changelog actualizado | Release notes para cada versión desde MVP | ⬜ |

### 20.4 Exit Gate

Cuando todos los criterios F1-F8, N1-N8 y Q1-Q4 estén marcados como completados:

➡ **Hermes pasa oficialmente de MVP a Producción Beta**
➡ Se inicia Fase 3: ML-Readiness, Optimización, Expansión de fuentes
➡ Se levanta el Architecture Freeze para cambios mayores vía ADR

---

## 21. Release Strategy

### 21.1 Environment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GIT REPOSITORY                            │
│                                                             │
│  main ──────── hotfix/* ──────── tag: v1.x.x                │
│    │                                                        │
│    └── develop ──────── feat/* ──────── tag: v1.x.x-rc      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   DEVELOPMENT    │  │    STAGING       │  │   PRODUCTION     │
│                  │  │                  │  │                  │
│ • Rama: develop  │  │ • Rama: main     │  │ • Rama: main     │
│ • Sin .env real  │  │ • .env staging   │  │ • .env prod      │
│ • Datos mock     │  │ • DB staging     │  │ • DB producción  │
│ • Sin supabase   │  │ • Supabase Pro   │  │ • Supabase Scale │
│ • Deploy manual  │  │ • Deploy manual  │  │ • Deploy manual  │
│                  │  │ • Tests E2E      │  │ • Backup pre     │
│                  │  │ • Validación     │  │   deploy         │
└─────────────────┘  └──────────────────┘  └──────────────────┘
```

### 21.2 Branch Strategy

| Rama | Propósito | Base | Merge a | Protegida |
|------|-----------|------|---------|-----------|
| `main` | Producción estable | — | — | ✅ (no push directo) |
| `develop` | Integración de desarrollo | `main` | `main` (via PR) | ✅ |
| `feat/*` | Features individuales | `develop` | `develop` | ❌ |
| `fix/*` | Bug fixes | `develop` | `develop` | ❌ |
| `hotfix/*` | Fixes críticos en producción | `main` | `main` + `develop` | ❌ |
| `release/*` | Preparación de release | `develop` | `main` | ❌ |

### 21.3 Release Process

```
1. Feature completo → PR a develop → Code Review → Merge
2. Release candidate → PR develop → main → Code Review + Staging Tests
3. Tag: git tag -a v1.x.x -m "Release v1.x.x"
4. Deploy a Staging → Smoke tests (30 min)
5. Deploy a Production → Smoke tests (15 min)
6. Rollback if: error rate > 5% en primeros 30 min
```

### 21.4 Versioning

```
Formato: v{Major}.{Minor}.{Patch}

Major: Cambios que rompen compatibilidad
Minor: Nuevas funcionalidades, sin romper compatibilidad
Patch: Bug fixes, optimizaciones

Ejemplos:
  v1.0.0 — MVP Release
  v1.1.0 — Nuevo scraper (Banco Nacional)
  v1.2.0 — Data Intelligence Layer
  v2.0.0 — ML models + breaking changes
```

### 21.5 Rollback Procedure

```
Emergency Rollback (dentro de los primeros 30 min post-deploy):

1. git revert HEAD --no-commit     # Revertir cambios
2. npm run build                    # Build con código revertido
3. npm run test                     # Tests
4. Deploy versión revertida
5. Verificar health check
6. Comunicar a stakeholders

Rollback de Base de Datos:
  - Siempre incluir migración DOWN en migration SQL
  - Ejecutar migration down antes del deploy revertido
  - Verificar integridad de datos post-rollback
```

### 21.6 Deploy Automation (Post-MVP)

```
Fase 1 (MVP): Deploy manual
  - SSH al servidor
  - git pull
  - npm install && npm run build
  - pm2 restart all

Fase 2 (Post-MVP): CI/CD con GitHub Actions
  - Push a main → trigger deploy
  - Tests automáticos en CI
  - Deploy a staging automático
  - Aprobación manual para producción
```

---

## 22. Definition of Ready (DoR)

Un Sprint o User Story puede comenzar SOLO cuando cumple TODOS estos criterios:

| # | Criterio | Responsable |
|---|----------|-------------|
| 1 | **PRD aprobado** — El documento de requisitos del producto ha sido revisado y aprobado por el CTO | CTO |
| 2 | **Arquitectura aprobada** — El diseño arquitectónico ha sido revisado y aprobado (Architecture Gate Review) | Arquitecto |
| 3 | **Dependencias definidas** — Todas las dependencias con otros módulos, equipos o sistemas externos están identificadas | Developer |
| 4 | **Riesgos conocidos** — Los riesgos técnicos del Sprint están documentados con mitigación | Developer + Arquitecto |
| 5 | **Casos límite documentados** — Edge cases identificados y estrategia de manejo definida | Developer |
| 6 | **Criterios de aceptación definidos** — QA sabe exactamente qué probar y cómo | CTO + Developer |
| 7 | **API contracts definidos** — Si el Sprint expone endpoints, los contratos están acordados | Developer |
| 8 | **Migraciones SQL preparadas** — Si el Sprint modifica DB, la migración está lista y revisada | Developer |
| 9 | **Estimación completada** — El equipo ha estimado el esfuerzo y está dentro del sprint capacity | Equipo |
| 10 | **No hay blockers externos** — infraestructura, APIs, permisos, todo está disponible | Developer |

### DoR Violations (impide comenzar)

- ❌ No hay PRD aprobado para la funcionalidad
- ❌ La migración de DB no está lista
- ❌ Dependencia externa (API, scraper) no verificada
- ❌ El equipo no entiende qué hay que hacer

---

## 23. Definition of Done (DoD)

Un Sprint o User Story se considera COMPLETO SOLO cuando cumple TODOS estos criterios:

| # | Criterio | Verificación |
|---|----------|-------------|
| 1 | **Build verde** | `npm run build` — 0 errores, exit code 0 |
| 2 | **Lint verde** | `npm run lint` — 0 errores (warnings aceptables) |
| 3 | **Tests verdes** | `npm run test` — todos los tests pasan |
| 4 | **Coverage aprobado** | Coverage ≥ 80% para código nuevo (≥ 70% legacy) |
| 5 | **Documentación actualizada** | README, JSDoc, ADR si aplica — todo al día |
| 6 | **Migraciones verificadas** | Migraciones SQL ejecutadas sin errores en dev + staging |
| 7 | **Dashboard actualizado** | Dashboard refleja cambios (KPIs, activos, scores) |
| 8 | **Changelog actualizado** | `CHANGELOG.md` tiene entrada para esta release |
| 9 | **Code Review aprobado** | PR aprobado por al menos 1 reviewer |
| 10 | **Sin regresiones** | Los tests existentes siguen pasando (ningún test legacy roto) |
| 11 | **Logging implementado** | Errores y eventos clave tienen logging estructurado |
| 12 | **Health check actualizado** | Si se añadió un nuevo módulo, health check lo cubre |

### DoD Violations (impide cerrar)

- ❌ Build falla
- ❌ Tests no pasan
- ❌ No hay review aprobado
- ❌ Hay regresiones en funcionalidad existente

---

## 24. ADR Index

Los Architecture Decision Records (ADR) se encuentran en el directorio `adr/`:

| ADR | Título | Estado | Fecha |
|-----|--------|--------|-------|
| ADR-001 | [¿Por qué Supabase?](./adr/ADR-001-supabase.md) | ✅ Aprobado | 2026-07-02 |
| ADR-002 | [¿Por qué Event-Driven?](./adr/ADR-002-event-driven.md) | ✅ Aprobado | 2026-07-02 |
| ADR-003 | [¿Por qué Playwright?](./adr/ADR-003-playwright.md) | ✅ Aprobado | 2026-07-02 |
| ADR-004 | [¿Por qué PostgreSQL?](./adr/ADR-004-postgresql.md) | ✅ Aprobado | 2026-07-02 |
| ADR-005 | [¿Por qué Turborepo?](./adr/ADR-005-turborepo.md) | ✅ Aprobado | 2026-07-02 |
| ADR-006 | [¿Por qué Zod?](./adr/ADR-006-zod.md) | ✅ Aprobado | 2026-07-02 |
| ADR-007 | [¿Por qué Redis (o por qué aún no)?](./adr/ADR-007-redis.md) | ✅ Aprobado | 2026-07-02 |
| ADR-008 | [Estrategia de IA](./adr/ADR-008-ai-strategy.md) | ✅ Aprobado | 2026-07-02 |

---

## 25. Final Approval & Architecture Freeze

### 25.1 Gate Review Summary

| Documento | Estado |
|-----------|--------|
| DATA_INTELLIGENCE_LAYER.md | ✅ Aprobado |
| DATA_INTELLIGENCE_ARCHITECTURE.md | ✅ Aprobado |
| DATA_INTELLIGENCE_SCHEMA.md | ✅ Aprobado |
| DATA_INTELLIGENCE_API.md | ✅ Aprobado |
| DATA_INTELLIGENCE_ROADMAP.md | ✅ Aprobado |
| ARCHITECTURE_GATE_REVIEW.md | ✅ Aprobado |
| CONVENTIONS.md | ✅ Aprobado |
| ADR-001 a ADR-008 | ✅ Aprobados |

### 25.2 Architecture Freeze v1.0

A partir de la aprobación de este documento:

1. **La arquitectura de Hermes v1.0 queda oficialmente congelada.**
2. No se permiten cambios arquitectónicos sin un nuevo ADR aprobado.
3. Los cambios mayores (nuevos engines, cambios en data flow, nuevas dependencias externas) requieren ADR + revisión del CTO.
4. Los cambios menores (bugs, optimizaciones, mejoras de rendimiento) no requieren ADR, pero deben documentarse en CHANGELOG.
5. El Architecture Freeze se levanta automáticamente para la Fase 3 (Post-MVP, Producción Beta), momento en que se creará un nuevo ADR baseline.

### 25.3 Scope del Freeze

| Cambio | ¿Requiere ADR? | ¿Requiere aprobación CTO? |
|--------|---------------|--------------------------|
| Nuevo engine en Data Intelligence Layer | ✅ Sí | ✅ Sí |
| Nueva dependencia externa (API, servicio) | ✅ Sí | ✅ Sí |
| Cambio en el event bus / event catalog | ✅ Sí | ✅ Sí |
| Cambio en el schema de base de datos (tablas nuevas) | ❌ No (migración estándar) | ❌ No |
| Nuevo scraper | ❌ No (si sigue el contrato existente) | ❌ No |
| Bug fix | ❌ No | ❌ No |
| Optimización de rendimiento | ❌ No | ❌ No |
| Actualización de dependencias npm | ❌ No | ❌ No |

### 25.4 Firma de Aprobación

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ARQUITECTURA APROBADA                                   │
│                                                         │
│  Proyecto: Hermes Opportunity Intelligence Platform      │
│  Versión: 1.0.0                                         │
│  Fecha: ___ / ___ / 2026                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │  Firma CTO: _______________________________     │    │
│  │                                                 │    │
│  │  Firma Arquitecto: ________________________     │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ═══════════════════════════════════════════════════    │
│                                                         │
│  A partir de esta firma:                                │
│  ✅ Architecture Freeze v1.0 activo                     │
│  ✅ Sprint 1 autorizado                                 │
│  ✅ Data Intelligence Layer: INICIAR IMPLEMENTACIÓN     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Fin del Architecture Gate Review — Revisión Completa. Pendiente de Firma.**

