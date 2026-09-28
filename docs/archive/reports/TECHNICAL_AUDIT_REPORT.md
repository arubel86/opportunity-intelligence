# TECHNICAL AUDIT REPORT
## Hermes Platform — Phase 2.4 Technical Hardening

**Fecha:** 2026-07-03
**Auditor:** Hermes AI Agent

---

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| Paquetes en monorepo | 3 implementados (+2 vacíos) |
| Tests unitarios | 4 (scorer, normalizer, comparable, valuation) |
| Cobertura estimada | <15% del core |
| Archivos benchmark/ | ~25 archivos |
| ADRs documentados | 8 |

---

## 1. Arquitectura General

### 1.1 Estructura del Monorepo

```
hermes/
├── apps/
│   ├── api/               → 1 archivo (dashboard-metrics.ts) — ESQUELETO
│   ├── dashboard/         → 269 líneas (main.js) — FUNCIONAL
│   ├── hil-agent/         → VACÍO (sin package.json, sin código)
│   └── hoie-agent/        → CORE: 12 archivos TypeScript
├── packages/
│   ├── types/             → 3 archivos + schemas Zod — FUNCIONAL
│   └── utils/             → VACÍO (sin package.json, sin código)
├── scripts/               → 11 scripts funcionales (.mjs/.ts)
├── benchmark/             → ~25 archivos (validación + duplicación)
├── migrations/            → 3 archivos SQL
└── adr/                   → 8 ADRs documentados
```

### 1.2 Hallazgos

**🔴 CRÍTICO — Directorios vacíos con deuda estructural**

1. **`apps/hil-agent/`** — Directorio completamente vacío. Sin package.json, sin src. Placeholder nunca implementado.
2. **`packages/utils/`** — Directorio vacío sin package.json.
3. **`apps/api/`** — 1 solo archivo (`dashboard-metrics.ts`). Sin package.json, sin endpoints HTTP.

**🟡 MEDIO — Duplicación de código**

4. **Benchmark duplica lógica del pipeline principal:**
   - `benchmark/engine/scorer.js` → duplica `apps/hoie-agent/src/scorer/opportunity-scorer.ts`
   - `benchmark/engine/decision-engine.js` → duplica `apps/hoie-agent/src/decision/investment-decision-engine.ts`
   - `benchmark/engine/comparable-engine.js` → duplica `apps/hoie-agent/src/engine/comparable-engine.ts`
   - `benchmark/normalizer/normalizer.js` → duplica `apps/hoie-agent/src/pipeline/normalizer.ts`
   - `benchmark/golden-validator.js` → duplica `apps/hoie-agent/src/pipeline/golden-validator.ts`

**🟢 BAJO — Mejorable**

5. `scripts/config.mjs` — Auto-load de `.env` redundante con la carga manual en otros scripts
6. `scripts/write-to-supabase.mjs` — Funcionalidad absorbida por pipeline.mjs
7. **Convenciones inconsistentes:** `hoie-agent` usa TypeScript, `scripts/` y `benchmark/` usan JavaScript plano. El core `pipeline.mjs` está en JS sin tipado.

---

## 2. Dependencias

Todas las dependencias npm están justificadas y en uso. No se detectaron dependencias no utilizadas.

---

## 3. Archivos Obsoletos / Código Muerto

### Candidatos a eliminación (B):
- `benchmark/scrape-real.cjs` — Obsoleto, reemplazado por pipeline.mjs
- `benchmark/scrape-real-10.cjs` — Obsoleto
- `benchmark/real-pipeline-10.cjs` — Obsoleto
- `benchmark/real-pipeline-runner.cjs` — Obsoleto
- `benchmark/real-scraper.js` — Obsoleto
- `benchmark/test-e24.cjs`, `test-e24-2.cjs`, `test-e24-3.cjs` — Pruebas únicas
- `benchmark/acceptance.js` — Sin integración con test runner

### Candidatos a integrar (A):
- `benchmark/engine/scorer.js` → Tests de opportunity-scorer
- `benchmark/engine/decision-engine.js` → Tests de decision engine
- `benchmark/engine/comparable-engine.js` → Tests de comparable engine
- `benchmark/normalizer/normalizer.js` → Tests de normalizer
- `benchmark/golden-validator.js` → Tests de golden validator

### Mantener como validación (C):
- `benchmark/analyze-e24*.mjs` — Análisis exploratorio
- `benchmark/explore-e24.mjs` — Exploración de datos
- `benchmark/e24-scraper.mjs` — Scraper de referencia
- `benchmark/data/` — Datos de prueba
- `benchmark/reports/` — Reportes históricos

---

## 4. Code Smells

| Issue | Archivo | Severidad |
|-------|---------|-----------|
| Función 300+ líneas | `scripts/pipeline.mjs` | 🔴 |
| Parsing de precios duplicado | pipeline.mjs + normalizer.ts | 🟡 |
| content_hash generado sin función compartida | pipeline.mjs (packages/utils está vacío) | 🟡 |
| pipeline.mjs viola SRP (scraping, normalización, scoring, escritura, reportes) | scripts/pipeline.mjs | 🟡 |
| health-check.mjs combina chequeo + reporte | scripts/health-check.mjs | 🟢 |
| Mezcla .mjs/.cjs en benchmark/ | benchmark/* | 🟢 |

---

## 5. Recomendaciones Priorizadas

| Prioridad | Acción | Impacto | Esfuerzo |
|-----------|--------|---------|----------|
| P0 | Eliminar directorios vacíos (hil-agent, utils) | Medio | Bajo |
| P0 | Mover benchmark/engine/* a tests unitarios | Alto | Medio |
| P1 | Dividir pipeline.mjs en módulos | Alto | Alto |
| P1 | Eliminar benchmark/scrape-*.cjs, real-pipeline*.cjs | Bajo | Bajo |
| P2 | Unificar lectura de .env en config.mjs | Medio | Bajo |
| P3 | Migrar scripts/ a TypeScript | Medio | Alto |
| P3 | Añadir barrel exports en hoie-agent | Bajo | Bajo |
| P3 | Eliminar apps/api/src/metrics obsoleto | Bajo | Bajo |
