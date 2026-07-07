# DATA INTELLIGENCE LAYER — Roadmap
## Hermes Opportunity Intelligence Platform

**Versión:** 1.0.0
**Fecha:** 2026-07-02
**Estado:** BORRADOR PARA REVISIÓN

---

## 0. Resumen

Plan de implementación de la Data Intelligence Layer en 6 sprints, priorizando el motor de mayor impacto primero y asegurando validación temprana con datos reales.

**Duración estimada:** 8-10 semanas (dependiendo de disponibilidad)
**Priorización:** Valor de negocio > Complejidad técnica > Dependencias

---

## 1. Filosofía de Priorización

### 1.1 Principios

1. **Mayor impacto primero** — Empezar con los engines que más valor agregan al Opportunity Engine
2. **Validación temprana** — Cada sprint produce algo usable y testeable
3. **Datos reales desde el inicio** — No construir en vacío; probar con datos de Encuentra24
4. **Deuda técnica cero** — No sacrificar calidad por velocidad
5. **Integración continua** — Cada sprint termina con pipeline funcional

### 1.2 Matriz de Priorización

| Engine | Valor | Complejidad | Dependencias | Prioridad |
|--------|-------|-------------|-------------|-----------|
| Market Intelligence | 🔴 Alto | 🟢 Baja | Ninguna | **1** |
| Historical Intelligence | 🟡 Medio | 🟢 Baja | Ninguna | **2** |
| Location Intelligence | 🔴 Alto | 🟡 Media | POI database | **3** |
| Valuation Intelligence | 🔴 Alto | 🔴 Alta | Market + Location | **4** |
| Rental Intelligence | 🟡 Medio | 🟡 Media | Market | **5** |
| Liquidity Intelligence | 🟡 Medio | 🟡 Media | Market + Historical | **6** |
| Timeline Engine | 🟢 Bajo | 🟢 Baja | Historical | **7** |
| Investment Classification | 🔴 Alto | 🟡 Media | Todos los engines | **8** |
| Neighborhood Intelligence | 🟡 Medio | 🟡 Media | Market + Liquidity + Rental | **9** |
| Market Trend Engine | 🟡 Medio | 🟡 Media | Market + Historical | **10** |
| Dashboard Endpoints | 🟢 Bajo | 🟢 Baja | Todos los engines | Paralelo |

---

## 2. Roadmap por Sprint

### Sprint 1: Fundación y Market Intelligence
**Duración:** 1-2 semanas

**Objetivo:** Establecer la estructura base y el motor de mercado.

| Tarea | Descripción | Entregable |
|-------|-------------|------------|
| 1.1 | Crear `apps/data-intelligence` con estructura de directorios | Módulo base con package.json, tsconfig, types |
| 1.2 | Implementar Zone Hierarchy service | zone_hierarchy.sql + service |
| 1.3 | Implementar Calculation Log repository | calculation_log.sql + repository |
| 1.4 | Implementar Market Intelligence Engine | market_intelligence.ts + zone_metrics.sql |
| 1.5 | Escribir migración SQL (003) inicial | Tablas: zone_hierarchy, zone_metrics, calculation_log |
| 1.6 | Tests unitarios para Market Intel | Jest/vitest tests |
| 1.7 | Integrar con pipeline existente (modo básico) | data-intelligence-pipeline.mjs |

**Criterios de aceptación:**
- [ ] `zone_hierarchy` poblada con datos de Panamá (provincias, distritos, corregimientos)
- [ ] Market Intelligence Engine calcula precio promedio, mediano, m², DOM, temperatura
- [ ] Cada cálculo queda registrado en `calculation_log`
- [ ] Tests pasan con cobertura > 80%
- [ ] Pipeline ejecuta Market Intel step exitosamente

---

### Sprint 2: Historical Intelligence + Location Intelligence (POIs básicos)
**Duración:** 2 semanas

**Objetivo:** Versionado de activos y primeros scores de ubicación.

| Tarea | Descripción | Entregable |
|-------|-------------|------------|
| 2.1 | Implementar Historical Intelligence Engine | asset_versions.sql + historical_intelligence.ts |
| 2.2 | Crear trigger para versionado automático | trigger en assets table |
| 2.3 | Implementar POI database + categorías básicas | point_of_interest.sql + categories config |
| 2.4 | Poblar POIs (top 3 categorías: salud, educación, comercio) | Script de seed + datos iniciales |
| 2.5 | Implementar Location Intelligence Engine | location_intelligence.ts + location_scores.sql |
| 2.6 | Tests unitarios para Historical + Location | Jest/vitest tests |
| 2.7 | Integración con pipeline existente | Pipeline steps |

**Criterios de aceptación:**
- [ ] Nuevos activos generan versión 1 en `asset_versions`
- [ ] Cambios de precio detectados generan nuevas versiones automáticamente
- [ ] Location scores calculados para activos con coordenadas válidas
- [ ] POIs semilla cargados (mínimo 200 POIs en Ciudad de Panamá)
- [ ] Tests pasan con cobertura > 80%

---

### Sprint 3: Valuation Intelligence Engine
**Duración:** 2 semanas

**Objetivo:** Motor de valuación profesional con intervalos de confianza.

| Tarea | Descripción | Entregable |
|-------|-------------|------------|
| 3.1 | Implementar algoritmo de selección de comparables | similarity scoring + query optimization |
| 3.2 | Implementar cálculo de valuación (4 metodologías) | valuation_intelligence.ts |
| 3.3 | Implementar intervalos de confianza y sensibilidad | statistical.ts calculator |
| 3.4 | Crear tablas: valuation_estimates, valuation_comparables_used | SQL migration |
| 3.5 | Integrar con Golden Dataset para calibración | Calibration script |
| 3.6 | Validar precisión contra Golden Dataset | Validation report |
| 3.7 | Tests unitarios + tests de integración | Jest/vitest tests |

**Criterios de aceptación:**
- [ ] Valuation Engine produce conservative/market/optimistic values
- [ ] Margen de error < 15% para propiedades con ≥8 comparables
- [ ] Intervalo de confianza calculado correctamente
- [ ] Explicación generada automáticamente (legible)
- [ ] Precisión ≥ 80% contra Golden Dataset (market_value dentro de ±15% del precio real de venta)
- [ ] Tests pasan con cobertura > 80%

---

### Sprint 4: Rental + Liquidity Intelligence
**Duración:** 2 semanas

**Objetivo:** Rentabilidad de alquiler y facilidad de venta.

| Tarea | Descripción | Entregable |
|-------|-------------|------------|
| 4.1 | Implementar Rental Intelligence Engine | rental_intelligence.ts + rental_estimates.sql |
| 4.2 | Definir factores de zona para Panamá | zone-factors.ts (basado en datos históricos) |
| 4.3 | Implementar Liquidity Intelligence Engine | liquidity_intelligence.ts + liquidity_scores.sql |
| 4.4 | Implementar cálculo de DOM, Market Pressure, Buyer Activity | liquidity-calculator.ts |
| 4.5 | Tests unitarios + integración | Jest/vitest tests |
| 4.6 | Validar estimaciones contra datos reales | Validation report |

**Criterios de aceptación:**
- [ ] Rental Engine estima yield bruto y neto correctamente
- [ ] Cap Rate calculado (NOI / Price)
- [ ] Cash Flow estimado (con supuestos de financiamiento configurables)
- [ ] Clasificación de calidad de alquiler (excellent/good/fair/not_recommended)
- [ ] Liquidity Score compuesto funcional
- [ ] Exit Difficulty calculado
- [ ] Tests pasan con cobertura > 80%

---

### Sprint 5: Timeline + Trends + Neighborhood
**Duración:** 1-2 semanas

**Objetivo:** Línea de tiempo, detección de tendencias y perfiles de zona.

| Tarea | Descripción | Entregable |
|-------|-------------|------------|
| 5.1 | Implementar Timeline Engine | timeline-engine.ts + asset_timeline_events.sql |
| 5.2 | Implementar Market Trend Engine | market_trend_engine.ts + trend_signals.sql |
| 5.3 | Implementar Neighborhood Intelligence Engine | neighborhood_intelligence.ts + neighborhood_profiles.sql |
| 5.4 | Implementar Market Snapshots | market_snapshots.sql + snapshot generator |
| 5.5 | Tests unitarios + validación | Jest/vitest tests |

**Criterios de aceptación:**
- [ ] Timeline events generados automáticamente para price_changes, score_changes, decision_changes
- [ ] Market Trend detecta growing/declining/stable correctamente (validar con datos históricos)
- [ ] Neighborhood Profiles generados para zonas activas
- [ ] Investment Rating calculado correctamente
- [ ] Snapshots de mercado generables bajo demanda
- [ ] Tests pasan con cobertura > 80%

---

### Sprint 6: Investment Classification + Integración Completa
**Duración:** 2 semanas

**Objetivo:** Clasificación de inversión, integración total y dashboard endpoints.

| Tarea | Descripción | Entregable |
|-------|-------------|------------|
| 6.1 | Implementar Investment Intelligence Engine | investment_intelligence.ts + investment_classifications.sql |
| 6.2 | Integrar Data Intelligence con Opportunity Engine | data-intelligence-adapter.ts en hoie-agent |
| 6.3 | Mejorar scoring del Opportunity Engine con nuevos features | enhanced-scoring.ts |
| 6.4 | Mejorar Decision Engine con métricas expandidas | enhanced-decision.ts |
| 6.5 | Crear vista materializada asset_intelligence_summary | SQL migration |
| 6.6 | Implementar API endpoints (30 endpoints) | API routes + controllers |
| 6.7 | Tests E2E de pipeline completo | Integration tests |
| 6.8 | Performance tests con 10,000 propiedades | Load test report |

**Criterios de aceptación:**
- [ ] Investment Classification clasifica correctamente en ≥4 categorías
- [ ] Multi-clasificación soportada (un activo puede ser flip + rental)
- [ ] Opportunity Engine usa al menos 5 nuevos features de Data Intelligence
- [ ] Decision Engine incorpora liquidez y clasificación
- [ ] Pipeline E2E se ejecuta completamente con Data Intelligence habilitado
- [ ] API endpoints responden correctamente
- [ ] Performance tests: 10,000 properties processados en < 10 minutos
- [ ] Tests pasan con cobertura > 80%

---

## 3. Diagrama de Dependencias

```
Sprint 1 (Fundación + Market Intel)
  │
  ├──▶ Sprint 2 (Historical + Location)
  │        │
  │        └──▶ Sprint 3 (Valuation Intel)
  │                  │
  │                  ├──▶ Sprint 4 (Rental + Liquidity)
  │                  │        │
  │                  └────────┴──▶ Sprint 5 (Timeline + Trends + Neighborhood)
  │                                       │
  │                                       └──▶ Sprint 6 (Investment Class + Integración)
  │                                                  │
  ◀──────────────────────────────────────────────────┘
  │
  └── Paralelo: Dashboard Endpoints (Sprint 3-6)
```

**Ruta Crítica:** Sprint 1 → 2 → 3 → 4 → 5 → 6 (sin paralelismo)

**Ruta Acelerada (si hay más recursos):**
- Sprint 1 + 2 en paralelo (diferentes desarrolladores)
- Sprint 3 + 4 en paralelo
- Sprint 5 + 6 en paralelo
- **Duración acelerada: 5-6 semanas**

---

## 4. Integración con Opportunity Engine (Entregable 10)

### 4.1 Plan Detallado de Integración

La integración se realiza en 3 fases dentro del roadmap:

**Fase 1 (Sprint 3): Integración Parcial**
- Data Intelligence produce outputs que se almacenan en las nuevas tablas
- Opportunity Engine continúa usando su lógica actual
- Los datos de DI están disponibles para consulta pero no afectan el scoring

```
Pipeline actual (v1):
  Scrape → Normalize → Opportunity Engine → Decision Engine → Save
                           ↑
                    (datos básicos: price, area, location)

Pipeline con DI Fase 1:
  Scrape → Normalize → Market Intel → Store → Opp Engine (sin cambios) → Decision
                           ↑
                    (datos DI disponibles en DB, no usados aún)
```

**Fase 2 (Sprint 5): Integración Parcial con Flag**
- Se implementa `DataIntelligenceAdapter`
- El adaptador consulta DI en frío (no bloqueante)
- Si DI data está disponible, mejora el scoring
- Flag `SCORING_VERSION=v2` activa la integración

```
Pipeline con DI Fase 2:
  Scrape → Normalize → DI Engines → Store
                                      │
                                      ▼
                              Opp Engine → check: DI available?
                                  │           ├── Sí → enhanced scoring
                                  │           └── No → legacy scoring
                                  ▼
                              Decision Engine
```

**Fase 3 (Sprint 6): Integración Completa**
- DI es parte integral del pipeline
- Todos los engines se ejecutan en orden de dependencias
- El scoring mejorado es el predeterminado
- Legacy mode disponible vía flag para comparación A/B

```
Pipeline DI Completo (v2 definitivo):
  Scrape → Normalize
    ├─► Market Intel
    ├─► Historical Intel
    ├─► Location Intel
    │
    ▼
  Recalculate Zone Metrics (si aplica)
    │
    ▼
  Valuation Intel → Rental Intel → Liquidity Intel
    │
    ▼
  Trends → Neighborhood → Timeline → Investment Class
    │
    ▼
  DataIntelligenceAdapter.aggregate()
    │
    ▼
  Opportunity Engine (enhanced scoring)
    │
    ▼
  Decision Engine (enhanced with classification + liquidity)
    │
    ▼
  Dashboard (todos los datos disponibles)
```

### 4.2 Changes Required in Opportunity Engine

| Archivo | Cambio | Impacto |
|---------|--------|---------|
| `apps/hoie-agent/src/scorer/scorer.ts` | Nuevo método `calculateEnhancedScore()` | Añade features de DI manteniendo el original |
| `apps/hoie-agent/src/pipeline/index.ts` | Añadir steps de DI + adapter | Flujo extendido |
| `apps/hoie-agent/src/pipeline/index.ts` | Integrar `DataIntelligenceAdapter` | Lectura de datos DI |
| `packages/types/src/schemas.ts` | Añadir schemas de DI types | Tipos compartidos |
| `apps/hoie-agent/package.json` | Añadir dependencia `@hermes/data-intelligence` | Workspace dependency |

### 4.3 Scoring Evolution

```
Fase 0 (Actual):       score = 37 + discount*1.8 + bankBonus + compBonus
                       decision thresholds: BUY_NOW ≥80, WATCH ≥65, etc.

Fase 1 (Sprint 3):     score = 37 + discount*1.8 + bankBonus + compBonus
                       + locationBonus (if DI available)
                       decision thresholds: sin cambios

Fase 2 (Sprint 5):     score = 37 + discount*1.8 + bankBonus + compBonus
                       + locationBonus (up to +9)
                       + marketBonus (±8)
                       + liquidityBonus (±7.5)
                       + rentalBonus (up to +12)
                       + historicalTrend (±4)
                       decision thresholds: +5% en confianza con DI

Fase 3 (Sprint 6):     score = enhanced formula completa
                       confidence = enhanced formula con DI
                       decision = enhanced con classification + neighborhood
                       thresholds ajustables por clasificación de inversión
```

### 4.4 A/B Testing Plan

```
Configuración de prueba:
  Grupo A (50% assets): SCORING_VERSION=v1 (legacy)
  Grupo B (50% assets): SCORING_VERSION=v2 (enhanced)

Métricas de comparación:
  - Precisión de decisión (accuracy vs. outcomes reales)
  - Distribución de decisiones (BUY_NOW/WATCH/NEGOTIATE/AVOID)
  - Tasa de acierto en propiedades que realmente se venden
  - Confianza promedio del score

Duración: 2 semanas de datos paralelos
Criterio de éxito: v2 supera v1 en ≥5% de precisión
```

---

## 5. Milestones Clave

| Milestone | Sprint | Fecha Estimada | Entregable |
|-----------|--------|---------------|------------|
| M1: Fundación | S1 | Semana 2 | Módulo DI + Market Intel funcional |
| M2: Datos Históricos | S2 | Semana 4 | Versionado activo + Location Scores |
| M3: Valuación Golden | S3 | Semana 6 | Valuation Engine calibrado contra Golden Dataset |
| M4: Rentabilidad | S4 | Semana 8 | Rental + Liquidity funcionales |
| M5: Tendencias | S5 | Semana 9 | Timeline + Trends + Neighborhood Profiles |
| M6: Release 2.4.0 | S6 | Semana 10 | Integración completa + API + tests |

---

## 6. Riesgos del Roadmap

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|-------------|------------|
| Golden Dataset insuficiente para calibración de valuación | Alto | Media | Usar técnicas de validación cruzada, aumentar dataset con datos sintéticos controlados |
| POIs de Panamá no disponibles en fuentes abiertas | Alto | Alta | Priorizar categorías principales, permitir carga manual, usar OSM como fallback |
| Precisión de valuación < 80% | Alto | Media | Añadir más metodologías (ML), expandir radio de búsqueda, ajustar pesos |
| Rendimiento con 100k propiedades | Medio | Baja | Optimizar queries, vistas materializadas, cache agresivo desde el inicio |
| Complexidad de integración con Opportunity Engine | Medio | Media | Integración gradual por fases, testing A/B, feature flags |
| Datos históricos insuficientes para trends | Medio | Alta | Empezar a recolectar desde ahora, usar defaults estadísticos |

---

## 7. Post-Release (Fase 2.4.x)

Después del release 2.4.0:

| Item | Prioridad | Descripción |
|------|-----------|-------------|
| Calibración continua | Alta | Ajustar pesos y factores con datos reales del mercado panameño |
| POI expansion | Media | Añadir más POIs y categorías (playas, gimnasios, etc.) |
| Machine Learning models | Media | Implementar modelos predictivos usando los datos recolectados |
| Dashboard v2 | Media | Interfaz visual para todas las métricas de Data Intelligence |
| Reportes automáticos | Baja | Generación de informes de mercado semanales |
| API pública | Baja | Exponer API de Data Intelligence para consumo externo |

---

## 8. Resumen de Esfuerzo

| Componente | Líneas Est. | Días | Tests | Prioridad |
|-----------|-------------|------|-------|-----------|
| Market Intelligence Engine | ~400 | 3 | 15+ | P0 |
| Historical Intelligence Engine | ~300 | 2 | 10+ | P0 |
| Location Intelligence Engine | ~500 | 5 | 20+ | P0 |
| Valuation Intelligence Engine | ~800 | 8 | 30+ | P0 |
| Rental Intelligence Engine | ~400 | 3 | 15+ | P1 |
| Liquidity Intelligence Engine | ~400 | 3 | 15+ | P1 |
| Timeline Engine | ~250 | 2 | 10+ | P1 |
| Neighborhood Intelligence Engine | ~350 | 3 | 12+ | P1 |
| Market Trend Engine | ~300 | 3 | 12+ | P1 |
| Investment Intelligence Engine | ~400 | 4 | 15+ | P0 |
| API Endpoints | ~800 | 4 | 20+ | P1 |
| Integration (Opp Engine) | ~500 | 4 | 20+ | P0 |
| Migration SQL | ~300 | 1 | — | P0 |
| **Total** | **~5,700** | **~40-50 días** | **~200 tests** | |

---

**Fin del documento de Roadmap — Todos los entregables completados.**
