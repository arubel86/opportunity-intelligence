# DATABASE REVIEW
## Hermes Platform — Phase 2.4 Technical Hardening

**Fecha:** 2026-07-03

---

## Resumen

| Tabla | Filas | Tiene PK | Tiene FK | Tiene Índices | Tiene RLS |
|-------|-------|----------|----------|---------------|-----------|
| `sources` | 6 | ✅ UUID | ❌ | 3 | ✅ |
| `assets` | ~8 | ✅ UUID | ✅ sources | 6 | ✅ |
| `comparisons` | 0 | ✅ UUID | ✅ assets (x2) | 1 | ✅ |
| `opportunity_scores` | ~24 | ✅ UUID | ✅ assets | 3 | ✅ |
| `investment_decisions` | ~24 | ✅ UUID | ✅ assets, scores | 3 | ✅ |
| `pipeline_runs` | ~6 | ✅ UUID | ❌ | 0 | ✅ |
| `dashboard_metrics` | ~3 | ✅ UUID | ❌ | 0 | ✅ |
| `asset_versions` | ~4 | ✅ UUID | ✅ assets, pipeline_runs | 2 | ✅ |
| `asset_events` | ~8 | ✅ UUID | ✅ assets, pipeline_runs | 3 | ✅ |

---

## 1. Esquema General ✅ Fortalezas

- **UUIDs como PK** — Correcto para escalabilidad y evitar colisiones en inserción distribuida
- **FKs con acciones definidas** — `ON DELETE CASCADE` en relaciones principales, `ON DELETE SET NULL` en referencias opcionales
- **Checks constraints** — Vertical, status, grade, recommended_action, etc. tienen CHECK constraints apropiados
- **RLS habilitado** en todas las tablas (aunque con política "Allow all" — pendiente de hardening)
- **Timestamptz** — Uso consistente de TIMESTAMP WITH TIME ZONE
- **Índices GIN** para JSONB (location, components)
- **`uuid-ossp` y `pgcrypto`** extensiones habilitadas

---

## 2. Problemas Detectados

### 🔴 2.1 Índices Faltantes

| Tabla | Columna | Problema |
|-------|---------|----------|
| `pipeline_runs` | `started_at` | Sin índice, usado en queries de dashboard y health check |
| `pipeline_runs` | `status` | Sin índice, se filtra por status (running/completed/failed) |
| `dashboard_metrics` | `metric_key` | Tiene UNIQUE pero ningún índice adicional; usado en upserts frecuentes |
| `opportunity_scores` | `(asset_id, calculated_at DESC)` | La view `v_asset_pipeline` hace subquery `ORDER BY calculated_at DESC LIMIT 1` por asset_id — sin índice compuesto, hace seq scan |
| `investment_decisions` | `(asset_id, created_at DESC)` | Mismo problema que arriba |

### 🟡 2.2 Partial Unique Index Reemplazado Incorrectamente

Migración 002 reemplazó:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_source_listing ON assets(source_id, source_listing_id) WHERE source_listing_id IS NOT NULL;
```
con:
```sql
ALTER TABLE assets ADD CONSTRAINT assets_source_listing_unique UNIQUE (source_id, source_listing_id);
```

**Problema:** PostgreSQL UNIQUE constraint permite múltiples NULLs en `(source_id, source_listing_id)`, pero el índice parcial original también permitía NULLs (no indexaba filas con NULL). El cambio es funcionalmente equivalente para el upsert, pero **el constraint UNIQUE no puede usarse como target de `ON CONFLICT` con el mismo comportamiento** que el índice parcial en algunas versiones de Supabase.

Además, **no se puede hacer `ON CONFLICT` en un constraint que permite NULLs** si los valores insertados son NULL. Esto no es problema ahora (source_listing_id siempre tiene valor), pero es una regresión potencial.

### 🟡 2.3 Columns sin Índice en Tablas Grandes

- `assets.seller_type` — Se filtra en el scorer (influencia en seller motivation)
- `assets.price_currency` — Siempre USD, pero podría indexarse si aparecen otras monedas
- `asset_events.event_type` — Ya tiene índice ✅
- `asset_events.created_at` — Sin índice, podría necesitarse para consultas de auditoría por fecha

### 🟢 2.4 Mejoras Sugeridas

| Sugerencia | Justificación |
|-----------|---------------|
| Índice compuesto `(asset_id, calculated_at DESC)` en opportunity_scores | Optimiza la view `v_asset_pipeline` |
| Índice compuesto `(asset_id, created_at DESC)` en investment_decisions | Optimiza la view `v_asset_pipeline` |
| Índice en `pipeline_runs(started_at DESC)` | Dashboard queries de últimos runs |
| Índice en `asset_events(created_at DESC)` | Consultas de auditoría temporal |
| Trigger `update_updated_at_column()` en asset_versions | Actualmente no tiene trigger de updated_at (pero tampoco tiene columna updated_at) |

---

## 3. Constraints y Validaciones

### 3.1 Missing Foreign Keys

| Tabla | Columna | FK Objetivo | Estado |
|-------|---------|-------------|--------|
| `pipeline_runs` | — | Sin FKs | ✅ OK (es tabla de log, no necesita FKs) |
| `dashboard_metrics` | — | Sin FKs | ✅ OK (tabla de cache) |
| `opportunity_scores` | `pipeline_run_id` | `pipeline_runs(run_id)` | ✅ Agregado en migración 002 |
| `investment_decisions` | `pipeline_run_id` | `pipeline_runs(run_id)` | ✅ Agregado en migración 002 |

### 3.2 Check Constraints Adecuados

- `vertical IN ('real_estate', 'vehicles')` ✅
- `status IN ('active', 'sold', 'removed', ...)` ✅
- `final_score >= 0 AND final_score <= 100` ✅
- `grade IN ('A+', 'A', ...)` ✅
- `recommended_action IN ('BUY_NOW', 'WATCH_HIGH_PRIORITY', ...)` ✅

---

## 4. Views y Funciones

### 4.1 Views

**`v_asset_pipeline`** — Vista principal que une assets + sources + scores + decisions.
- ✅ Útil para queries del dashboard
- ⚠️ **Problema de performance:** Usa subqueries correlacionadas (`SELECT score_id FROM opportunity_scores WHERE asset_id = a.asset_id ORDER BY calculated_at DESC LIMIT 1`). Con 1M+ assets, esto hará un seq scan por fila.
- **Solución:** Crear índices compuestos `(asset_id, calculated_at DESC)` y `(asset_id, created_at DESC)`.

**`v_dashboard_summary`** — Vista agregada sobre `v_asset_pipeline`.
- ⚠️ Depende de `v_asset_pipeline` que tiene subqueries lentas.

### 4.2 Funciones

- **`update_updated_at_column()`** — Trigger function estándar ✅
- **`calculate_estimated_value(p_asset_id)`** — Usa AVG de comparables ✅
- **`get_district_summary(p_district)`** — Función de análisis por distrito ✅

---

## 5. Versionado y Auditoría

### 5.1 asset_versions
- ✅ Almacena snapshot completo del asset antes del cambio
- ✅ version_number secuencial por asset_id
- ✅ changed_fields como TEXT[]
- ✅ change_reason documenta por qué cambió
- ✅ pipeline_run_id para trazabilidad

### 5.2 asset_events
- ✅ 7 tipos de eventos (CREATED, UPDATED, UNCHANGED, REJECTED, DEACTIVATED, REACTIVATED, REMOVED)
- ✅ Metadata JSONB para contexto adicional
- ✅ pipeline_run_id para trazabilidad

### 5.3 Mejora sugerida
- **Trigger automático de versionado:** Actualmente el pipeline.js inserta versiones manualmente. Podría hacerse con un trigger `BEFORE UPDATE OF content_hash ON assets` que inserte automáticamente en `asset_versions`.

---

## 6. RLS (Row Level Security)

### Estado Actual
- RLS habilitado en todas las tablas (9 tablas)
- Política única: `"Allow all" FOR ALL USING (true) WITH CHECK (true)`

### ⚠️ Riesgo
- **Todas las políticas son "Allow all"** — Cualquiera con la Anon Key puede leer/escribir todo.
- El dashboard usa **Anon Key** → cualquier persona con la URL del dashboard puede hacer queries a la API de Supabase.
- El pipeline usa **Service Role Key** → bypassea RLS completamente.

### Recomendación
- Migrar a políticas específicas:
  - `SELECT` — Permitir a anon key solo tablas públicas
  - `INSERT/UPDATE/DELETE` — Solo service role key
  - Tablas de auditoría (asset_versions, asset_events) — Solo lectura para anon

---

## 7. Migraciones

### 001_initial_schema.sql ✅
- Tablas base bien diseñadas
- Extensiones, índices, RLS, views, triggers

### 002_asset_versioning.sql ✅
- Versionado y auditoría correctamente implementados
- Columnas nuevas con `IF NOT EXISTS` para idempotencia

### 002_seed_data.sql ✅
- 6 fuentes precargadas
- Métricas dashboard default

### Problema: `002_seed_data.sql` está nombrado como migración pero es seed data
- Convención inconsistente: `002_seed_data.sql` es el tercer archivo pero no sigue el patrón numérico `003_`

---

## 8. Recomendaciones Priorizadas

| # | Acción | Impacto | Esfuerzo |
|---|--------|---------|----------|
| P0 | Crear índices compuestos `(asset_id, calculated_at DESC)` y `(asset_id, created_at DESC)` | Alto | Bajo |
| P0 | Migrar RLS de "Allow all" a políticas específicas por rol | Alto | Medio |
| P1 | Agregar índice en `pipeline_runs(started_at)` | Medio | Bajo |
| P1 | Crear trigger automático de versionado en assets | Medio | Medio |
| P2 | Renombrar `002_seed_data.sql` a `003_seed_data.sql` | Bajo | Bajo |
| P2 | Agregar índices en `asset_events(created_at)` | Bajo | Bajo |
| P3 | Migrar a índices parciales con WHERE en lugar de constraints UNIQUE para mejor performance en upserts | Bajo | Bajo |
