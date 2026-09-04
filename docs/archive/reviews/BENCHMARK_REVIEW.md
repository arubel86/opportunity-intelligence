# BENCHMARK REVIEW
## Hermes Platform — Phase 2.4 Technical Hardening

**Fecha:** 2026-07-03

---

## Clasificación Final

| Categoría | Archivos | Acción |
|-----------|----------|--------|
| **A** — Integrar al código principal | 5 archivos | Mover lógica a tests |
| **B** — Eliminar | 10 archivos | Código muerto/obsoleto |
| **C** — Mantener como validación | ~8 archivos + data/ | Herramientas de análisis |

---

## A — Integrar al Código Principal

Estos archivos contienen lógica que YA existe en el código principal (hoie-agent) pero en versión JavaScript. La acción correcta es **mover su lógica a la suite de tests unitarios**, no mantenerlos como código separado.

| Archivo | Código principal equivalente | Acción |
|---------|----------------------------|--------|
| `benchmark/engine/scorer.js` | `apps/hoie-agent/src/scorer/opportunity-scorer.ts` | Extraer fixtures de test → mover a `__tests__/fixtures/scorer.ts` |
| `benchmark/engine/decision-engine.js` | `apps/hoie-agent/src/decision/investment-decision-engine.ts` | Extraer casos de prueba → mover a `__tests__/fixtures/decision.ts` |
| `benchmark/engine/comparable-engine.js` | `apps/hoie-agent/src/engine/comparable-engine.ts` | Extraer conjuntos de datos → mover a `__tests__/fixtures/comparables.ts` |
| `benchmark/normalizer/normalizer.js` | `apps/hoie-agent/src/pipeline/normalizer.ts` | Extraer casos de normalización → mover a `__tests__/fixtures/normalizer.ts` |
| `benchmark/golden-validator.js` | `apps/hoie-agent/src/pipeline/golden-validator.ts` | Extraer reglas de validación → mover a `__tests__/fixtures/validation.ts` |

**Procedimiento sugerido:**
1. Crear `apps/hoie-agent/src/scorer/__tests__/fixtures/` con los casos de prueba extraídos
2. Eliminar los archivos JS originales de benchmark/
3. Verificar que los tests unitarios existentes + nuevos cubren los mismos casos

---

## B — Eliminar

### B.1 Benchmarks de scraping obsoletos

| Archivo | Razón | 
|---------|-------|
| `benchmark/scrape-real.cjs` | Reemplazado por pipeline.mjs |
| `benchmark/scrape-real-10.cjs` | Reemplazado por pipeline.mjs |
| `benchmark/real-pipeline-runner.cjs` | Reemplazado por pipeline.mjs |
| `benchmark/real-pipeline-10.cjs` | Reemplazado por pipeline.mjs |
| `benchmark/real-scraper.js` | Código en hoie-agent/src/scraper/ |
| `benchmark/scraper/scraper.js` | Duplica base-scraper.ts |

### B.2 Scripts de prueba únicos

| Archivo | Razón |
|---------|-------|
| `benchmark/test-e24.cjs` | Prueba única, reemplazado por versiones posteriores |
| `benchmark/test-e24-2.cjs` | Prueba única, ya no necesaria |
| `benchmark/test-e24-3.cjs` | Prueba única, ya no necesaria |
| `benchmark/acceptance.js` | Sin integración con test runner (vitest). No se ejecuta nunca |

### B.3 Recomendación

```bash
# Eliminar archivos candidatos B
rm benchmark/scrape-real.cjs
rm benchmark/scrape-real-10.cjs
rm benchmark/real-pipeline-runner.cjs
rm benchmark/real-pipeline-10.cjs
rm benchmark/real-scraper.js
rm benchmark/scraper/scraper.js
rm benchmark/test-e24.cjs
rm benchmark/test-e24-2.cjs
rm benchmark/test-e24-3.cjs
rm benchmark/acceptance.js

# Eliminar carpeta vacía de scraper
rmdir benchmark/scraper 2>/dev/null || true
```

---

## C — Mantener como Herramientas de Validación

### C.1 Herramientas de análisis exploratorio

| Archivo | Propósito |
|---------|-----------|
| `benchmark/explore-e24.mjs` | Exploración de datos de Encuentra24 (análisis ad-hoc) |
| `benchmark/e24-scraper.mjs` | Scraper independiente para hacer benchmarks aislados |
| `benchmark/analyze-results.mjs` | Análisis de resultados de benchmark |
| `benchmark/analyze-locations.mjs` | Análisis de ubicaciones geográficas |
| `benchmark/analyze-districts.mjs` | Análisis de distritos |
| `benchmark/analyze-price-patterns.mjs` | Análisis de patrones de precios |

### C.2 Test runner

| Archivo | Propósito |
|---------|-----------|
| `benchmark/runner.js` | Ejecuta el benchmark completo. Mantener como script de validación independiente del pipeline |

### C.3 Datos de referencia

| Archivo/Carpeta | Propósito |
|-----------------|-----------|
| `benchmark/data/panama-locations.json` | Datos de ubicaciones para enriquecimiento |
| `benchmark/data/panama-patterns.json` | Patrones de validación |
| `benchmark/data/` | Datos de prueba históricos |
| `benchmark/reports/` | Reportes históricos de benchmark |

---

## Resumen de Acciones

| Categoría | Archivos | Acción | Prioridad |
|-----------|----------|--------|-----------|
| A | 5 | Mover lógica a tests | P0 |
| B | 10 | Eliminar | P1 |
| C | ~8 | Mantener | P3 |

**Impacto estimado:** De ~25 archivos benchmark/ a ~8 archivos (reducción del 68%)
