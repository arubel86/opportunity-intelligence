# ADR-006: ¿Por qué Zod?

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

Los datos que ingresan a Hermes vienen de fuentes externas no confiables (scraping de sitios web). Cada listing puede tener campos faltantes, tipos incorrectos, rangos inválidos o formatos inconsistentes. El pipeline entero (scraper → normalizer → validator → deduplicator → engines) depende de datos con forma predecible.

## Problema

Seleccionar la biblioteca de validación y parsing que garantice que todos los datos en el pipeline tengan la forma esperada, con errores claros cuando no sea así, y que se integre naturalmente con TypeScript.

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **Zod** | Tipos inferidos automáticos, composición de schemas, mensajes de error personalizados, pipeline de transformación, runtime validation, ecosistema activo, 0 dependencias | Curva de aprendizaje inicial, schemas verbosos para estructuras complejas |
| **Joi** | Maduro (2012+), mensajes de error en español, sintaxis fluida | No infiere tipos TypeScript (requiere `@types/joi` duplicado), 0.5MB+ en node_modules, menos activo que Zod |
| **Yup** | Similar a Joi pero más moderno, buena integración React | Inferencia de tipos limitada, rendimiento inferior a Zod en validaciones complejas |
| **io-ts** | Basado en FP, tipos perfectos para TypeScript | Curva de aprendizaje alta (programación funcional), comunidad pequeña, sintaxis menos legible |
| **Manual (type guards + if/else)** | Sin dependencias, control total | Código repetitivo, propenso a errores, sin mensajes de error estandarizados |

## Decisión

**Zod es la biblioteca de validación de Hermes.**

## Consecuencias

### Positivas
- Tipos TypeScript inferidos automáticamente de los schemas: `type Asset = z.infer<typeof AssetSchema>`
- Validación en runtime: los datos malformados se detectan antes de llegar a los engines
- Transformación Pipelines: `z.string().transform(Number)` para campos numéricos
- Composición: schemas anidados, uniones, opcionales con defaults
- Mensajes de error localizables (futuro: español)

### Negativas
- Overhead de definición de schemas (duplicación parcial con interfaces)
- Validación en runtime añade ~1-10ms por asset (insignificante comparado con scraping)

### Mitigaciones
- Los schemas son la fuente de verdad para tipos (no duplicar con interfaces)
- Validación batch: validar en lotes de 10 para amortizar overhead

## Referencias

- [schemas.ts](../packages/types/src/schemas.ts)
- [ADR-002: ¿Por qué Event-Driven?](./ADR-002-event-driven.md)
