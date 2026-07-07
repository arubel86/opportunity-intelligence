# Hermes Project Conventions

**Versión:** 1.0.0
**Fecha:** 2026-07-02
**Estado:** Aprobado (Architecture Gate Review)

---

## 1. Naming Conventions

### Código
| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos TypeScript | `kebab-case.ts` | `market-intelligence.ts` |
| Clases | `PascalCase` | `MarketIntelligenceEngine` |
| Interfaces | `PascalCase` (sin prefijo I) | `AssetScore` |
| Tipos | `PascalCase` | `CalculationMode` |
| Funciones | `camelCase` | `calculateZoneMetrics()` |
| Variables | `camelCase` | `activeAssetCount` |
| Constantes | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Enums | `PascalCase` | `EngineStatus` |
| Enum values | `UPPER_SNAKE_CASE` | `RUNNING`, `FAILED` |

### Carpetas
```
apps/
  ├── hoie-agent/       # Hermes Opportunity Intelligence Engine Agent
  ├── data-intelligence/ # Data Intelligence Layer (futuro)
packages/
  ├── types/            # Tipos y schemas compartidos
  ├── config/           # Configuración compartida
migrations/             # SQL migrations (001, 002...)
scripts/                # Scripts de utilidad
adr/                    # Architecture Decision Records
```

### Eventos
```
{sujeto}.{accion}       # asset.registered, listing.discovered
{engine}.{estado}       # market.updated, valuation.updated
```

### Tablas en DB
```
snake_case, plural      # zone_metrics, asset_versions, calculation_log
Columnas: snake_case    # created_at, price_amount, quality_score
```

### APIs
```
/api/v1/data-intelligence/{recurso}
/api/v1/dashboard/{recurso}
/api/v1/system/{recurso}
```

---

## 2. TypeScript Standards

### Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Imports
```typescript
// Prefer named exports
export function calculateScore() {}
import { calculateScore } from './scorer';

// Path aliases (workspace packages)
import { AssetSchema } from '@hermes/types';
```

### Error Handling
```typescript
// Custom error classes
class EngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly assetId?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

// Result pattern for recoverable errors
type Result<T, E = EngineError> = { ok: true; value: T } | { ok: false; error: E };
```

---

## 3. Logging Standards

### Formato
```
[module] message { context }
```

### Niveles
| Nivel | Uso |
|-------|-----|
| `error` | Fallos que afectan al usuario o datos |
| `warn` | Degradación, errores recuperables |
| `info` | Cambios de estado, inicio/fin de procesos |
| `debug` | Información detallada para debugging |
| `trace` | Cada paso de un cálculo (solo desarrollo) |

### Campos obligatorios (JSON)
```typescript
{
  timestamp: string;      // ISO 8601
  level: string;          // error | warn | info | debug | trace
  module: string;         // Nombre del módulo (market-intel, etc.)
  message: string;        // Mensaje legible
  correlationId?: string; // Para tracing E2E
  durationMs?: number;    // Tiempo de operación
  assetId?: string;       // Si aplica
  error?: {               // Si es error
    name: string;
    message: string;
    stack?: string;
  };
}
```

---

## 4. Commit Conventions

Conventional Commits.

```
<type>(<scope>): <description>

[optional body]
```

### Types
| Type | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `refactor` | Refactorización (sin cambio funcional) |
| `perf` | Optimización de rendimiento |
| `test` | Tests |
| `chore` | Mantenimiento, config, dependencias |
| `ci` | CI/CD |
| `style` | Formato, lint (sin cambio lógico) |

### Scopes
| Scope | Área |
|-------|------|
| `scraper` | Encuentra24, BN, CA scrapers |
| `pipeline` | Pipeline E2E |
| `scorer` | Opportunity Engine |
| `decision` | Decision Engine |
| `dashboard` | Dashboard |
| `types` | @hermes/types |
| `di` | Data Intelligence Layer |
| `config` | Configuración |
| `docs` | Documentación |

### Ejemplos
```
feat(di): implement Market Intelligence Engine

- Add zone_metrics calculation
- Add temperature, growth, liquidity metrics
- Wire up zone hierarchy service

Closes #42
```

```
fix(scraper): handle missing price in Encuentra24 listings

- Add price fallback to 0 + quality_score penalty
- Fix schema validation error

Closes #58
```

---

## 5. Branch Strategy

### Naming
```
{type}/{description}
```

| Type | Uso | Origen | Destino |
|------|-----|--------|---------|
| `feat/` | Nueva funcionalidad | `develop` | `develop` |
| `fix/` | Bug fix | `develop` | `develop` |
| `hotfix/` | Bug crítico en producción | `main` | `main` + `develop` |
| `refactor/` | Refactorización | `develop` | `develop` |
| `docs/` | Documentación | `develop` | `develop` |

### Ejemplos
```
feat/market-intelligence-engine
fix/scraper-timeout-encuentra24
hotfix/dashboard-api-crash
docs/adr-redis-strategy
```

---

## 6. Database Conventions

### Naming
```sql
-- Tablas: snake_case, plural
CREATE TABLE zone_metrics (...);

-- Columnas: snake_case, singular
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
price_amount NUMERIC(12,2);

-- Primary keys: id (UUID o BIGSERIAL)
id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Foreign keys: {tabla}_id
asset_id UUID REFERENCES assets(id);
zone_id UUID REFERENCES zone_hierarchy(id);

-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
updated_at TIMESTAMPTZ;

-- Soft delete (si aplica)
deleted_at TIMESTAMPTZ;
```

### Migrations
```sql
-- migraciones numeradas: 001_initial_schema.sql
-- Siempre incluir up + down (en comentario)
-- Incluir índices DENTRO de la migración de la tabla
```

---

## 7. API Conventions

### Response envelope
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    perPage: number;
    total: number;
    version: string;
  };
}
```

### Status codes
| Código | Uso |
|--------|-----|
| 200 | OK |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Error |

---

## 8. Error Codes

```
{COMPONENT}_{ERROR}
```

| Código | Significado |
|--------|-------------|
| `ENGINE_TIMEOUT` | Engine exceeded max execution time |
| `ENGINE_NO_DATA` | Engine has insufficient data to calculate |
| `ENGINE_VERSION_MISMATCH` | Engine version doesn't match expected |
| `DB_CONNECTION_FAILED` | Database connection lost |
| `CACHE_MISS` | Cache miss (not an error if expected) |
| `VALIDATION_FAILED` | Zod schema validation failed |
| `SCRAPER_TIMEOUT` | Scraper exceeded timeout |
| `SCRAPER_RATE_LIMITED` | Scraper hit rate limiting |
| `API_RATE_LIMITED` | API rate limit exceeded |
| `NOT_FOUND` | Resource not found |

---

## 9. Testing Conventions

### Naming de tests
```
describe('ModuleName'), describe('#method')
it('should do something when condition')
```

### Coverage targets
| Category | Target |
|----------|--------|
| Unit tests (engines) | ≥ 90% |
| Unit tests (utils) | ≥ 80% |
| Integration tests | ≥ 70% |
| Pipeline E2E | 3 escenarios clave |

---

## 10. Documentation Standards

```
README.md — Por paquete (propósito, instalación, uso)
JSDoc — En funciones públicas exportadas
ADR — Decisiones arquitectónicas (adr/ADR-NNN-name.md)
CHANGELOG.md — Registro de cambios por release
```

---

*Fin del documento de convenciones. Vinculante para todo el equipo de desarrollo.*
