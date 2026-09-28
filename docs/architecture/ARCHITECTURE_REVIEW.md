# ARCHITECTURE REVIEW
## Hermes Platform — Phase 2.4 Technical Hardening

**Fecha:** 2026-07-03

---

## 1. Arquitectura Actual

### 1.1 Diagrama de Alto Nivel

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Encuentra24│ ──> │  Pipeline    │ ──> │   Supabase    │
│   (Scraper)  │     │  (pipeline   │     │  (PostgreSQL) │
└─────────────┘     │   .mjs)      │     └───────┬───────┘
                    └──────┬───────┘             │
                           │                     │
                    ┌──────▼───────┐     ┌───────▼───────┐
                    │  HOIE Agent  │     │   Dashboard   │
                    │  (scorer,    │     │  (Vanilla JS) │
                    │   decision)  │     └───────────────┘
                    └──────────────┘
```

### 1.2 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Backend | Node.js + TypeScript |
| Scraping | Playwright |
| DB | Supabase (PostgreSQL) |
| Dashboard | Vanilla JS, Vite build |
| Validación | Zod schemas |

---

## 2. Evaluación por Escala

### 2.1 Escala Actual (~1,000 activos)

**Estado:** 🟢 Sobrado
- Pipeline E2E en ~2 segundos con `--limit=5`
- 3 escrituras/asset: ~0.5s por asset
- DB < 1MB de datos
- Dashboard carga en < 1s

### 2.2 Escala Media (100,000 activos)

**Estado:** 🟡 Factible con optimizaciones

**Cuellos de botella:**
1. **Pipeline secuencial:** 100K escrituras individuales = ~14 horas
   - Solución: Batch upsert + paralelismo → reduciría a ~30 min
2. **Subprocess por asset:** 100K llamadas a hoie-agent = ~4 horas de startup
   - Solución: Importar módulos directamente → < 5 min
3. **DB:** Supabase Free: 500MB DB, 50K req/día
   - Solución: Plan Pro ($25/mes) con 8GB DB, 500K req/día
4. **Dashboard:** 100K filas sin paginación → crash del navegador
   - Solución: Paginación y virtual scrolling

**Almacenamiento estimado a 100K activos:**
- assets: ~50MB
- asset_versions: ~100MB (versiones históricas)
- asset_events: ~50MB
- opportunity_scores: ~30MB
- investment_decisions: ~30MB
- **Total:** ~260MB (dentro del plan Free de 500MB)

### 2.3 Escala Grande (1,000,000 activos)

**Estado:** 🟠 Exige cambios arquitectónicos

**Problemas estructurales:**
1. **DB size:** ~2.6GB → plan Pro (8GB) necesario con upgrade
2. **Pipeline monolitico:** 757 líneas sin modularizar → difícil mantener
3. **Single scraper:** Encuentra24 con un solo worker
4. **Sin cola de procesamiento:** No hay cola de mensajes, todo en proceso
5. **Sin cache:** Cada ejecución del pipeline vuelve a calcular todo

**Cambios necesarios:**
| Componente | Solución a 1M activos |
|-----------|----------------------|
| Pipeline | Cola de jobs (RabbitMQ/Redis) + workers distribuidos |
| DB | Particionamiento por source_id + migrar a plan Pro |
| Scraping | Pool de 5-10 workers paralelos |
| Cache | Redis para resultados de scoring y comparables |
| Dashboard | Paginación server-side + load balancing |
| API | Endpoints HTTP en lugar de acceso directo a Supabase |

### 2.4 Escala Ultra (10,000,000 activos)

**Estado:** 🔴 Requiere re-arquitectura

**Cambios fundamentales:**
1. **DB:** Sharding por región/país
2. **Pipeline:** Arquitectura event-driven con Kafka
3. **Scraping:** Fleet distribuida de scrapers
4. **Search:** Elasticsearch para búsqueda de assets
5. **Cache:** Redis cluster + CDN
6. **API:** Backend con autoescalado (Kubernetes)
7. **Supabase:** Migrar a PostgreSQL nativo con read replicas

---

## 3. Validación de ADRs

| ADR | Decisión | ¿Sigue siendo válida? |
|-----|---------|----------------------|
| ADR-001: Supabase | DB + Auth | ✅ Sí |
| ADR-002: Event-driven | Eventos para cambios | ✅ Sí |
| ADR-003: Playwright | Scraping con Playwright | ✅ Sí |
| ADR-004: PostgreSQL | SQL directo cuando necesario | ✅ Sí |
| ADR-005: Turborepo | Monorepo con Turborepo | ✅ Sí (pero hil-agent vacío) |
| ADR-006: Zod | Validación con Zod | ✅ Sí (pero infrautilizado) |
| ADR-007: Redis | Cache con Redis | ⏸ No implementado aún |
| ADR-008: AI Strategy | Scoring con IA | ✅ Sí |

---

## 4. Problemas Arquitectónicos Identificados

### 🔴 Constatados

1. **Pipeline monolítico:** pipeline.mjs (757 líneas) viola SRP. Debe dividirse en: Scraper, Normalizer, Scorer, Writer, Reporter
2. **Subprocess overhead:** Llamar a hoie-agent como subprocess por asset es ineficiente
3. **Sin API layer:** El dashboard accede directo a Supabase con la Anon Key. A 100K+ activos, esto no escala

### 🟡 Potenciales

4. **Acoplamiento a Encuentra24:** El scraper está hardcodeado para una fuente. Agregar Banco Nacional/Caja de Ahorros requiere refactor
5. **Sin cola de eventos:** Los cambios fluyen síncronamente. Sin cola, no hay retry automático ni persistencia de mensajes
6. **Sin health endpoint HTTP:** El health check es un script CLI, no un endpoint que un load balancer pueda consultar

### 🟢 Menores

7. **Directorios vacíos:** hil-agent y utils son deuda arquitectónica visual
8. **Sin barrel exports:** No hay index.ts en hoie-agent/src/

---

## 5. Recomendaciones

### Para 100K activos (Próximos 3 meses)

| # | Acción | Prioridad | Esfuerzo |
|---|--------|-----------|----------|
| 1 | Dividir pipeline.mjs en módulos independientes | P0 | Alta |
| 2 | Importar hoie-agent como módulo | P0 | Media |
| 3 | Batch upsert a Supabase | P1 | Baja |
| 4 | Paginación en dashboard | P1 | Baja |
| 5 | Añadir índices faltantes a DB | P1 | Baja |
| 6 | Crear API REST básica (Express/Fastify) | P2 | Alta |

### Para 1M activos (Próximos 6 meses)

| # | Acción | Prioridad |
|---|--------|-----------|
| 7 | Migrar a plan Pro de Supabase | P1 |
| 8 | Cola de procesamiento con Redis | P1 |
| 9 | Pool de workers para scraping | P2 |

### Para 10M activos (Próximo año)

| # | Acción | Prioridad |
|---|--------|-----------|
| 10 | Re-arquitectura event-driven con Kafka | P1 |
| 11 | Sharding de base de datos | P1 |
| 12 | Fleet de scrapers distribuida | P2 |
| 13 | Migrar a Kubernetes | P2 |

---

## 6. Conclusión

La arquitectura actual es **válida para hasta 50,000 activos con optimizaciones menores**. Para escalar más allá, se requiere inversión en infraestructura.

La deuda arquitectónica principal es:
- **pipeline.mjs monolítico** → Prioridad #1
- **Subprocess overhead** → Prioridad #2
- **Sin capa API** → Prioridad #3

El stack tecnológico (Supabase, Turborepo, Zod, Playwright) es correcto y escalable. Las decisiones ADR-001 a ADR-008 siguen siendo válidas.
