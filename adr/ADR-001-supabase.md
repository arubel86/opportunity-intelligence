# ADR-001: ¿Por qué Supabase?

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

Hermes necesita una base de datos relacional para almacenar activos, scores, decisiones y logs. La plataforma requiere autenticación, Row Level Security, API REST automática, y capacidad de escalar desde MVP (cientos de activos) hasta producción (millones).

## Problema

Seleccionar la tecnología de base de datos y backend que balancee velocidad de desarrollo inicial con capacidad de escalar a largo plazo, minimizando costo operativo en etapa MVP.

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **Supabase** | DB administrada, API REST automática, RLS nativo, auth integrada, realtime subscriptions, tier free generoso ($0 MVP), escalado progresivo (Pro $25 → Scale $100) | Vendor lock-in parcial (PostgreSQL subyacente permite migrar), features avanzadas (particionamiento) requieren plan Scale |
| **PostgreSQL plano + Backend REST** | Control total, sin dependencia externa, migración trivial | Desarrollar auth, RLS, API REST manualmente; más tiempo de desarrollo inicial |
| **Firebase/Firestore** | Serverless, escalado automático, buena integración con ecosistema Google | NoSQL limita consultas complejas (valuaciones, comparables), vendor lock-in total, costo impredecible a escala |
| **PlanetScale (MySQL-compatible)** | Branching de DB, escalado horizontal | Sin auth, sin RLS, sin API REST; MySQL no soporta JSONB ni PostGIS; más caro que Supabase |
| **MongoDB Atlas** | Documentos flexibles, escalado horizontal | Sin relaciones nativas (crítico para joins de valuación), sin RLS, sin auth, sin API REST |

## Decisión

**Supabase es la base de datos de Hermes.**

## Consecuencias

### Positivas
- MVP inmediato con tier free ($0)
- API REST generada automáticamente para assets, scores, decisiones
- RLS nativo para seguridad multi-tenant
- Auth integrada (futuro: múltiples usuarios)
- PostgreSQL subyacente → migración posible si Supabase no escala
- PostGIS disponible para queries geoespaciales

### Negativas
- Dependencia de Supabase para auth + API REST
- Particionamiento nativo de PostgreSQL requiere plan Scale ($100/mes)
- Sin read replicas en plan Pro (solo Scale)

### Mitigaciones
- Toda la lógica de negocio está en Node.js, no en stored procedures de Supabase → migración directa a PostgreSQL plano
- Las tablas se diseñan con SQL estándar PostgreSQL desde el día 1
- Si Supabase se vuelve prohibitivo (>15% del presupuesto mensual): migrar a RDS + backend REST propio

## Referencias

- [DATA_INTELLIGENCE_ARCHITECTURE.md](../DATA_INTELLIGENCE_ARCHITECTURE.md)
- [DATA_INTELLIGENCE_SCHEMA.md](../DATA_INTELLIGENCE_SCHEMA.md)
- [migrations/001_initial_schema.sql](../migrations/001_initial_schema.sql)
