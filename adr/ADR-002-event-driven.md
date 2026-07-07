# ADR-002: ¿Por qué Event-Driven?

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

El Data Intelligence Layer ejecuta hasta 10 engines sobre cada activo. Si se ejecutan en secuencia síncrona (A → B → C → D...), el pipeline es frágil: un fallo en el engine 3 bloquea los engines 4-10. Además, algunos engines pueden ejecutarse en paralelo mientras que otros comparten recursos.

## Problema

¿Cómo orquestar la ejecución de 10+ engines de análisis manteniendo desacoplamiento, tolerancia a fallos, paralelismo y trazabilidad?

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **Event-Driven (Pub/Sub)** | Desacoplamiento total, paralelismo natural, tolerancia a fallos individual, escalabilidad horizontal (workers por evento), trazabilidad (correlationId) | Complejidad adicional (event bus, entrega garantizada), debugging distribuido, latencia adicional en casos simples |
| **Pipeline síncrono secuencial** | Simple de implementar, fácil debugging, latencia predecible | Acoplamiento rígido, un fallo bloquea todo, sin paralelismo, difícil escalar |
| **Orquestación centralizada (Saga pattern)** | Control total del flujo, rollback coordinado, visibilidad centralizada | Punto único de fallo, complejidad del orquestador, acoplamiento a la lógica de orquestación |
| **Workflow Engine (Temporal/Airflow)** | Maduro, manejo de fallos sofisticado, UI de monitoreo | Overhead de infraestructura (Temporal Server, Airflow workers), sobreingeniería para el volumen actual (< 100K activos) |

## Decisión

**La plataforma Hermes usará arquitectura Event-Driven.**

El event bus se implementa en 3 capas:
1. **En memoria** (Pub/Sub síncrono) — para eventos en el mismo proceso (asset.registered → market.intel)
2. **Redis Pub/Sub** — para eventos entre workers
3. **BullMQ** (Redis-backed) — para eventos asíncronos con garantía de entrega

## Consecuencias

### Positivas
- Cada engine es independiente: deploy, test, escalar por separado
- Fallo en Location Engine no bloquea Valuation Engine (ambos escuchan asset.registered)
- Workers pueden escalar horizontalmente suscribiéndose a eventos específicos
- Trazabilidad E2E via correlationId en cada evento
- Onboarding de nuevos engines: solo publicar/escuchar eventos

### Negativas
- Eventual consistency: el dashboard puede ver datos parcialmente calculados
- Complejidad de debugging: necesidad de correlationId + log centralizado
- Overhead de memoria para event bus en proceso

### Mitigaciones
- Eventual consistency mitigada con: (a) polling del dashboard cada 5s, (b) flag `data_intelligence_status` por asset
- Logging estructurado con correlationId permite reconstruir el recorrido de cualquier evento
- En proceso (proceso único) para MVP; Redis/BullMQ cuando se necesiten múltiples workers

## Referencias

- [ARCHITECTURE_GATE_REVIEW.md §3 — Event Driven Architecture](../ARCHITECTURE_GATE_REVIEW.md)
- [DATA_INTELLIGENCE_ARCHITECTURE.md §4 — Event System](../DATA_INTELLIGENCE_ARCHITECTURE.md)
