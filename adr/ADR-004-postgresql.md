# ADR-004: ¿Por qué PostgreSQL?

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

El modelo de datos de Hermes requiere relaciones complejas (assets ↔ scores ↔ decisions ↔ classifications → logs), consultas geoespaciales (distancias entre activos y POIs), agregaciones por zona, y cálculos estadísticos sobre series temporales.

## Problema

Seleccionar el motor de base de datos relacional que soporte todo el ciclo de vida de Hermes: desde MVP con cientos de activos hasta producción con millones, incluyendo datos geoespaciales y analíticos.

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **PostgreSQL** | JSONB (schema-less flexible), PostGIS (geo queries), ventanas (cálculos analíticos), particionamiento nativo, MV (vistas materializadas), FULL TEXT SEARCH, madurez (35+ años), comunidad masiva, Supabase usa PostgreSQL | Mayor complejidad operativa que SQLite, requiere tuning para alto rendimiento |
| **MySQL 8** | Popular, ampliamente soportado, JSON soportado pero limitado | Sin PostGIS equivalente nativo, JSONB no existe (JSON es más lento), ventanas menos maduras, MV con limitaciones |
| **SQLite** | Liviano, sin servidor, ideal para prototipos | Sin concurrencia, sin PostGIS, sin particionamiento, sin roles/permissions, no escala |
| **DuckDB** | Excelente para OLAP, analítico, columnar | No es transaccional, no soporta alta concurrencia de escritura, ecosistema joven |

## Decisión

**PostgreSQL es la base de datos relacional de Hermes.**

## Consecuencias

### Positivas
- JSONB para metadata flexible (cada asset puede tener campos únicos según la fuente)
- PostGIS para cálculos de distancia, proximidad a POIs, agrupación geográfica
- Ventanas (`ROW_NUMBER`, `LAG`, `AVG OVER`) para cálculos de tendencias, DOM ranking, percentiles
- Particionamiento nativo (cuando se superen 10M filas en calculation_log)
- Vistas materializadas para dashboard queries pre-agregadas
- FULL TEXT SEARCH para búsqueda de propiedades por descripción
- Migración directa desde Supabase a RDS/Aurora si es necesario

### Negativas
- Tuning necesario para alto rendimiento (índices, `work_mem`, `shared_buffers`)
- Sin escalado horizontal nativo (requiere extensiones como Citus)
- Las réplicas de lectura en Supabase requieren plan Scale ($100/mes)

### Mitigaciones
- Índices diseñados desde el día 1 (45 índices en el schema)
- Vistas materializadas reducen carga de queries pesadas en dashboard
- Cache Redis para hot data reduce presión en DB
- Particionamiento implementado cuando calculation_log supere 10M filas
- Migración a RDS + read replicas planificada como contingencia (ver ADR-001)

## Referencias

- [ADR-001: ¿Por qué Supabase?](./ADR-001-supabase.md)
- [DATA_INTELLIGENCE_SCHEMA.md](../DATA_INTELLIGENCE_SCHEMA.md)
- [migrations/001_initial_schema.sql](../migrations/001_initial_schema.sql)
