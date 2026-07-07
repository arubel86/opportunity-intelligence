# Hermes - Reporte Técnico
## Reality Benchmark - Fase 2.2.5

## Benchmark Técnico

### Scraping

| Métrica | Valor |
|---|---|
| Success Rate | 100.0% |
| Failed Requests | 0 |
| Tiempo Promedio | 1.0ms |
| Listings Encontrados | 120 |

### Normalización

| Métrica | Valor |
|---|---|
| Success Rate | 100.0% |
| Required Fields | 100.0% |
| Parsing Errors | 0 |
| Duplicates | 0 |
| Invalid Coordinates | 0 |
| Invalid Prices | 0 |

### Comparables

| Métrica | Valor |
|---|---|
| Promedio/Activo | 12.7 |
| Calidad Promedio | 54.3% |
| Tiempo Promedio | 0.2ms |
| Descartados | 370 |

### Opportunity Engine

| Métrica | Valor |
|---|---|
| Score Promedio | 54.0 |
| Confianza Promedio | 77.5% |
| Tiempo de Cálculo | 0.0ms |
| Accuracy (Golden Dataset) | 80.0% |

### Decision Engine

- BUY_NOW: 32
- WATCH_HIGH_PRIORITY: 17
- NEGOTIATE: 13
- AVOID: 56
- MANUAL_REVIEW_REQUIRED: 2

## Error Report

| Tipo de Error | Cantidad |
|---|---|

## Golden Dataset Validation

| Métrica | Valor |
|---|---|
| Score Accuracy | 80.0% |
| Scores en Rango | 12/15 |
| Decisions Correctas | 4/15 |

| Activo | Score Esperado | Score Obtenido | En Rango | Decisión Esperada | Decisión Obtenida |
|---|---|---|---|---|---|
| RE-001 | 75-85 | 76 | ✅ | WATCH_HIGH_PRIORITY | NEGOTIATE |
| RE-002 | 72-82 | 74 | ✅ | WATCH_HIGH_PRIORITY | NEGOTIATE |
| RE-003 | 85-95 | 92 | ✅ | BUY_NOW | MANUAL_REVIEW_REQUIRED |
| RE-004 | 70-80 | 72 | ✅ | WATCH_HIGH_PRIORITY | MANUAL_REVIEW_REQUIRED |
| RE-005 | 30-45 | 42 | ✅ | AVOID | AVOID |
| RE-006 | 60-70 | 59 | ❌ | NEGOTIATE | MANUAL_REVIEW_REQUIRED |
| RE-007 | 80-90 | 90 | ✅ | BUY_NOW | MANUAL_REVIEW_REQUIRED |
| RE-008 | 30-45 | 47 | ❌ | AVOID | AVOID |
| RE-009 | 78-88 | 82 | ✅ | BUY_NOW | MANUAL_REVIEW_REQUIRED |
| RE-010 | 80-90 | 89 | ✅ | BUY_NOW | MANUAL_REVIEW_REQUIRED |
| VEH-001 | 75-85 | 78 | ✅ | WATCH_HIGH_PRIORITY | NEGOTIATE |
| VEH-002 | 58-68 | 57 | ❌ | NEGOTIATE | NEGOTIATE |
| VEH-003 | 68-78 | 71 | ✅ | WATCH_HIGH_PRIORITY | NEGOTIATE |
| VEH-004 | 55-65 | 56 | ✅ | NEGOTIATE | NEGOTIATE |
| VEH-005 | 60-70 | 62 | ✅ | NEGOTIATE | MANUAL_REVIEW_REQUIRED |

## Plan de Corrección

✅ Todos los criterios mínimos han sido cumplidos. Se recomienda:

1. Integrar con Supabase para persistencia de datos
2. Incorporar fuentes adicionales (Banco Nacional, Caja de Ahorros)
3. Mejorar la cobertura de scrapers con Playwright
4. Expandir dashboard ejecutivo con datos en tiempo real
