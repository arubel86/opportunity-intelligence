# ADR-007: ¿Por qué Redis (o por qué aún no)?

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

El Data Intelligence Layer requiere caché para reducir cálculos redundantes, colas para procesamiento asíncrono y Pub/Sub para eventos entre workers. Sin embargo, en fase MVP el volumen (< 100 activos/día) no justifica infraestructura compleja.

## Problema

¿Cuándo introducir Redis en la arquitectura? ¿Qué funcionalidades justifican su inclusión?

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **Cache en memoria (Map/WeakMap)** | Sin dependencias, simple, ultra rápido (< 1μs lookup) | Volátil (se pierde al reiniciar proceso), sin persistencia, sin sharing entre workers, memoria limitada al heap de Node.js |
| **Redis (diferido)** | Cache compartido entre workers, persistencia opcional, Pub/Sub nativo, BullMQ, TTL nativo, LRU eviction, ~90% cache hit rate en producción | Dependencia externa, necesidad de administrar Redis, ~15ms de latencia de red por operación |
| **SQLite como cache** | Persistente, sin servidor, simple | Sin TTL nativo, sin Pub/Sub, sin LRU, sin colas, overhead de SQL para cache lookups |
| **Redis desde el MVP** | Arquitectura definitiva desde el día 1, sin refactor posterior | Overhead operativo innecesario para MVP, Redis Cloud free (30 MB) muy limitado, el MVP no necesita cache compartida |

## Decisión

**Redis se introduce en Fase 2 — NO en el MVP (Sprint 1-3).**

En MVP:
- Cache en memoria (LRU Map con TTL manual)
- BullMQ opcional (usar procesamiento síncrono en su defecto)
- Pub/Sub en proceso (event bus interno)

Redis se integra cuando:
1. El pipeline procese > 500 activos/día
2. Se necesiten múltiples workers (escasez de CPU/memoria)
3. Cache hit rate en memoria < 70% (frecuentes reinicios del proceso)
4. Se requiera persistencia de cache entre deploys

## Consecuencias

### Positivas (del aplazamiento)
- MVP sin dependencia operativa de Redis
- Sin costo adicional en fase MVP
- Sin complejidad de configuración Redis
- La cache en memoria LRU es suficiente para < 500 activos/día

### Negativas
- Refactor futuro para migrar de cache en memoria a Redis
- Sin persistencia de cache entre reinicios del proceso
- Sin compartir cache entre workers (no aplica en MVP con 1 worker)

### Mitigaciones
- Abstracción `CacheProvider` desde el diseño inicial: la cache en memoria y Redis comparten la misma interfaz
- Migración: cambiar `new InMemoryCache()` por `new RedisCache()` sin modificar consumidores
- Documentación de migración: [ARCHITECTURE_GATE_REVIEW.md §5 — Cache Strategy](../ARCHITECTURE_GATE_REVIEW.md)

## Referencias

- [ARCHITECTURE_GATE_REVIEW.md §5 — Cache Strategy](../ARCHITECTURE_GATE_REVIEW.md)
- [DATA_INTELLIGENCE_ARCHITECTURE.md §6 — Performance Architecture](../DATA_INTELLIGENCE_ARCHITECTURE.md)
