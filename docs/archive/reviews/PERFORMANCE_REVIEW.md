# PERFORMANCE REVIEW
## Hermes Platform — Phase 2.4 Technical Hardening

**Fecha:** 2026-07-03

---

## Resumen

| Componente | Estado | Riesgo |
|-----------|--------|--------|
| Pipeline E2E | 🟡 Medio | Single-thread, sin batch |
| Supabase Queries | 🟡 Medio | Subqueries correlacionadas sin índices |
| Dashboard | 🟢 Bajo | Consultas simples |
| Scraping | 🟡 Medio | Sin rate limiting real |
| Scoring Engine | 🟢 Bajo | Cálculo O(n) por asset |

---

## 1. Pipeline Performance

### 1.1 Ejecución Actual

El pipeline (`scripts/pipeline.mjs`) ejecuta:
1. **Scrape** — Visita N URLs secuencialmente (single-thread)
2. **Normalize** — Procesa 1 asset a la vez
3. **Score** — Llama a hoie-agent para calcular score (subprocess)
4. **Decision** — Llama a hoie-agent para decisión (subprocess)
5. **Write** — Upsert individual a Supabase por asset

**Métrica observada:** Con `--limit=5`, completó en ~2 segundos.

### 1.2 Cuellos de Botella a Escala

**🔴 1. Escrituras individuales a Supabase**
- Cada asset inserta/actualiza: `assets`, `asset_versions`, `asset_events` — 3 operaciones por asset
- Con 100 assets: ~300 operaciones
- Con 1000 assets: ~3000 operaciones
- **Recomendación:** Batch insert (`supabase.from('assets').upsert(batch)`) para reducir round-trips

**🔴 2. Subprocess call a hoie-agent por asset**
- Cada asset ejecuta `node apps/hoie-agent/src/cli.ts score` como subprocess
- Overhead de Node.js startup: ~150ms por llamada
- Con 1000 assets: ~150 segundos solo en startup
- **Recomendación:** Importar módulos directamente como funciones en lugar de subprocess

**🟡 3. Sin paralelismo**
- Scraping secuencial: si cada página tarda 2s, 100 páginas = 200s
- **Recomendación:** Pool de workers (worker_threads) para paralelizar scraping

### 1.3 Recomendaciones Pipeline

| # | Acción | Ganancia Estimada | Esfuerzo |
|---|--------|------------------|----------|
| P0 | Importar hoie-agent como módulo (no subprocess) | 10x | Medio |
| P1 | Batch upsert a Supabase (50 por lote) | 5x | Bajo |
| P1 | Paralelizar scraping con worker_threads | 4x | Alto |
| P2 | Cachear resultados de supabase entre ejecuciones | 2x | Medio |

---

## 2. Base de Datos Performance

### 2.1 Queries Lentas Identificadas

**View `v_asset_pipeline`:**
```sql
LEFT JOIN opportunity_scores os2 ON os2.score_id = (
  SELECT score_id FROM opportunity_scores
  WHERE asset_id = a.asset_id
  ORDER BY calculated_at DESC LIMIT 1
)
```

**⚠️ Sin índice compuesto `(asset_id, calculated_at DESC)`**, PostgreSQL hará secuencial scan.

**Dashboard query:**
```js
supabase.from('opportunity_scores')
  .select('*, assets(*)')
  .order('calculated_at', { ascending: false })
  .limit(100)
```
- Filtra por `calculated_at DESC LIMIT 100` — sin índice, hace seq scan hasta encontrar 100 filas
- Con 10K+ scores, empezará a degradarse

### 2.2 Índices Faltantes (Performance)

| Tabla | Índice Necesario | Impacto |
|-------|-----------------|---------|
| `opportunity_scores` | `(asset_id, calculated_at DESC)` | Alto |
| `investment_decisions` | `(asset_id, created_at DESC)` | Alto |
| `pipeline_runs` | `(started_at DESC)` | Medio |
| `asset_events` | `(created_at DESC)` | Medio |
| `assets` | `(seller_type)` | Medio |

### 2.3 Consultas N+1

El pipeline actual hace 3 queries por asset (assets + versions + events). Con 1000 assets:
- 3000 queries individuales vs 3 batch queries

**Recomendación:**
```js
// En lugar de:
for (const asset of assets) {
  await supabase.from('assets').upsert(asset)
  await supabase.from('asset_versions').insert(version)
  await supabase.from('asset_events').insert(event)
}

// Usar batch:
const assetBatch = _.chunk(assets, 50)
for (const batch of assetBatch) {
  await supabase.from('assets').upsert(batch)
}
```

---

## 3. Dashboard Performance

### 3.1 Estado Actual
- Vanilla JS, sin framework pesado ✅
- Sin paginación en queries — carga hasta 100 registros
- Sin lazy loading
- Sin cache de datos

### 3.2 Recomendaciones

| Mejora | Impacto | Esfuerzo |
|--------|---------|----------|
| Paginación (offset/limit) en queries del dashboard | Alto | Bajo |
| Cache localStorage de datos (5 min TTL) | Medio | Bajo |
| Debounce en cambios de filtro | Medio | Bajo |
| Virtual scrolling si > 500 filas | Alto | Alto |

---

## 4. Scoring Engine

### 4.1 Análisis
- O(n) por asset: cada asset se evalúa individualmente
- Sin memoización de resultados de comparables
- ~5 reglas de scoring, cada una hace cálculo simple

### 4.2 Recomendación
- Pre-calcular comparables frecuentes (misma fuente, mismo distrito)
- Cachear resultados de cálculos costosos (seller motivation, market analysis)

---

## 5. Supabase Performance

### 5.1 Conexiones
- Cliente JS con pool de conexiones (manejo automático)
- Sin límite explícito de concurrencia

### 5.2 Costos Supabase
- Plan Free: 500MB DB, 2GB bandwidth, 50K requests/day
- Con 1000 assets/día (3 escrituras c/u = 3000 requests) + dashboard queries ~100/día
- **Consumo estimado actual:** ~3,100 requests/día (6% del límite)
- **A 100K assets/día:** 300K+ requests → excede plan Free

---

## 6. Recomendaciones Priorizadas (Performance)

| # | Acción | Impacto | Esfuerzo | Categoría |
|---|--------|---------|----------|-----------|
| **P0** | Importar hoie-agent como módulo en pipeline (eliminar subprocess) | 🔴 Alto | Medio | Pipeline |
| **P0** | Crear índices compuestos `(asset_id, calculated_at DESC)` | 🔴 Alto | Bajo | DB |
| **P1** | Batch upsert a Supabase (50 por lote) | 🟡 Medio | Bajo | Pipeline |
| **P1** | Paginación en queries del dashboard | 🟡 Medio | Bajo | Dashboard |
| **P2** | Paralelizar scraping con worker_threads | 🟡 Medio | Alto | Pipeline |
| **P2** | Cache localStorage en dashboard | 🟢 Bajo | Bajo | Dashboard |
| **P3** | Planificar migración de plan Free a Pro cuando > 50K req/día | 🟡 Medio | Bajo | Infra |
