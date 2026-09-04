# SECURITY REVIEW
## Hermes Platform — Phase 2.4 Technical Hardening

**Fecha:** 2026-07-03

---

## Resumen

| Categoría | Estado | Riesgo |
|-----------|--------|--------|
| Secrets Management | 🟡 Medio | Service Role Key en .env compartido |
| RLS Policies | 🔴 Alto | "Allow all" en todas las tablas |
| SQL Injection | 🟢 Bajo | Queries parametrizadas vía Supabase JS |
| XSS | 🟡 Medio | Dashboard renderiza datos sin sanitizar |
| Rate Limiting | 🔴 Alto | No implementado |
| Input Validation | 🟡 Medio | Zod schemas existen pero no se usan en pipeline |
| Output Validation | 🟢 Bajo | JSONB almacena datos sin validación estricta |
| Sensitive Logs | 🟢 Bajo | Logger no expone secrets |
| PII | 🟡 Medio | Datos de propiedades sin anonimizar |

---

## 1. Secrets Management

### Hallazgos

**🔴 1.1 Service Role Key en .env**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...VCJ9...
```
La Service Role Key otorga acceso completo (bypass RLS) a toda la base de datos. Actualmente está en `.env` (raíz del proyecto) y es usada por `pipeline.mjs`, `db-migrate.mjs` y `config.mjs`.

**Riesgo:** Si alguien obtiene acceso al servidor, tiene control total de la base de datos.

**Recomendación:**
- Rotar la Service Role Key inmediatamente
- Usar Service Role Key solo en procesos que realmente lo necesiten (migraciones, pipeline)
- El dashboard YA usa Anon Key correctamente ✅

**🟡 1.2 .env.example expone estructura de secrets**
El archivo `.env.example` muestra nombres de variables con placeholders realistas (`eyJhbG...VCJ9...`). Esto es aceptable pero podría reducirse a `your-anon-key-here`.

**🟢 1.3 Dashboard .env usa Anon Key ✅**
`apps/dashboard/.env` solo contiene `VITE_SUPABASE_ANON_KEY` — correcto. La Service Role Key nunca se expone al frontend.

---

## 2. RLS (Row Level Security)

### 🔴 CRÍTICO — Políticas "Allow all"

Todas las tablas tienen:
```sql
CREATE POLICY IF NOT EXISTS "Allow all" ON <table> FOR ALL USING (true) WITH CHECK (true);
```

**Esto significa:**
- Cualquiera con la Anon Key puede LEER todos los datos (assets, scores, decisiones)
- Cualquiera con la Anon Key puede MODIFICAR todos los datos
- La única protección es que la Anon Key no es pública (pero está en el dashboard build)

**Dashboard expone la Anon Key:**
- `apps/dashboard/.env` → se inyecta en el build de Vite
- El JS compilado contiene la Anon Key en texto plano
- Cualquiera que abra DevTools puede extraerla

**Riesgo:** Si alguien extrae la Anon Key del dashboard, tiene acceso completo a la base de datos.

### Recomendaciones RLS

Crear políticas específicas:

```sql
-- Anon key: solo lectura de tablas públicas
CREATE POLICY "anon_read_assets" ON assets FOR SELECT USING (true);
CREATE POLICY "anon_read_scores" ON opportunity_scores FOR SELECT USING (true);
CREATE POLICY "anon_read_decisions" ON investment_decisions FOR SELECT USING (true);

-- Service role: escritura completa
CREATE POLICY "service_all_assets" ON assets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_scores" ON opportunity_scores FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_all_decisions" ON investment_decisions FOR ALL USING (auth.role() = 'service_role');

-- Denegar escritura a anon key explícitamente
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
```

---

## 3. SQL Injection

**🟢 BAJO — Queries parametrizadas**

Todas las queries a Supabase usan el cliente JS oficial (`@supabase/supabase-js`), que parametriza queries automáticamente:
```js
supabase.from('assets')
  .select('*')
  .eq('source_id', sourceUUID)  // parametrizado
  .eq('source_listing_id', assetRow.source_listing_id)  // parametrizado
```

**Excepción:** `scripts/db-migrate.mjs` usa `pg` (node-postgres) con template literals para SQL. Se debe verificar que todas las variables sean escapadas.

---

## 4. XSS (Cross-Site Scripting)

### 🟡 MEDIO — Dashboard renderiza datos sin sanitizar

**Hallazgo:** En `apps/dashboard/src/main.js`:
```js
<td class="text-link" style="font-size:13px">${a.title || '—'}</td>
```

Si un asset tiene un título como `<script>alert('xss')</script>`, se ejecutaría en el dashboard.

**Recomendación:** Usar `textContent` o sanitizar con una función:
```js
function escapeHTML(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
```

**Gravedad:** Baja porque los datos vienen del pipeline (propio), no de usuarios externos. Pero si en el futuro se integran fuentes externas no confiables, el riesgo aumenta.

---

## 5. Rate Limiting

### 🔴 ALTO — No implementado

- **No hay rate limiting** en ningún nivel
- El scraper tiene config `requests_per_minute` en la tabla `sources`, pero **no se aplica en el código**
- Si el pipeline se ejecuta muchas veces seguidas, puede sobrecargar Encuentra24 o ser bloqueado
- No hay throttling en las escrituras a Supabase

### Recomendación
```js
// Implementar en pipeline.mjs o config.mjs
const RATE_LIMIT = {
  encuentre24: { rpm: 30, delay: 2000 }, // 2s entre requests
  supabase: { rpm: 60, delay: 1000 },
}
```

---

## 6. Input Validation

### 🟡 MEDIO — Zod schemas infrautilizados

**Hallazgo positivo:** ✅ `packages/types/src/schemas.ts` define schemas Zod completos para Source, Asset, OpportunityScore, InvestmentDecision.

**Hallazgo negativo:** ❌ **Ningún schema se usa en el pipeline.** `pipeline.mjs` construye objetos manualmente sin validación:
```js
const assetRow = {
  source_id: sourceUUID,
  source_listing_id: asset.asset_id || null,
  title: normalized.title?.slice(0, 500) || null,
  // ...
}
```

**Recomendación:** Validar cada asset contra `AssetSchema` antes de insertar en Supabase:
```js
import { AssetSchema } from '@hermes/types'
const parsed = AssetSchema.safeParse(assetRow)
if (!parsed.success) {
  log.warn(`Asset validation failed: ${parsed.error.message}`)
  continue
}
```

---

## 7. Logs y Datos Sensibles

### 🟢 BAJO — Logger seguro

- `logger.mjs` no imprime secrets ni credenciales
- `health-check.mjs` verifica existencia de secrets pero no los imprime ✅
- Pipeline logs no exponen tokens ni claves ✅

### Mejora sugerida
- Añadir filtro automático de secrets en logger: si algún log contiene `eyJh` (inicio de JWT), reemplazar con `[REDACTED]`

---

## 8. PII (Personal Identifiable Information)

### 🟡 MEDIO — Datos de propiedades

Los datos de propiedades (direcciones, coordenadas, precios) se almacenan como JSONB en `assets.location`. Si bien no son PII de personas individuales, sí son datos sensibles a nivel comercial.

**Recomendaciones:**
- No almacenar coordenadas exactas si no son necesarias (solo distrito/barrio)
- Documentar política de retención de datos
- Considerar cifrado en reposo para datos sensibles (Supabase lo soporta)

---

## 9. Seguridad en Dependencias

### Auditoría de dependencias

| Dependencia | Versión | Vuln. Conocidas |
|-------------|---------|-----------------|
| `@supabase/supabase-js` | ^2.110.0 | 🟢 Sin vulnerabilidades reportadas |
| `pg` | ^8.22.0 | 🟢 Sin vulnerabilidades reportadas |
| `playwright` | ^1.44.0 | 🟢 Sin vulnerabilidades reportadas |
| `zod` | ^3.23.0 | 🟢 Sin vulnerabilidades reportadas |
| `vite` | ^8.1.1 | 🟢 Sin vulnerabilidades reportadas |
| `turbo` | ^2.0.0 | 🟢 Sin vulnerabilidades reportadas |

Ejecutar `npm audit` periódicamente.

---

## 10. Recomendaciones Priorizadas

| # | Acción | Impacto | Esfuerzo |
|---|--------|---------|----------|
| **P0** | Migrar RLS de "Allow all" a políticas específicas (SELECT para anon, ALL para service_role) | 🔴 Alto | Medio |
| **P0** | Rotar Service Role Key y limitar su uso | 🔴 Alto | Bajo |
| **P1** | Implementar rate limiting en scraper y Supabase escrituras | 🟡 Medio | Medio |
| **P1** | Usar Zod schemas para validar datos antes de insertar en DB | 🟡 Medio | Medio |
| **P2** | Sanitizar output HTML en dashboard (escapeHTML) | 🟡 Medio | Bajo |
| **P2** | Añadir filtro de secrets en logger | 🟢 Bajo | Bajo |
| **P3** | Ejecutar `npm audit` y mantener dependencias actualizadas | 🟢 Bajo | Bajo |
