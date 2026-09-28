# DATA INTELLIGENCE LAYER
## Product Requirements Document (PRD)
### Hermes Opportunity Intelligence Platform — Fase 2.4

**Versión:** 1.0.0
**Fecha:** 2026-07-02
**Autor:** CTO, Hermes Platform
**Estado:** BORRADOR PARA REVISIÓN

---

## 0. Resumen Ejecutivo

Hermes ha completado su fase de estabilización. El pipeline E2E funciona, los motores de oportunidad y decisión están validados contra el Golden Dataset, y la plataforma está preparada para producción.

Sin embargo, Hermes hoy solo responde a una pregunta:

> *"¿Esta propiedad parece buena?"*

La **Data Intelligence Layer** transforma Hermes en un analista profesional de inversiones. Ya no se trata de agregar datos, sino de **entenderlos**. Cada activo será evaluado desde 10 dimensiones analíticas: mercado, ubicación, rentabilidad, liquidez, valuación, historial, tendencias, vecindario, clasificación de inversión y línea de tiempo.

Este módulo es el corazón analítico de Hermes y su principal ventaja competitiva.

---

## 1. Visión del Producto

### 1.1 Declaración de Visión

> Hermes será el analista de inversiones inmobiliarias más confiable de Panamá. Capaz no solo de encontrar oportunidades, sino de explicar *por qué* cada propiedad es una oportunidad, *cuánto* vale realmente, *qué tan rápido* se venderá o alquilará, y *cuál* será el retorno esperado.

### 1.2 Promesa de Valor

Para el **inversor inmobiliario** que necesita decisiones informadas,
la **Data Intelligence Layer** es un sistema analítico
que **convierte datos crudos en inteligencia de inversión accionable**,
a diferencia de **agregadores tradicionales** que solo muestran listados.

### 1.3 Principios de Diseño

1. **Explicabilidad primero** — Todo resultado debe poder desglosarse en sus componentes
2. **Versionado total** — Nunca sobrescribir; siempre append
3. **ML-ready** — Cada cálculo registra inputs, outputs, pesos y versión para entrenar modelos futuros
4. **Escalabilidad horizontal** — Diseñado para 100,000+ propiedades sin degradación
5. **Desacoplamiento** — Cada engine es independiente, desplegable y testeable por separado
6. **Cache inteligente** — Resultados cacheados con invalidación granular
7. **Auditabilidad** — Trazabilidad completa de cada decisión analítica

---

## 2. Problema y Oportunidad

### 2.1 Problema Actual

| Aspecto | Situación Actual | Meta |
|---------|-----------------|------|
| Profundidad analítica | Score + Decisión | 10 dimensiones analíticas |
| Explicabilidad | "Score: 75" | "Score: 75 = 37 + 35%*1.8 + bankBonus(5) + compBonus(1)" |
| Valuación | Comparables simples | Valuación profesional con intervalos de confianza |
| Mercado | Sin contexto de zona | Perfil completo por vecindario |
| Historial | Sin versionado | Todo cambio registrado y trazable |
| Tendencias | Sin detección | Trend detection automático |
| Rentabilidad | Sin estimación | ROI, Cash Flow, Cap Rate, Yield |
| Liquidez | Sin indicador | Days on Market, Absorption Rate, Market Pressure |
| ML | Sin datos estructurados | Dataset completo para ML supervisado |

### 2.2 Oportunidad

Panamá no cuenta con una plataforma de inteligencia de inversiones inmobiliarias que integre:
- Datos de mercado en tiempo real
- Valuación profesional automática
- Análisis de rentabilidad
- Inteligencia de ubicación
- Seguimiento histórico
- Detección de tendencias

Hermes puede ocupar ese espacio vacío.

---

## 3. Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────┐
│                    DATA INTELLIGENCE LAYER                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────────────┐ │
│  │  Market Intelligence│   │  Location Intelligence       │ │
│  │  Engine              │   │  Engine                     │ │
│  ├─────────────────────┤   ├─────────────────────────────┤ │
│  │ • Zone Profiles      │   │ • POI Database              │ │
│  │ • Price Metrics      │   │ • Accessibility Scores      │ │
│  │ • Supply/Demand      │   │ • Neighborhood Scores       │ │
│  │ • Temperature        │   │ • Infrastructure Scores     │ │
│  └──────────┬──────────┘   └──────────────┬──────────────┘ │
│             │                              │                │
│  ┌──────────┴──────────┐   ┌──────────────┴──────────────┐ │
│  │  Rental Intelligence │   │  Liquidity Intelligence     │ │
│  │  Engine              │   │  Engine                     │ │
│  ├─────────────────────┤   ├─────────────────────────────┤ │
│  │ • Yield & Cap Rate   │   │ • Days on Market            │ │
│  │ • Cash Flow          │   │ • Absorption Rate           │ │
│  │ • Rental Demand      │   │ • Market Pressure           │ │
│  │ • Vacancy Risk       │   │ • Exit Difficulty           │ │
│  └──────────┬──────────┘   └──────────────┬──────────────┘ │
│             │                              │                │
│  ┌──────────┴──────────┐   ┌──────────────┴──────────────┐ │
│  │  Valuation Intel    │   │  Historical Intelligence     │ │
│  │  Engine             │   │  Engine                     │ │
│  ├─────────────────────┤   ├─────────────────────────────┤ │
│  │ • Fair Value Range   │   │ • Price Change History      │ │
│  │ • Confidence         │   │ • Score History             │ │
│  │ • Sensitivity        │   │ • Versioned Asset Data     │ │
│  │ • Explanation        │   │ • Audit Trail              │ │
│  └──────────┬──────────┘   └──────────────┬──────────────┘ │
│             │                              │                │
│  ┌──────────┴──────────┐   ┌──────────────┴──────────────┐ │
│  │  Neighborhood Intel  │   │  Market Trend Engine        │ │
│  │  Engine              │   │                             │ │
│  ├─────────────────────┤   ├─────────────────────────────┤ │
│  │ • Zone Profiles      │   │ • Market Detection          │ │
│  │ • Composite Ratings  │   │ • Over/Under Valuation      │ │
│  │ • Investment Grades  │   │ • Supply/Demand Signals     │ │
│  └──────────┬──────────┘   └──────────────┬──────────────┘ │
│             │                              │                │
│  ┌──────────┴──────────────────────────────┴──────────┐   │
│  │  Investment Intelligence Engine                      │   │
│  │                                                     │   │
│  │  • Clasifica cada activo en: Flip, Rental, Cash     │   │
│  │    Flow, Long Term Hold, Luxury, Commercial,        │   │
│  │    Distressed, Speculative, Premium                 │   │
│  └──────────┬──────────────────────────────────────────┘   │
│             │                                                │
│  ┌──────────┴──────────┐                                   │
│  │  Opportunity Timeline│                                   │
│  │                     │                                   │
│  │  • Price evolution   │                                   │
│  │  • Score evolution   │                                   │
│  │  • Decision history  │                                   │
│  └──────────┬──────────┘                                   │
└─────────────┼──────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────┐
│                    CONSUMERS                                 │
├────────────────────────────────────────────────────────────┤
│  Opportunity Engine  │  Decision Engine  │  Dashboard      │
│  API/Reportes       │  Supabase          │  Notificaciones │
└────────────────────────────────────────────────────────────┘
```

### 3.1 Flujo de Datos

```
1. INGESTA
   Scraper → Normalizer → Raw_Asset_Store
   
2. DATA_INTELLIGENCE (este layer)
   Raw_Asset → Market Intel   → zone_metrics
            → Location Intel  → location_scores  
            → Rental Intel    → rental_estimates
            → Liquidity Intel → liquidity_scores
            → Valuation Intel → valuation_estimates
            → Neighborhood    → neighborhood_profiles
            → Market Trends   → trend_signals
            → Investment Intel→ asset_classifications
            → Historical      → versioned_history
            → Timeline        → opportunity_timeline
   
3. CONSUME
   Opportunity Engine ← Data Intelligence Scores
   Decision Engine    ← Data Intelligence Scores
   Dashboard          ← API endpoints
```

---

## 4. Motores de Inteligencia — Especificación Detallada

### 4.1 Market Intelligence Engine

**Propósito:** Construir automáticamente el perfil completo de cada zona geográfica.

**Input:** Conjunto de propiedades activas e históricas agrupadas por zona.
**Output:** `zone_metrics` por provincia/distrito/corregimiento/barrio/urbanización.

**Cálculos:**

| Métrica | Fórmula | Frecuencia |
|---------|---------|------------|
| Precio Promedio | AVG(price_amount) por zona | Cada scraper run |
| Precio Mediano | MEDIAN(price_amount) por zona | Cada scraper run |
| Precio m² | price_amount / area_m2 | Por propiedad, agregado por zona |
| Precio por tipo | AVG(price_amount) WHERE type = X | Cada scraper run |
| Total propiedades | COUNT(*) activas | Cada scraper run |
| Tiempo promedio venta | AVG(days_on_market) WHERE status=sold | Diario |
| Tiempo publicación activo | AVG(days_on_market) WHERE status=active | Cada scraper run |
| Oferta (Supply) | COUNT(*) activas en zona | Cada scraper run |
| Demanda estimada | COUNT(*) contactos/views por propiedad (proxy) | Semanal |
| Liquidez | Sold / (Activas + Sold) en período | Semanal |
| Absorption Rate | Sold / Mes en zona | Mensual |
| Market Temperature | (Demand - Supply) / Supply (ratio) | Semanal |
| Inventory Trend | Δ(activas) mes/mes | Mensual |
| Crecimiento histórico | (precio_promedio_actual - precio_promedio_hace_12m) / precio_promedio_hace_12m * 100 | Mensual |
| Tendencia mensual | Δ(precio_promedio) mes/mes | Mensual |
| Tendencia anual | Δ(precio_promedio) año/año | Mensual |

**Algoritmo de Market Temperature:**
```
sea hotThreshold = 0.3    # 30% más demanda que oferta → mercado caliente
sea coldThreshold = -0.2  # 20% más oferta que demanda → mercado frío

temperature = (demandaEstimada - oferta) / max(oferta, 1)

if temperature > hotThreshold → "HOT"
if temperature > 0 → "WARM"
if temperature > coldThreshold → "COOL"
else → "COLD"
```

### 4.2 Location Intelligence Engine

**Propósito:** Enriquecer cada propiedad con su contexto de ubicación.

**Input:** Coordenadas (lat/lng) de la propiedad + base de datos de POIs.
**Output:** LocationScore compuesto por 6 sub-scores.

**Categorías de POIs:**

| Categoría | Peso | Ejemplos |
|-----------|------|----------|
| Salud | 10% | Hospitales, clínicas, farmacias |
| Educación | 15% | Escuelas, universidades, colegios |
| Comercio | 20% | Supermercados, centros comerciales, tiendas |
| Servicios | 10% | Bancos, farmacias, correos |
| Recreación | 15% | Parques, playas, gimnasios, áreas verdes |
| Transporte | 30% | Metro, corredores, aeropuerto, paradas bus |

**Algoritmo de Location Scoring:**

```
para cada categoría C:
    POIs_cercanos = count(POIs en categoría C dentro de radio R)
    score_categoria = min(POIs_cercanos / max_esperado_C, 1.0) * 100

Accessibility Score = sum(score_categoria * peso_categoria)

# Scores derivados
Convenience Score = (Comercio + Servicios + Salud) / 3
Neighborhood Score = (Educación + Recreación + Transporte) / 3
Infrastructure Score = (Transporte + Servicios + Comercio) / 3
Urban Growth Score = count(construcciones_nuevas_cerca) * factor_crecimiento
Location Confidence = nivel_confianza_segun_fuente_coordenadas
```

**Radios por categoría:**
- Salud: 2km
- Educación: 1.5km  
- Comercio: 1km
- Servicios: 1km
- Recreación: 2km
- Transporte: 0.5km (metro/bus), 10km (aeropuerto)

### 4.3 Rental Intelligence Engine

**Propósito:** Estimar métricas de rentabilidad por alquiler.

**Input:** Propiedad (price_amount, area_m2, zona, tipo, características).
**Output:** RentalMetrics (renta estimada, yield, cap rate, cash flow, etc.)

**Cálculos:**

| Métrica | Fórmula | Notas |
|---------|---------|-------|
| Renta Mensual Estimada | price_m2 * 0.004 * area_m2 * zone_factor | Basado en yield promedio de zona |
| Yield Bruto | (renta_mensual * 12) / price_amount | % anual |
| Cap Rate | NOI / price_amount | NOI = renta_anual - gastos_operativos (30%) |
| Cash Flow | renta_mensual - (hipoteca_mensual + gastos) | Si hay financiamiento |
| Vacancy Rate | promedio histórico por zona | Modelo estadístico |
| Tiempo para alquilar | promedio histórico por zona | Modelo estadístico |
| Demanda de alquiler | búsquedas/views en zona | Proxy de demanda |
| Rentabilidad Anual | (cash_flow_anual + plusvalía_estimada) / down_payment | % |
| Retorno Esperado | renta_mensual * 12 * factor_ocupacion / price_amount | % ajustado |

**Algoritmo de Estimación de Renta:**
```
zone_factor = tabla de factores por zona (de datos históricos)
base_rental_yield = 0.048  # 4.8% yield base para Panamá
zone_yield = base_rental_yield * zone_factor

# Ajustes por tipo
type_adjustments = {
    'apartment': 1.0,
    'house': 0.9,      # Casas rinden ligeramente menos en alquiler
    'penthouse': 0.85,  # PH rinden menos relativo al precio
    'commercial': 1.15, # Comercial rinde más
    'office': 1.1
}

monthly_rent_estimate = (price_amount * zone_yield * type_adjustment) / 12

# Clasificación de calidad de inversión en alquiler
if yield_bruto >= 0.07 → "EXCELENTE_INVERSION_ALQUILER"
if yield_bruto >= 0.05 → "BUENA_INVERSION_ALQUILER"
if yield_bruto >= 0.035 → "REGULAR"
else → "NO_RECOMENDABLE"
```

### 4.4 Liquidity Intelligence Engine

**Propósito:** Medir qué tan rápido se vendería una propiedad.

**Input:** Datos históricos de ventas + estado actual del mercado en zona.
**Output:** LiquidityScore + métricas de salida.

**Cálculos:**

| Métrica | Fórmula |
|---------|---------|
| Days on Market (DOM) | AVG(fecha_venta - fecha_publicación) para zona+tipo |
| Velocidad Histórica | COUNT(ventas) / DOM promedio |
| Buyer Activity Index | (contactos_por_propiedad) / promedio_mercado * 100 |
| Market Pressure | (DOM_actual - DOM_histórico) / DOM_histórico |
| Rotación | (ventas_últimos_12m / total_propiedades) * 100 |
| Exit Difficulty | Inverso de Liquidez (1 - liquidity_score) |

**Algoritmo de Liquidez:**
```
liquidity_factors = {
    'dom_score':       inverse_normalize(DOM, min=0, max=365),     # peso 30%
    'velocity_score':  normalize(velocidad_historica),              # peso 20%
    'rotation_score':  normalize(rotacion, min=0, max=30),          # peso 20%
    'pressure_score':  inverse_normalize(abs(market_pressure)),     # peso 15%
    'buyer_score':     normalize(buyer_activity, min=0, max=200)    # peso 15%
}

liquidity_score = sum(score * weight for score, weight in liquidity_factors)
# Liquidez 0-100

exit_difficulty = 100 - liquidity_score
```

### 4.5 Valuation Intelligence Engine

**Propósito:** Determinar el valor justo de una propiedad con intervalos de confianza.

**Input:** Propiedad + comparables + factores de ajuste.
**Output:** ValuationRange (conservador, mercado, optimista) + confianza.

**Metodología:**

1. **Selección de Comparables**
   - Ubicación (misma zona o zonas aledañas)
   - Tipo de propiedad (mismo tipo)
   - Tamaño (±30% área)
   - Antigüedad (últimos 3 años)
   - Estado (similar condición)
   - Mínimo 5, ideal 10-15 comparables

2. **Cálculo de Valor por Metodologías**

   | Metodología | Peso | Descripción |
   |-------------|------|-------------|
   | Precio m² | 35% | price_m2_promedio_comparables * area |
   | Hedonic Regression | 25% | Modelo estadístico con características |
   | Comparables Directos | 30% | Media ponderada de comparables similares |
   | Tendencia zonal | 10% | Ajuste según tendencia de la zona |

3. **Intervalos de Confianza**

   ```
   weighted_value = sum(valor_i * peso_i) / sum(pesos)
   
   std_dev = std_dev(comparables_adjusted_prices)
   confidence_interval = 1.96 * std_dev / sqrt(n_comparables)
   
   conservative = weighted_value - confidence_interval
   market_value = weighted_value
   optimistic = weighted_value + confidence_interval
   
   margin_of_error = confidence_interval / market_value * 100
   ```

4. **Sensibilidad**
   - Qué variables impactan más el resultado
   - Top 3 variables con mayor sensibilidad

5. **Explicación**
   - Número de comparables utilizados
   - Rango de precios de comparables
   - Ajustes aplicados
   - Distribución geográfica
   - Exclusión de outliers

### 4.6 Historical Intelligence Engine

**Propósito:** Mantener historial completo y versionado de cada activo.

**Arquitectura de Datos:**

```
asset_versions
├── asset_id (FK)
├── version_number (int)
├── valid_from (timestamp)
├── valid_to (timestamp, NULL = current)
├── created_at (timestamp)
├── snapshot (JSONB) — copia completa del activo en ese momento
├── changed_fields (TEXT[]) — qué cambió respecto a versión anterior
├── change_reason (TEXT) — scraper run / price change detected / manual
└── source_run_id (FK)
```

**Eventos registrados:**
- Creación del activo
- Cambio de precio
- Cambio de estado (active → pending → sold/rented)
- Cambio de descripción
- Corrección de datos
- Re-clasificación
- Score recalculation
- Decision change

**Nunca se sobrescribe:**
- UPDATE solo se usa para `valid_to` (cerrar versión anterior)
- Nuevos datos siempre son INSERT en `asset_versions`
- La versión actual es `asset_versions WHERE valid_to IS NULL`

### 4.7 Opportunity Timeline

**Propósito:** Línea de tiempo visual de cada activo.

**Estructura de datos:**

```
asset_timeline
├── asset_id (FK)
├── event_date (timestamp)
├── event_type (ENUM)
├── price_before (DECIMAL)
├── price_after (DECIMAL)
├── score_before (INT)
├── score_after (INT)
├── decision_before (TEXT)
├── decision_after (TEXT)
├── confidence_before (INT)
├── confidence_after (INT)
├── event_summary (TEXT) — descripción legible
└── metadata (JSONB) — datos adicionales del evento
```

**Tipos de evento (event_type):**
- `price_change`
- `score_change`
- `decision_change`
- `status_change`
- `price_reduction` (sub-tipo de price_change con dirección ↓)
- `price_increase` (sub-tipo de price_change con dirección ↑)
- `relist` (propiedad removida y re-publicada)
- `classification_change`

**Generación de Timeline:**
```
price_reductions_count = count(events WHERE type = 'price_reduction')
price_increases_count = count(events WHERE type = 'price_increase')
total_changes = price_reductions_count + price_increases_count

timeline_summary = {
    'initial_price': primer precio registrado,
    'current_price': precio actual,
    'lowest_price': mínimo histórico,
    'highest_price': máximo histórico,
    'total_price_reductions': N,
    'total_price_increases': N,
    'price_trend': 'declining' | 'stable' | 'increasing',
    'score_trend': 'improving' | 'stable' | 'declining',
    'days_on_market': diferencias fechas,
    'velocity': 'fast' | 'normal' | 'slow' (según DOM vs zona)
}
```

### 4.8 Neighborhood Intelligence

**Propósito:** Perfiles completos y automatizados por zona.

**Estructura de perfil de zona:**

```
neighborhood_profiles
├── zone_id (PK)
├── zone_type (province/district/corregimiento/neighborhood)
├── parent_zone_id (FK)
├── name
├── slug
├── market_metrics (JSONB) → precio promedio, m², mediana, oferta, demanda
├── liquidity_metrics (JSONB) → DOM, rotación, absorption rate, pressure
├── rental_metrics (JSONB) → yield promedio, cap rate, vacancy
├── growth_metrics (JSONB) → crecimiento anual, mensual, tendencia
├── investment_rating (TEXT) → rating calculado para la zona
├── classification (TEXT) → residencial, comercial, mixto, premium, desarrollo
├── risk_level (TEXT) → bajo, medio, alto
├── last_calculated (timestamp)
└── zone_metadata (JSONB) → área, densidad, tipo predominante
```

**Investment Rating Formula:**
```
rating = (
    liquidity_score * 0.25 +
    growth_score * 0.25 +
    rental_yield_score * 0.20 +
    stability_score * 0.15 +
    demand_score * 0.15
)

if rating >= 80 → "PRIME"
if rating >= 65 → "DESIRABLE"
if rating >= 50 → "STABLE"
if rating >= 35 → "SPECULATIVE"
else → "RISKY"
```

### 4.9 Market Trend Engine

**Propósito:** Detección automática de señales de mercado sin intervención manual.

**Input:** Series temporales de métricas por zona.
**Output:** Señales de mercado (trend_signals).

**Señales Detectables:**

| Señal | Detección | Confianza Mínima |
|-------|-----------|-----------------|
| Mercado Creciendo | Precio promedio ↑ 3%+ en 3 meses consecutivos | 70% |
| Mercado Cayendo | Precio promedio ↓ 2%+ en 3 meses consecutivos | 70% |
| Mercado Estable | Precio promedio Δ < 2% en 6 meses | 80% |
| Sobrevaloración | Precio m² > 115% del precio m² promedio de zona premium | 75% |
| Subvaloración | Precio m² < 85% del precio m² promedio de zona comparable | 75% |
| Sobreoferta | Inventory > 12 meses de absorción | 80% |
| Alta Demanda | Inventory < 3 meses de absorción | 80% |
| Mercado Comprador | Oferta > Demanda + 20% | 70% |
| Mercado Vendedor | Demanda > Oferta + 20% | 70% |

**Algoritmo de Trend Detection:**
```
# Para cada zona, analizar 3, 6, 12 meses de datos

short_term = slope(precios_ultimos_3_meses)
medium_term = slope(precios_ultimos_6_meses)
long_term = slope(precios_ultimos_12_meses)

trend_direction = weighted_vote(short_term, medium_term, long_term)
trend_strength = abs(short_term * 0.5 + medium_term * 0.3 + long_term * 0.2)

if trend_strength < sensitivity_threshold:
    signal = "ESTABLE"
elif trend_direction > 0:
    signal = "CRECIENDO" if trend_strength > 0.03 else "LIGERO_CRECIMIENTO"
else:
    signal = "CAYENDO" if trend_strength > 0.02 else "LIGERA_CAIDA"
```

### 4.10 Investment Intelligence Engine

**Propósito:** Clasificación automática de cada activo en categorías de inversión.

**Input:** Scores de todos los engines anteriores.
**Output:** Categoría de inversión + sub-categoría + confianza.

**Taxonomía de Inversión:**

| Categoría | Definición | Condiciones |
|-----------|------------|-------------|
| **Flip Opportunity** | Comprar, mejorar, vender rápido | Score ≥ 70, Liquidez ≥ 65, Descuento ≥ 15% |
| **Rental Opportunity** | Comprar para alquilar | Rental Yield ≥ 5%, Cap Rate ≥ 4%, Vacancy < 10% |
| **Cash Flow Positive** | Flujo de caja mensual positivo | Cash Flow > 0, Rental Yield ≥ 4.5% |
| **Long Term Hold** | Plusvalía a largo plazo | Growth ≥ 5% anual, zona PRIME, riesgo bajo |
| **Luxury Investment** | Alta gama, mercado premium | Price > 500k, zona premium, amenities |
| **Commercial Opportunity** | Uso comercial o mixto | Tipo comercial, yield ≥ 6% |
| **Distressed Asset** | Propiedad con problemas | Score < 40, descuento > 30%, DOM > 180 |
| **Speculative** | Alta incertidumbre, alto potencial | Zona SPECULATIVE, price < promedio 30% |
| **Premium Asset** | Activo de primera línea | Score > 85, Location > 80, zona PRIME |

**Multi-classificación soportada:** Un activo puede pertenecer a múltiples categorías (ej. Flip + Rental).

**Algoritmo de Clasificación:**
```
classifications = []

for category, rules in investment_categories.items():
    confidence = 0
    applicable_rules = 0
    
    for rule in rules:
        if evaluate(rule, asset_scores):
            applicable_rules++
            confidence += rule_weight(rule)
    
    if applicable_rules >= min_rules(category):
        confidence_pct = confidence / max_possible_weight(category) * 100
        classifications.append({
            'category': category,
            'confidence': min(confidence_pct, 100),
            'explanation': generate_explanation(category, asset_scores)
        })

primary_classification = max(classifications, key=lambda x: x.confidence)
```

---

## 5. Integración con Opportunity Engine

### 5.1 Flujo de Integración

```
1. Nuevo activo es ingerido por el scraper/normalizer
2. Data Intelligence Layer calcula TODAS las métricas (batch de engines)
3. Resultados escritos a las tablas de Data Intelligence
4. Opportunity Engine LE de Data Intelligence:
   - Market context (zona: hot/cold, precio promedio, tendencia)
   - Location quality (Accessibility, Convenience, etc.)
   - Rental potential (yield, cash flow)
   - Liquidity (qué tan vendible es)
   - Valuation (fair value range, over/under priced)
   - Historical context (cómo ha cambiado)
5. Opportunity Engine recalcula su score con nuevos features
6. Nuevo score + métricas → Decision Engine
7. Decision Engine produce decisión final
```

### 5.2 Nuevos Features para Opportunity Engine

| Feature | Fuente | Impacto |
|---------|--------|---------|
| `market_temperature` | Market Intel | Ajusta score base ±10 |
| `location_score` | Location Intel | Bonificador hasta +15 |
| `rental_yield` | Rental Intel | Bonificador si ≥ 5% +10 |
| `liquidity_score` | Liquidity Intel | Bonificador si ≥ 70 +8 |
| `valuation_discount` | Valuation Intel | Reemplaza comparable simple |
| `price_trend` | Market Trend | Ajusta confianza ±10 |
| `investment_class` | Investment Intel | Peso adicional en decisión |
| `historical_velocity` | Historical Intel | Confianza en predicción |

### 5.3 Fórmula de Score Mejorada

```
baseScore = 37 + discount*1.8 + bankBonus + compBonus

# Nuevos factores de Data Intelligence
locationBonus = if location_score > 70: (location_score - 70) * 0.3 else 0
marketBonus = market_temperature_factor * 8  # HOT=8, WARM=4, COOL=-4, COLD=-8
liquidityBonus = if liquidity_score > 65: (liquidity_score - 65) * 0.25 else 0
rentalBonus = if rental_yield > 0.05: min((rental_yield - 0.05) * 500, 12) else 0

finalScore = baseScore + locationBonus + marketBonus + liquidityBonus + rentalBonus
finalScore = min(max(finalScore, 0), 100)
```

---

## 6. Migración de Esquema — Nuevas Tablas

### 6.1 Resumen de Nuevas Tablas

| # | Tabla | Propósito | Filas Estimadas |
|---|-------|-----------|-----------------|
| 1 | `zone_hierarchy` | Jerarquía geográfica (prov→dist→corr→barrio→urba) | ~500 |
| 2 | `zone_metrics` | Métricas de mercado por zona | ~500 x snapshots |
| 3 | `point_of_interest` | Base de POIs (hospitales, escuelas, etc.) | ~5,000 |
| 4 | `location_scores` | Scores de ubicación por propiedad | = assets |
| 5 | `location_score_components` | Componentes individuales del location score | ×6 = as sets |
| 6 | `rental_estimates` | Estimaciones de rentabilidad | = assets |
| 7 | `liquidity_scores` | Métricas de liquidez por activo | = assets |
| 8 | `valuation_estimates` | Valuaciones con intervalos de confianza | = assets |
| 9 | `valuation_comparables_used` | Comparables usados en cada valuación | ×10-15 |
| 10 | `asset_versions` | Versionado completo de activos | ×10-20 |
| 11 | `asset_timeline_events` | Línea de tiempo de cada activo | ×10-50 |
| 12 | `neighborhood_profiles` | Perfiles completos de zona | ~500 |
| 13 | `trend_signals` | Señales de mercado detectadas | ~500 x snapshots |
| 14 | `investment_classifications` | Clasificaciones de inversión por activo | = assets |
| 15 | `market_snapshots` | Instantáneas completas del mercado | Semanal = 52/año |
| 16 | `calculation_log` | Log de auditoría de cada cálculo | = cálculos |

### 6.2 Totales
- **16 nuevas tablas** (de 7 existentes en migración 001)
- **~45 índices** nuevos (ver documento de esquema)
- **8 nuevos tipos ENUM**
- **5 nuevas funciones de cálculo**
- **3 nuevas vistas materializadas**

---

## 7. Performance y Escalabilidad

### 7.1 Estimaciones de Carga

| Métrica | Valor |
|---------|-------|
| Propiedades | 100,000+ |
| Versiones por propiedad | ~15 (histórico) |
| Comparables por valuación | ~10-15 |
| POIs en base | ~5,000 |
| Zonas geográficas | ~500 |
| Snapshots de mercado/año | 52 |
| Cálculos diarios estimados | ~50,000 |
| Filas timeline por propiedad | ~10-50 |

### 7.2 Estrategias de Performance

1. **Cálculo diferido (lazy)** — Los engines se ejecutan solo cuando hay datos nuevos
2. **Caché con TTL** — Resultados cacheados por 1h (zona) a 24h (mercado)
3. **Invalidación granular** — Solo recalcular zonas afectadas por nuevos datos
4. **Vistas materializadas** — Para consultas frecuentes (dashboard, reportes)
5. **Batch processing** — Los cálculos por lote (no por propiedad individual)
6. **Particionamiento** — Tablas grandes particionadas por mes
7. **Índices compuestos** — Para las consultas más frecuentes
8. **Compresión JSONB** — Para datos semiestructurados y metadata

### 7.3 Cuellos de Botella Identificados

| Componente | Riesgo | Mitigación |
|-----------|--------|------------|
| Location Scoring | Cálculo de distancias para 100k propiedades | Pre-calcular y cachear por zona+POI |
| Valuation | Comparables + hedonic regression para 100k props | Indexar por zona+tipo+área |
| Trend Detection | Series temporales para 500 zonas | Cálculo nocturno, cache 24h |
| Timeline Generation | Historial por propiedad | Generar bajo demanda, cachear |
| POI Database | Consultas geoespaciales | Índice GIST en coordenadas |

---

## 8. Machine Learning Readiness

### 8.1 Datos Capturados para ML Futuro

Cada cálculo registra:

```json
{
  "calculation_id": "uuid",
  "engine": "market_intelligence",
  "version": "1.0.0",
  "timestamp": "2026-07-02T12:00:00Z",
  "input": {
    "zone_id": "costa-del-este",
    "active_properties_count": 145,
    "price_range": {"min": 180000, "max": 850000},
    "time_window_days": 30
  },
  "output": {
    "average_price": 425000,
    "median_price": 395000,
    "price_per_m2": 2850,
    "liquidity": 0.72
  },
  "weights": {
    "dom_weight": 0.30,
    "velocity_weight": 0.20,
    "rotation_weight": 0.20,
    "pressure_weight": 0.15,
    "buyer_weight": 0.15
  },
  "performance_ms": 234,
  "source_data_hash": "sha256..."
}
```

### 8.2 Modelos ML Futuros (Post-fase 2.4)

| Modelo | Propósito | Datos de Entrenamiento |
|--------|-----------|----------------------|
| Price Prediction | Predecir precio de venta | Historial de transacciones + características |
| Time to Sell | Predecir días en mercado | Características + zona + precio + temporada |
| Rental Yield | Predecir yield de alquiler | Historial de alquileres por zona+tipo |
| Classification | Clasificar tipo de inversión | Datos etiquetados de Investment Intel |
| Anomaly Detection | Detectar propiedades infravaloradas | Residuales del modelo de Price Prediction |

---

## 9. Riesgos y Mitigaciones

| # | Riesgo | Impacto | Probabilidad | Mitigación |
|---|--------|---------|-------------|------------|
| 1 | Calidad de datos de POIs | Alto | Media | Múltiples fuentes, validación cruzada |
| 2 | Precisión de coordenadas | Medio | Alta | Geocoding por dirección + validación manual |
| 3 | Falta de datos históricos | Alto | Alta | Comenzar a recolectar desde ahora, usar defaults |
| 4 | Mercado panameño pequeño | Medio | Media | Menos datos para ML, usar Bayesian priors |
| 5 | Rendimiento en 100k propiedades | Alto | Baja | Diseño escalable desde inicio |
| 6 | Overfitting de valuación | Medio | Media | Validación cruzada, intervalos de confianza |
| 7 | Vacancy rate sin datos históricos | Alto | Alta | Usar proxis (DOM, rotación) |
| 8 | Sobreingeniería antes de validación | Medio | Alta | Roadmap prioriza validación temprana |

---

## 10. Criterios de Aceptación

### Fase 2.4 Completa cuando:

1. [ ] Todos los 10 engines tienen especificación completa
2. [ ] Esquema de base de datos con 16 nuevas tablas aprobado
3. [ ] Arquitectura revisada y aprobada por stakeholders
4. [ ] Roadmap con sprints y entregables definido
5. [ ] API endpoints especificados
6. [ ] Plan de integración con Opportunity Engine documentado
7. [ ] Estrategia de performance para 100k propiedades validada
8. [ ] ML-readiness framework documentado

### Release 2.4.0 MVP cuando:

1. [ ] Market Intelligence Engine implementado y probado
2. [ ] Location Intelligence Engine implementado con POIs básicos (top 5 categorías)
3. [ ] Valuation Engine implementado y calibrado contra Golden Dataset
4. [ ] Rental Engine implementado con estimaciones básicas
5. [ ] Investment Classification implementada (top 5 categorías)
6. [ ] Datos históricos comenzando a versionarse
7. [ ] Dashboard endpoints exponiendo nuevas métricas
8. [ ] Pipeline integrado con Data Intelligence Layer
9. [ ] Performance tests con 10,000 propiedades

---

## 11. Glosario

| Término | Definición |
|---------|-----------|
| Absorption Rate | Velocidad a la que las propiedades se venden en un mercado |
| Cap Rate | Tasa de capitalización = NOI / Valor de la propiedad |
| DOM | Days on Market — días que una propiedad ha estado listada |
| Market Temperature | Indicador compuesto de oferta/demanda |
| NOI | Net Operating Income — ingreso operativo neto |
| POI | Point of Interest — punto de interés geográfico |
| Yield | Rendimiento = ingreso anual / valor de la propiedad |
| Inventory | Número de propiedades disponibles para la venta |
| Liquidity | Facilidad con la que una propiedad puede venderse |
| Plusvalía | Incremento del valor de una propiedad con el tiempo |

---

## 12. Documentos Relacionados

- `DATA_INTELLIGENCE_ARCHITECTURE.md` — Arquitectura detallada del sistema
- `DATA_INTELLIGENCE_SCHEMA.md` — Modelo de datos completo
- `DATA_INTELLIGENCE_ROADMAP.md` — Roadmap de implementación
- `DATA_INTELLIGENCE_API.md` — Especificación de endpoints
- `migrations/003_data_intelligence_schema.sql` — Migración SQL
- `DATA_INTELLIGENCE_SCORES.md` — Especificación de scores compuestos

---

**Fin del PRD — Siguiente documento: DATA_INTELLIGENCE_ARCHITECTURE.md**
