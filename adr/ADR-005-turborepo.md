# ADR-005: ¿Por qué Turborepo?

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

Hermes tiene múltiples paquetes y aplicaciones: tipos compartidos (`@hermes/types`), el agente HOIE (`@hermes/hoie-agent`), y pronto el Data Intelligence Layer (`@hermes/data-intelligence`). El build, lint, test y deploy de todos estos paquetes debe ser eficiente y reproducible.

## Problema

Seleccionar la herramienta de monorepo que maximice velocidad de build, permita compartir tipos/config, y sea mantenible sin añadir complejidad operativa.

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **Turborepo** | Build caching inteligente (FULL TURBO), parallel execution, remote caching, integración npm/pnpm/yarn workspaces, mínima configuración (turbo.json), paralelización automática de tareas | Dependencia externa (Vercel), remote caching requiere Vercel Remote Cache (o self-hosted) |
| **Nx** | Más features que Turborepo (generación de código, dependency graph visual, plugin system), soporte para múltiples lenguajes | Overhead de configuración, curva de aprendizaje más alta, sobreingeniería para el tamaño actual de Hermes |
| **Lerna** | Maduro (2015+), integración npm workspaces, publish management | Sin build caching, sin paralelización nativa, mantenimiento reducido desde que Nx absorbió Lerna |
| **npm/pnpm/yarn workspaces solos** | Sin dependencia adicional, simple | Sin build caching, sin task orchestration, build secuencial (lento a medida que crece el monorepo) |
| **Rush.js** | Build caching, parallel, soporte TypeScript, manejo de dependencias sofisticado | Configuración compleja, menos popular, comunidad pequeña |

## Decisión

**Turborepo es la herramienta de monorepo de Hermes.**

## Consecuencias

### Positivas
- Build caching: `npm run build` completo en ~17ms (FULL TURBO) cuando no hay cambios
- Ejecución paralela de lint, test, typecheck en todos los paquetes
- Configuración declarativa en `turbo.json` (única fuente de verdad)
- Integración directa con `npm workspaces` (ya en uso)

### Negativas
- Dependencia de Vercel para remote caching (equipos grandes)
- Si el monorepo crece a 20+ paquetes, podría considerar Nx

### Mitigaciones
- Remote caching no es necesario para Hermes (1-2 developers, single machine)
- Si el equipo crece (>3 developers), evaluar Nx o self-hosted remote cache

## Referencias

- [turbo.json](../turbo.json)
- [package.json](../package.json)
