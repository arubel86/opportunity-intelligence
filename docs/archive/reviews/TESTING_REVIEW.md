# TESTING REVIEW
## Hermes Platform — Phase 2.4 Technical Hardening

**Fecha:** 2026-07-03

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Tests unitarios existentes | 4 |
| Cobertura estimada del core | < 15% |
| Archivos sin test | ~20 archivos funcionales |
| Test runner | vitest (configurado) |
| Tests de integración | 0 |
| E2E tests | 0 |

---

## 1. Tests Existentes

### 1.1 Ubicación

```
apps/hoie-agent/src/
├── pipeline/__tests__/
│   └── normalizer.test.ts       — ✅ 1 test
├── scorer/__tests__/
│   └── opportunity-scorer.test.ts — ✅ 1 test
├── engine/__tests__/
│   ├── comparable-engine.test.ts  — ✅ 1 test
│   └── valuation-engine.test.ts   — ✅ 1 test
```

### 1.2 Análisis de los tests existentes

**normalizer.test.ts** — ✅ Bueno
- Crea un asset de prueba con fixture
- Verifica campos normalizados correctamente
- Validación contra null/undefined

**opportunity-scorer.test.ts** — ✅ Bueno
- Test con fixture mínimo (asset + source)
- Verifica score calculado correctamente
- Valores dentro de rango (0-100)

**comparable-engine.test.ts** — 🟡 Aceptable
- Verifica lógica de comparación de assets
- Pero usa comparables hardcodeados sin fixture

**valuation-engine.test.ts** — 🟡 Aceptable
- Verifica cálculo de valor estimado
- Sin test de edge cases (sin comparables, distritos diferentes)

### 1.3 Problemas comunes

| Problema | Descripción |
|----------|-------------|
| Sin setup compartido | Cada test crea sus propios fixtures manualmente |
| Sin mocks de Supabase | Tests de pipeline no pueden ejecutarse sin DB |
| Sin tests de integración | No se prueba la conexión real entre componentes |
| Sin cobertura de errores | Ningún test verifica manejo de errores |

---

## 2. Cobertura por Componente

### 2.1 Core HOIE Agent

| Archivo | LOC | ¿Tiene test? | Riesgo |
|---------|-----|--------------|--------|
| pipeline/normalizer.ts | ~80 | ✅ | Bajo |
| pipeline/golden-validator.ts | ~60 | ❌ | Medio |
| pipeline/location-enricher.ts | ~50 | ❌ | Medio |
| scraper/base-scraper.ts | ~100 | ❌ | Alto |
| scraper/scraper-registry.ts | ~30 | ❌ | Medio |
| scraper/encuentra24-scraper.ts | ~150 | ❌ | Alto |
| scorer/opportunity-scorer.ts | ~120 | ✅ | Bajo |
| scorer/seller-motivation.ts | ~40 | ❌ | Medio |
| scorer/market-analysis.ts | ~60 | ❌ | Medio |
| scorer/valuation-signals..ts | ~40 | ❌ | Medio |
| decision/investment-decision-engine.ts | ~80 | ❌ | Alto |
| engine/comparable-engine.ts | ~70 | ✅ | Bajo |
| engine/valuation-engine.ts | ~50 | ✅ | Bajo |
| engine/opportunity-engine.ts | ~60 | ❌ | Medio |
| Types (schemas, constants) | ~150 | ❌ | Bajo |
| CLI entry (cli.ts) | ~40 | ❌ | Alto |

**Cobertura total HOIE Agent:** ~25% de las líneas

### 2.2 Pipeline (scripts/)

| Archivo | LOC | ¿Tiene test? | Riesgo |
|---------|-----|--------------|--------|
| pipeline.mjs | 757 | ❌ | 🔴 Alto |
| config.mjs | ~50 | ❌ | Bajo |
| health-check.mjs | ~100 | ❌ | Medio |
| logger.mjs | ~40 | ❌ | Bajo |
| db-migrate.mjs | ~80 | ❌ | Medio |
| write-to-supabase.mjs | ~60 | ❌ | Medio |
| apply-migrations.mjs | ~30 | ❌ | Bajo |

**Cobertura total scripts/:** 0%

### 2.3 Dashboard

| Archivo | LOC | ¿Tiene test? | Riesgo |
|---------|-----|--------------|--------|
| main.js | 269 | ❌ | Medio |
| package.json / vite.config | ~30 | ❌ | Bajo |

### 2.4 Benchmark

| Archivo | LOC | ¿Tiene test? | Riesgo |
|---------|-----|--------------|--------|
| benchmark/engine/scorer.js | ~100 | ❌ | Medio |
| benchmark/engine/decision-engine.js | ~80 | ❌ | Medio |
| benchmark/engine/comparable-engine.js | ~50 | ❌ | Medio |
| benchmark/normalizer/normalizer.js | ~70 | ❌ | Medio |
| benchmark/golden-validator.js | ~50 | ❌ | Medio |
| benchmark/scraper/scraper.js | ~100 | ❌ | Alto |

---

## 3. Análisis de Riesgo

### Componentes Críticos sin Tests

| Componente | Riesgo | Razón |
|-----------|--------|-------|
| **pipeline.mjs** | 🔴 Alto | 757 líneas, lógica core, sin tests, rompe SRP |
| **encuentra24-scraper.ts** | 🔴 Alto | Scraping de sitio real, cambios en HTML rompen todo |
| **investment-decision-engine.ts** | 🟡 Medio | Lógica de negocio crítica, sin tests |
| **cli.ts** | 🟡 Medio | Entry point de hoie-agent, sin test |
| **dashboard/main.js** | 🟡 Medio | UI crítica, sin tests de renderizado |

---

## 4. Plan para Alcanzar 90%+ de Cobertura

### Fase 1 (Inmediato, 1-2 días) — Añadir 5 tests clave

| # | Test | Archivo | Esfuerzo |
|---|------|---------|----------|
| 1 | Pipeline submit: upsert + version + event | pipeline.mjs | 2h |
| 2 | Scraper parseo de HTML (sin red) | encuentra24-scraper.ts | 2h |
| 3 | Decision engine: BUY_NOW vs WATCH | investment-decision-engine.ts | 1h |
| 4 | Golden validator: assets válidos vs inválidos | golden-validator.ts | 1h |
| 5 | Location enricher: 4 fuentes de datos | location-enricher.ts | 1h |

**Cobertura después de Fase 1:** ~40%

### Fase 2 (Corto plazo, 3-5 días) — Integración y mocks

| # | Test | Esfuerzo |
|---|------|----------|
| 6 | Pipeline completo con Supabase mockeado | 4h |
| 7 | Dashboard queries (simular Supabase response) | 2h |
| 8 | Rate limiting en scraper | 1h |
| 9 | Config.mjs: parseo de .env, merge de defaults | 1h |

**Cobertura después de Fase 2:** ~65%

### Fase 3 (Mediano plazo) — Robustez

| # | Test | Esfuerzo |
|---|------|----------|
| 10 | Edge cases: precios nulos, títulos corruptos, campos faltantes | 3h |
| 11 | Performance: batch de 1000 assets | 2h |
| 12 | E2E: scraper → normalizer → scorer → decision → writer | 4h |
| 13 | RLS policies: verificar que anon no puede escribir | 1h |

**Cobertura después de Fase 3:** ~90%+

---

## 5. Infraestructura de Testing

### 5.1 Configuración Actual
```json
{
  "scripts": {
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test:coverage"
  }
}
```

**Problemas:**
- `vitest.config.ts` no existe en el root
- No hay configuración de coverage
- No hay `setupFiles` para tests

### 5.2 Recomendaciones

| Acción | Detalle |
|--------|---------|
| Instalar `@vitest/coverage-v8` | Para reportes de cobertura |
| Configurar `vitest.workspace.ts` | Para proyecto monorepo |
| Añadir `test:coverage` con threshold mínimo | Ej: `lines: 90, functions: 90` |
| Crear helpers de test en packages/types | Fixtures reutilizables |
| CI: ejecutar tests en pre-commit hook | Prevenir regresiones |

---

## 6. Recomendaciones Priorizadas

| # | Acción | Cobertura | Esfuerzo |
|---|--------|-----------|----------|
| P0 | Añadir test de pipeline.mjs (upsert + versionado) | Pasa de 0% → 15% en scripts/ | Medio |
| P0 | Añadir test de investment-decision-engine | Cierra componente crítico | Bajo |
| P1 | Añadir test de encuentra24-scraper (parseo sin red) | Pasa de 0% → 50% en scraper/ | Medio |
| P1 | Configurar coverage reporting | Infraestructura | Bajo |
| P2 | Fixtures reutilizables en packages/types | Reduce boilerplate | Medio |
| P2 | Mock de Supabase para tests de pipeline | Habilita tests aislados | Medio |
| P3 | CI: umbral mínimo de cobertura | Calidad continua | Bajo |
