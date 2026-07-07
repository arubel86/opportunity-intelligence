PROPERTY AUDIT REPORT
==============================

Asset ID:         96d693c9-9a93-4f91-ab60-946c54ac3c46
URL:              https://www.encuentra24.com/panama-en/real-estate-for-sale-beachfront-homes-and-lots/precious-beach-apartment-in-casamar-house-tideway/32039053
Precio original:  $330,000
Tipo:             apartment (beachfront)
Ubicación:        Casamar (neighborhood extraído incorrectamente como "Compare this ad\nAdd to favorites")

==============================

SCRAPER
-------
Estado:    ✅ Funcional

El scraper (benchmark/e24-scraper.mjs) extrajo correctamente:
  • title      ✅  "GC REALTY Las Uvas PRECIOUS BEACH APARTMENT..."
  • price      ✅  $330,000 (parseInt de "$330,000")
  • currency   ✅  USD
  • url        ✅  https://www.encuentra24.com/.../32039053
  • seller     ✅  "GC REALTY" → tipo 'agent'
  • bedrooms, bathrooms, areaM2  ⚠️  No se extrajeron limpiamente (details no se mapearon)
  • neighborhood ⚠️  Contiene texto UI: "Compare this ad\nAdd to favorites" en vez del nombre del barrio

Resultado: Datos base correctos. El precio, título, URL y tipo de vendedor
se extrajeron bien. La ubicación tiene ruido porque el scraper clona
el contenido y toma TODOS los textNodes, incluyendo los de elementos
de UI que no se eliminaron correctamente.

==============================

NORMALIZER
----------
Estado:    ✅ Funcional (con limitaciones)

El normalizer (normalize-stage.mjs) mapea:
  • title              → asset.title (raw, sin limpiar)
  • price              → asset.price_amount (correcto)
  • item.url           → asset.source_listing_url (correcto)
  • item.location      → asset.location (provincia/distrito/vecindario)
  • item.seller_type   → asset.seller_type (correcto)
  • estimatedMarketValue → asset.estimatedMarketValue (SOLO existe en mock data)

Datos que entrega al pipeline:
```
{
  asset_id: "real-001",
  source_id: "encuentra24",
  vertical: "real_estate",
  status: "active",
  title: "GC REALTY Las Uvas PRECIOUS BEACH APARTMENT IN CASAMAR...",
  price_amount: 330000,
  location: { province: "", district: "", neighborhood: "Compare this ad\n..." },
  description: "PRE-SALE OF APARTMENTS IN CASAMAR\nNEW PROJECT: TIDEWAY HOUSE...",
  seller_type: "agent",
  tags: [],
  source_listing_url: "https://www.encuentra24.com/.../32039053",
  estimatedMarketValue: undefined  ← NO existe en datos reales
}
```

⚠️  Observación: El campo `estimatedMarketValue` solo lo produce
`generateMockListings()` (datos sintéticos). Para propiedades reales
es `undefined`. Esto es crítico porque el Comparable Engine lo usa
como fallback para el precio de mercado.

==============================

COMPARABLE ENGINE
-----------------
Estado:    ❌ NO EXISTE. Es datos aleatorios.

Código: pipeline/utils.mjs, función generateComparables()

```
export function generateComparables(asset) {
  const price = asset.price_amount || 200000
  const marketValue = asset.estimatedMarketValue || price  ← SIEMPRE price
  const count = 3 + Math.floor(Math.random() * 5)          ← 3-7 aleatorios
  return Array.from({ length: count }, () => ({
    price: Math.round(marketValue * (0.90 + Math.random() * 0.20)),  ← random
    distance_km: Math.round((0.3 + Math.random() * 4) * 10) / 10,   ← random
    age_days: Math.floor(Math.random() * 90) + 5,                   ← random
    quality_score: Math.round((65 + Math.random() * 30)) / 100,     ← random
  }))
}
```

Para esta propiedad:
  • marketValue = 330000 (price)  ← porque estimatedMarketValue es undefined
  • count = 5 (random)
  • Precios generados: [297717, 355132, 309369, 308812, 358574]  ← random ±10%
  • quality_scores: aleatorios entre 0.65 y 0.95

EVIDENCIA:
  - La tabla `comparisons` en Supabase está VACÍA (0 filas).
  - No existe ninguna query a la BD para buscar propiedades similares.
  - No hay filtro por ubicación, tipo, tamaño, precio.
  - asset.estimatedMarketValue NO existe en propiedades reales.
  - La función usa Math.random() — resultado NO DETERMINISTA.

Conclusión: NO hay un Comparable Engine real. Lo que hay es un
generador de números aleatorios con forma de comparable.

==============================

VALUATION ENGINE
----------------
Estado:    ❌ Funciona sobre datos erróneos

Código: pipeline/scoring-stage.mjs, dentro del loop de scoring

```
estimatedValue = comparables.reduce((s, c) => s + c.price * (c.quality_score || 0.8), 0)
  / comparables.reduce((s, c) => s + (c.quality_score || 0.8), 0)
```

Para esta propiedad:
  • estimatedValue = $325,043.08  ← media ponderada de los 5 comparables aleatorios
  • discount = ((325043 - 330000) / 325043) * 100 = -1.525%  ← casi 0%
  • Confidence = 75

La fórmula matemática es correcta. El problema es que los comparables
de entrada son RANDOM, por lo que el "estimatedValue" es un número
aleatorio cercano al precio de lista.

El precio estimado DEBERÍA calcularse con:
  • Propiedades similares REALES de la misma zona
  • Ajuste por área ($/m²)
  • Ajuste por número de habitaciones/baños
  • Factor de ubicación

Ninguno de estos factores existe actualmente.

==============================

OPPORTUNITY SCORER
------------------
Estado:    ⚠️  Fórmula con sesgo estructural

Desglose para esta propiedad:

  discount = -1.525%  (ligeramente sobrevalorado)
  
  baseScore = 37 + (-1.525) * 1.8
            = 37 - 2.745
            = 34.255
  
  bankBonus = 0  (seller_type = "agent")
  
  compBonus = Math.min(1, 5 * 0.25) = Math.min(1, 1.25) = 1
  
  finalScore = Math.round(34.255 + 0 + 1) = 35  ← D grade
  
  confidence = Math.min(100, Math.max(10, 50 + 5 * 5)) = 75

Problemas de la fórmula:

  1. Baseline = 37. Para alcanzar BUY_NOW (score ≥ 80):
     → discount = (80 - 37 - 1) / 1.8 = 23.3%
     → Una propiedad debe tener 23%+ de descuento para ser BUY_NOW
     → Esto es extremadamente raro en propiedades reales

  2. compBonus máximo = 1 punto (con 4+ comparables)
     → Prácticamente irrelevante en el score final

  3. bankBonus = 1 punto (fijo)
     → También irrelevante

  4. El rango práctico del score para propiedades reales es 30-45
     → Todas caen en grade D → todas AVOID

Comparación mock vs real:
  • Mock data genera estimatedMarketValue → discount de hasta 35%
    → Score puede llegar a 100 (A+)
  • Real data NO tiene estimatedMarketValue → discount ~0%
    → Score siempre ~35-40 (D)

==============================

DECISION ENGINE
---------------
Estado:    ✅ Funciona según lo diseñado

Reglas aplicadas (decision-stage.mjs):

  score=35, confidence=75:
    35 >= 80 ? NO
    35 >= 75 ? NO
    35 >= 65 ? NO
    35 >= 50 ? NO
    → AVOID (por defecto)

Resultado:
  • recommended_action = "AVOID"
  • investment_profile = "high_risk_opportunity"
  • thesis_text = "D rated property at $330000. Score: 35/100."

El Decision Engine NO tiene un bug. Toma la decisión correcta según
el score que recibe. El problema está aguas arriba: el score es bajo
porque la fórmula y los comparables no funcionan para datos reales.

Ninguna propiedad podría obtener BUY_NOW con el flujo actual:
  • Se necesita score ≥ 80
  • Para score ≥ 80 se necesita discount ≥ 23.3%
  • Sin estimatedMarketValue, discount siempre es ~0%

==============================

SUPABASE (Persistencia)
------------------------
Estado:    ✅ Datos almacenados correctamente

Campos en opportunity_scores para esta propiedad:
```
components: {
  estimated_value: 325043.07608695654,    ← el valor estimado SÍ está aquí
  discount_pct: -1.5250052309120303,
  comparable_count: 5,
  comp_prices: [297717, 355132, 309369, 308812, 358574]
}
final_score: 35,
grade: "D",
confidence: 75
```

Campos en investment_decisions:
```
opportunity_score: 35,
recommended_action: "AVOID",
thesis_text: "D rated ... Score: 35/100.",
risk_factors: { score_grade: "D", confidence_pct: 75, comparable_quality: 0.83 }
```

La persistencia almacena EXACTAMENTE lo que calculan los motores.
No hay pérdida ni corrupción de datos en la escritura.

==============================

DASHBOARD
---------
Estado:    ❌ Field name mismatch

El código del dashboard (main.js) busca:

```
function estimatedPrice(score) {
  const comps = score.components
  return comps?.estimated_price || null     ← ERROR: campo incorrecto
}
```

Pero Supabase almacena:

```
components: {
  estimated_value: 325043.08,   ← el nombre REAL
  discount_pct: -1.525,         ← el nombre REAL
  ...
}
```

El dashboard busca `estimated_price` que NO EXISTE en la base de datos.
El nombre real es `estimated_value`. Por eso muestra 0.

Igual para la diferencia %: el dashboard recalcula con estimated_price=0
→ siempre da 0. Sin embargo, `components.discount_pct` YA contiene
el valor calculado correctamente (-1.525%).

NO hay:
  • Valores hardcodeados ❌ No
  • Fallbacks a cero    ❌ El "0" es porque estimated_price es undefined
  • Valores por defecto ❌ No

==============================

ROOT CAUSE
==========

El problema NO es un solo bug. Son TRES problemas independientes
que SE SUMAN para producir el resultado observado:

═══════════════════════════════════════════════════════════════
CAUSA #1 [PRIMARIA] — Comparable Engine
═══════════════════════════════════════════════════════════════

  • Ubicación: pipeline/utils.mjs, función generateComparables()
  
  • ¿Qué ocurre?: No existe un Comparable Engine real. La función
    genera datos aleatorios con Math.random() en lugar de consultar
    propiedades similares en la base de datos.
  
  • Evidencia concreta:
    - asset.estimatedMarketValue NO existe para propiedades reales
    - count es aleatorio: 3 + Math.random() * 5
    - prices son aleatorios: marketValue * (0.90 + Math.random() * 0.20)
    - quality_scores son aleatorios: 0.65 + random * 0.30
    - La tabla `comparisons` en Supabase está VACÍA
    
  • Impacto: El "estimatedValue" es un número aleatorio cercano
    al precio de lista. El discount es siempre ~0%.

═══════════════════════════════════════════════════════════════
CAUSA #2 [ESTRUCTURAL] — Fórmula del Opportunity Score
═══════════════════════════════════════════════════════════════

  • Ubicación: pipeline/scoring-stage.mjs, fórmula baseScore
  
  • ¿Qué ocurre?: La fórmula 37 + discount * 1.8 tiene un baseline
    de 37/100 y depende casi exclusivamente del discount %.
    compBonus aporta máximo 1 punto. bankBonus aporta 1 punto.
    
  • Evidencia concreta:
    - Para score ≥ 80: discount ≥ 23.3% (casi imposible en mercado real)
    - Para score ≥ 50: discount ≥ 6.1%
    - Con discount ~0% (real): score = 37-39 (D grade, AVOID)
    - Los pesos de compBonus (1) y bankBonus (1) son despreciables
    
  • Impacto: TODAS las propiedades reales puntúan D → AVOID.
    La fórmula funciona solo con mock data que tiene descuentos
    artificiales de 10-35%.

═══════════════════════════════════════════════════════════════
CAUSA #3 [COSMÉTICA] — Dashboard Field Name Mismatch
═══════════════════════════════════════════════════════════════

  • Ubicación: apps/dashboard/src/main.js, función estimatedPrice()
  
  • ¿Qué ocurre?: El dashboard busca score.components.estimated_price
    pero la persistencia almacena score.components.estimated_value.
    
  • Evidencia concreta:
    - DB tiene: { components: { estimated_value: 325043.08, ... } }
    - Dashboard busca: comps?.estimated_price || null
    - Resultado: undefined → null → "0" o "—" en pantalla
    
  • Impacto: El precio estimado y la diferencia % se muestran como
    0 aunque el motor SÍ calculó valores correctos.

═══════════════════════════════════════════════════════════════

RELACIÓN ENTRE CAUSAS:

  Causa #1 (Comparables aleatorios)
    ↓
  discount ≈ 0%
    ↓
  Causa #2 (Fórmula con baseline 37)
    ↓
  score ≈ 35 (D grade)
    ↓
  AVOID en Decision Engine
    ↓
  (el dashboard muestra 0 además por la Causa #3)

Las tres causas son independientes pero su efecto es acumulativo.

Si se corrige solo la Causa #1 (Comparables reales), el discount
seguirá siendo pequeño para propiedades con precio de mercado,
y la Causa #2 mantendrá el score bajo.

Si se corrige solo la Causa #2 (fórmula), sin comparables reales
el discount seguirá siendo aleatorio.

Si se corrigen #1 y #2 pero no #3, el dashboard seguirá mostrando 0.

==============================

FIX RECOMENDADO
===============

IMPORTANTE: No he aplicado ningún cambio. Esto es solo diagnóstico.

Para solucionar COMPLETAMENTE el problema, se requieren estas tres
correcciones (en orden de prioridad):

═══════════════════════════════════════════════════════════════
FIX #1 — Implementar Comparable Engine REAL
═══════════════════════════════════════════════════════════════

  Reemplazar generateComparables() con un motor que:
  
  a) Consulte la DB por propiedades con:
     - Misma ubicación (distrito/vecindario)
     - Mismo tipo (vertical/property_type)
     - Área similar (±30%)
     - Precio similar (±50%)
     
  b) Calcule quality_score basado en:
     - Proximidad geográfica (distance_km)
     - Diferencia de área
     - Diferencia de habitaciones/baños
     - Relevancia temporal (age_days)
     
  c) Almacene los comparables en la tabla `comparisons`
     (actualmente vacía — 0 filas)

  Código a modificar:
  - pipeline/utils.mjs (generateComparables → consulta real a Supabase)
  - pipeline/scoring-stage.mjs (usar el nuevo ComparableEngine)

═══════════════════════════════════════════════════════════════
FIX #2 — Ajustar fórmula del Opportunity Score
═══════════════════════════════════════════════════════════════

  La fórmula actual 37 + discount * 1.8:
  
  Alternativa: score multi-factor con pesos reales:
  
  score = priceScore * 0.25
        + comparableScore * 0.20
        + locationScore * 0.15
        + conditionScore * 0.10
        + discountScore * 0.20     ← descontar peso del descuento
        + liquidityScore * 0.10
  
  Cada sub-score entre 0-100. El peso del descuento debe ser
  máximo 20%, no 100%.

  Código a modificar:
  - pipeline/scoring-stage.mjs

═══════════════════════════════════════════════════════════════
FIX #3 — Corregir field name en Dashboard
═══════════════════════════════════════════════════════════════

  Cambiar en apps/dashboard/src/main.js:
  
  estimated_price  →  estimated_value
  (Y usar components.discount_pct directamente en vez de recalcular)

  Este fix es el más simple y NO requiere cambios en la DB.

═══════════════════════════════════════════════════════════════

Resumen de dónde está cada problema:

  ✅ Scraper              — Funcional (datos reales correctos)
  ✅ Normalizer           — Funcional (limitaciones menores de ubicación)
  ❌ Comparable Engine    — NO existe (datos aleatorios) ← CAUSA #1
  ⚠️ Valuation Engine     — Fórmula correcta, entrada incorrecta
  ❌ Opportunity Scorer   — Fórmula con sesgo estructural ← CAUSA #2
  ✅ Decision Engine      — Correcto (refleja el score)
  ✅ Persistencia         — Correcta (datos fieles)
  ❌ Dashboard            — Field name mismatch ← CAUSA #3

CAUSAS RELACIONADAS: Sí, múltiples causas relacionadas.
Causa #1 + Causa #2 + Causa #3 = problema completo.

Espero instrucciones, CTO.
