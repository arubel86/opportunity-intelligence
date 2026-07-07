# DATA INTELLIGENCE LAYER — Data Schema
## Hermes Opportunity Intelligence Platform

**Versión:** 1.0.0
**Fecha:** 2026-07-02
**Estado:** BORRADOR PARA REVISIÓN

---

## 0. Resumen

Este documento especifica el modelo de datos completo de la Data Intelligence Layer.

**Contenido:**
- 16 nuevas tablas de datos
- 45 índices
- 8 nuevos tipos ENUM
- 3 funciones de cálculo
- 1 vista materializada
- Cálculos detallados por engine

---

## 1. Nuevos Tipos ENUM

```sql
-- Tipo de zona geográfica
CREATE TYPE zone_type AS ENUM (
    'province',
    'district',
    'corregimiento',
    'neighborhood',
    'urbanization'
);

-- Temperatura de mercado
CREATE TYPE market_temperature AS ENUM (
    'hot',
    'warm',
    'cool',
    'cold',
    'insufficient_data'
);

-- Señal de tendencia
CREATE TYPE trend_signal_type AS ENUM (
    'market_growing',
    'market_declining',
    'market_stable',
    'overvalued',
    'undervalued',
    'oversupply',
    'high_demand',
    'buyer_market',
    'seller_market'
);

-- Categoría de inversión
CREATE TYPE investment_category AS ENUM (
    'flip_opportunity',
    'rental_opportunity',
    'cash_flow_positive',
    'long_term_hold',
    'luxury_investment',
    'commercial_opportunity',
    'distressed_asset',
    'speculative',
    'premium_asset'
);

-- Tipo de evento de timeline
CREATE TYPE timeline_event_type AS ENUM (
    'asset_created',
    'price_change',
    'price_reduction',
    'price_increase',
    'score_change',
    'decision_change',
    'status_change',
    'classification_change',
    'relist',
    'correction'
);

-- Estado de cálculo
CREATE TYPE calculation_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'skipped',
    'degraded'
);

-- Rating de inversión por zona
CREATE TYPE investment_rating AS ENUM (
    'prime',
    'desirable',
    'stable',
    'speculative',
    'risky',
    'insufficient_data'
);

-- Clasificación de calidad de alquiler
CREATE TYPE rental_quality AS ENUM (
    'excellent',
    'good',
    'fair',
    'not_recommended'
);
```

---

## 2. Tabla 1: zone_hierarchy

**Propósito:** Jerarquía geográfica completa.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() | ID único |
| zone_type | zone_type | NOT NULL | Tipo de zona |
| name | VARCHAR(200) | NOT NULL | Nombre de la zona |
| slug | VARCHAR(200) | NOT NULL UNIQUE | Slug único para URLs |
| parent_id | UUID | FK → zone_hierarchy(id) NULL | Zona padre |
| province | VARCHAR(100) | NOT NULL | Provincia (denormalizado) |
| district | VARCHAR(100) | | Distrito (denormalizado) |
| corregimiento | VARCHAR(100) | | Corregimiento (denormalizado) |
| coordinates | JSONB | | Centroide {lat, lng} |
| bounding_box | JSONB | | Bounding box {minLat, minLng, maxLat, maxLng} |
| area_km2 | DECIMAL(10,2) | | Área en km² |
| population_estimate | INT | | Población estimada |
| metadata | JSONB | DEFAULT '{}' | Metadata adicional |
| is_active | BOOLEAN | DEFAULT true | Zona activa/archivada |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
-- PK index (automático)
CREATE INDEX idx_zone_hierarchy_parent ON zone_hierarchy(parent_id);
CREATE INDEX idx_zone_hierarchy_slug ON zone_hierarchy(slug);
CREATE INDEX idx_zone_hierarchy_type ON zone_hierarchy(zone_type);
CREATE INDEX idx_zone_hierarchy_active ON zone_hierarchy(is_active) WHERE is_active = true;
-- Búsqueda por nombre (ILIKE)
CREATE INDEX idx_zone_hierarchy_name_trgm ON zone_hierarchy USING gin (name gin_trgm_ops);
```

**Filas estimadas:** ~500

---

## 3. Tabla 2: zone_metrics

**Propósito:** Métricas de mercado por zona (snapshots temporales).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| zone_id | UUID | FK → zone_hierarchy(id) NOT NULL | Zona |
| snapshot_date | DATE | NOT NULL | Fecha del snapshot |
| total_properties | INT | | Propiedades activas totales |
| new_listings_7d | INT | | Nuevos listados (7 días) |
| new_listings_30d | INT | | Nuevos listados (30 días) |
| sold_last_30d | INT | | Vendidos últimos 30 días |
| average_price | DECIMAL(14,2) | | Precio promedio |
| median_price | DECIMAL(14,2) | | Precio mediano |
| price_per_m2 | DECIMAL(10,2) | | Precio por m² |
| price_per_m2_min | DECIMAL(10,2) | | Precio m² mínimo |
| price_per_m2_max | DECIMAL(10,2) | | Precio m² máximo |
| average_dom | INT | | Days on Market promedio |
| median_dom | INT | | Days on Market mediano |
| absorption_rate | DECIMAL(5,2) | | Unidades vendidas / mes |
| months_of_inventory | DECIMAL(5,2) | | Inventario en meses |
| market_temperature | market_temperature | | Temperatura calculada |
| supply_count | INT | | Propiedades en venta |
| demand_proxy | INT | | Proxy de demanda (contactos) |
| growth_monthly | DECIMAL(5,2) | | Crecimiento mensual % |
| growth_quarterly | DECIMAL(5,2) | | Crecimiento trimestral % |
| growth_yearly | DECIMAL(5,2) | | Crecimiento anual % |
| price_distribution | JSONB | | Distribución de precios (percentiles) |
| type_breakdown | JSONB | | Desglose por tipo de propiedad |
| metadata | JSONB | | Metadata adicional |
| calculation_id | UUID | FK → calculation_log(id) | Trazabilidad |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_zone_metrics_zone_date ON zone_metrics(zone_id, snapshot_date DESC);
CREATE INDEX idx_zone_metrics_date ON zone_metrics(snapshot_date);
CREATE INDEX idx_zone_metrics_temp ON zone_metrics(market_temperature);
CREATE INDEX idx_zone_metrics_zone_latest ON zone_metrics(zone_id, snapshot_date DESC) 
    WHERE snapshot_date >= CURRENT_DATE - INTERVAL '7 days';
```

**Filas estimadas:** ~500 zonas × 365 snapshots = ~182,500/año

---

## 4. Tabla 3: point_of_interest

**Propósito:** Base de datos de puntos de interés geográficos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(300) | NOT NULL | Nombre del POI |
| category | VARCHAR(50) | NOT NULL | Categoría (salud, educacion, comercio, servicios, recreacion, transporte) |
| subcategory | VARCHAR(100) | | Subcategoría |
| address | TEXT | | Dirección |
| coordinates | JSONB | NOT NULL | {lat, lng} |
| zone_id | UUID | FK → zone_hierarchy(id) | Zona donde se ubica |
| phone | VARCHAR(50) | | Teléfono |
| website | VARCHAR(500) | | Sitio web |
| rating | DECIMAL(3,2) | | Calificación (1-5) |
| source | VARCHAR(100) | | Fuente de datos |
| is_verified | BOOLEAN | DEFAULT false | Verificado manualmente |
| metadata | JSONB | | Metadata adicional |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_poi_category ON point_of_interest(category);
CREATE INDEX idx_poi_zone ON point_of_interest(zone_id);
CREATE INDEX idx_poi_category_zone ON point_of_interest(category, zone_id);
CREATE INDEX idx_poi_coordinates ON point_of_interest USING gist (
    ll_to_earth((coordinates->>'lat')::float8, (coordinates->>'lng')::float8)
);
CREATE INDEX idx_poi_verified ON point_of_interest(is_verified) WHERE is_verified = true;
```

**Filas estimadas:** ~5,000

---

## 5. Tabla 4: location_scores

**Propósito:** Scores de ubicación por propiedad.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| asset_id | UUID | FK → assets(id) NOT NULL UNIQUE | Activo |
| accessibility_score | INT | CHECK (0-100) | Score de accesibilidad |
| convenience_score | INT | CHECK (0-100) | Score de conveniencia |
| neighborhood_score | INT | CHECK (0-100) | Score de vecindario |
| infrastructure_score | INT | CHECK (0-100) | Score de infraestructura |
| urban_growth_score | INT | CHECK (0-100) | Score de crecimiento urbano |
| overall_location_score | INT | CHECK (0-100) | Score compuesto |
| location_confidence | INT | CHECK (0-100) | Confianza del score |
| coordinates_quality | VARCHAR(50) | | Calidad de coordenadas |
| score_version | VARCHAR(20) | NOT NULL | Versión del scoring |
| calculation_id | UUID | FK → calculation_log(id) | |
| calculated_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_location_scores_asset ON location_scores(asset_id);
CREATE INDEX idx_location_scores_overall ON location_scores(overall_location_score DESC);
CREATE INDEX idx_location_scores_calc ON location_scores(calculated_at);
```

**Filas estimadas:** = número de activos

---

## 6. Tabla 5: location_score_components

**Propósito:** Componentes individuales que componen el location score (desglose por categoría de POI).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| location_score_id | UUID | FK → location_scores(id) NOT NULL | Score padre |
| category | VARCHAR(50) | NOT NULL | Categoría POI |
| poi_count | INT | NOT NULL | POIs encontrados en radio |
| max_expected | INT | NOT NULL | POIs esperados para score 100 |
| raw_score | DECIMAL(5,2) | | Score crudo (0-1) |
| weighted_score | DECIMAL(5,2) | | Score con peso de categoría |
| weight | DECIMAL(4,3) | | Peso de esta categoría |
| radius_km | DECIMAL(5,2) | | Radio de búsqueda usado |
| pois_found | JSONB | | IDs de POIs encontrados |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_loc_score_comp_score ON location_score_components(location_score_id);
CREATE INDEX idx_loc_score_comp_category ON location_score_components(category);
```

**Filas estimadas:** = location_scores × 6 (categorías)

---

## 7. Tabla 6: rental_estimates

**Propósito:** Estimaciones de rentabilidad de alquiler.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| asset_id | UUID | FK → assets(id) NOT NULL UNIQUE | Activo |
| estimated_monthly_rent | DECIMAL(12,2) | | Renta mensual estimada (USD) |
| estimated_annual_rent | DECIMAL(12,2) | | Renta anual estimada |
| gross_yield | DECIMAL(5,2) | | Yield bruto % |
| net_yield | DECIMAL(5,2) | | Yield neto (después gastos 30%) |
| cap_rate | DECIMAL(5,2) | | Cap Rate % |
| estimated_noi | DECIMAL(12,2) | | Net Operating Income anual |
| cash_flow_monthly | DECIMAL(10,2) | | Cash Flow mensual estimado |
| cash_flow_annual | DECIMAL(12,2) | | Cash Flow anual estimado |
| vacancy_rate_estimate | DECIMAL(5,2) | | Tasa de vacancia estimada % |
| time_to_rent_days | INT | | Días estimados para alquilar |
| rental_demand_score | INT | CHECK (0-100) | Demanda de alquiler en zona |
| rental_quality | rental_quality | | Clasificación |
| annual_return | DECIMAL(5,2) | | Retorno anual total % |
| expected_roi | DECIMAL(5,2) | | ROI esperado % |
| zone_rental_factor | DECIMAL(5,2) | | Factor de zona usado |
| type_adjustment | DECIMAL(5,2) | | Ajuste por tipo |
| calculation_version | VARCHAR(20) | NOT NULL | |
| calculation_id | UUID | FK → calculation_log(id) | |
| calculated_at | TIMESTAMPTZ | DEFAULT now() | |

**Cálculos:**

```sql
-- Renta mensual estimada
estimated_monthly_rent := (price_amount * zone_rental_factor * type_adjustment) / 12;

-- Yield bruto
gross_yield := (estimated_monthly_rent * 12) / NULLIF(price_amount, 0) * 100;

-- Cap Rate (NOI / Price)
noi := (estimated_monthly_rent * 12) * 0.70;  -- 30% gastos operativos
cap_rate := (noi / NULLIF(price_amount, 0)) * 100;

-- Rental Quality Classification
rental_quality := CASE
    WHEN gross_yield >= 7.0 THEN 'excellent'
    WHEN gross_yield >= 5.0 THEN 'good'
    WHEN gross_yield >= 3.5 THEN 'fair'
    ELSE 'not_recommended'
END;
```

**Índices:**
```sql
CREATE INDEX idx_rental_estimates_asset ON rental_estimates(asset_id);
CREATE INDEX idx_rental_estimates_yield ON rental_estimates(gross_yield DESC);
CREATE INDEX idx_rental_estimates_quality ON rental_estimates(rental_quality);
```

---

## 8. Tabla 7: liquidity_scores

**Propósito:** Métricas de liquidez por activo.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| asset_id | UUID | FK → assets(id) NOT NULL UNIQUE | Activo |
| zone_id | UUID | FK → zone_hierarchy(id) | Zona del activo |
| estimated_dom | INT | | Days on Market estimado |
| zone_avg_dom | INT | | DOM promedio en zona |
| liquidity_score | INT | CHECK (0-100) | Score compuesto de liquidez |
| market_pressure | DECIMAL(5,2) | | Presión de mercado (-1 a 1) |
| historical_velocity | DECIMAL(5,2) | | Velocidad histórica |
| rotation_rate | DECIMAL(5,2) | | Tasa de rotación % |
| buyer_activity_index | INT | | Actividad de compradores (0-200) |
| exit_difficulty | INT | CHECK (0-100) | Dificultad de salida |
| comparable_dom_count | INT | | Comparables de DOM usados |
| liquidity_trend | VARCHAR(20) | | improving/stable/declining |
| calculation_version | VARCHAR(20) | NOT NULL | |
| calculation_id | UUID | FK → calculation_log(id) | |
| calculated_at | TIMESTAMPTZ | DEFAULT now() | |

**Cálculos:**
```sql
-- Score de DOM (inverso: menos DOM = más líquido)
dom_score := GREATEST(0, 100 - (estimated_dom * 100.0 / 365));

-- Market Pressure
market_pressure := (zone_avg_dom - GREATEST(estimated_dom, 1))::decimal 
    / GREATEST(zone_avg_dom, 1);

-- Liquidity Score Compuesto
liquidity_score := ROUND(
    dom_score * 0.30 +
    LEAST(historical_velocity * 20, 100) * 0.20 +
    LEAST(rotation_rate * 3.33, 100) * 0.20 +
    GREATEST(0, 100 - ABS(market_pressure) * 100) * 0.15 +
    LEAST(buyer_activity_index * 0.5, 100) * 0.15
);

-- Exit Difficulty
exit_difficulty := 100 - liquidity_score;
```

**Índices:**
```sql
CREATE INDEX idx_liquidity_scores_asset ON liquidity_scores(asset_id);
CREATE INDEX idx_liquidity_scores_score ON liquidity_scores(liquidity_score DESC);
CREATE INDEX idx_liquidity_scores_zone ON liquidity_scores(zone_id);
```

---

## 9. Tabla 8: valuation_estimates

**Propósito:** Valuación profesional con intervalos de confianza.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| asset_id | UUID | FK → assets(id) NOT NULL UNIQUE | Activo |
| conservative_value | DECIMAL(14,2) | | Valor conservador (límite inferior) |
| market_value | DECIMAL(14,2) | | Valor de mercado estimado |
| optimistic_value | DECIMAL(14,2) | | Valor optimista (límite superior) |
| confidence_interval | DECIMAL(14,2) | | Ancho del intervalo de confianza |
| margin_of_error | DECIMAL(5,2) | | Margen de error % |
| comparable_count | INT | | Número de comparables usados |
| comparable_price_min | DECIMAL(14,2) | | Precio mínimo de comparables |
| comparable_price_max | DECIMAL(14,2) | | Precio máximo de comparables |
| comparable_price_avg | DECIMAL(14,2) | | Precio promedio de comparables |
| valuation_discount | DECIMAL(5,2) | | (market_value - price) / market_value % |
| sensitivity_analysis | JSONB | | Top 3 variables más sensibles |
| method_breakdown | JSONB | | Desglose por metodología |
| outlier_excluded_count | INT | | Outliers excluidos |
| valuation_explanation | TEXT | | Explicación legible |
| calculation_version | VARCHAR(20) | NOT NULL | |
| calculation_id | UUID | FK → calculation_log(id) | |
| calculated_at | TIMESTAMPTZ | DEFAULT now() | |

**Cálculos:**

```
Metodología 1: Precio m² (peso 35%)
  value_per_m2 = AVG(comparables.price / comparables.area) * asset.area

Metodología 2: Comparables Directos (peso 30%)
  value_direct = MEDIAN(comparables.adjusted_price)
  donde adjusted_price = comparables.price * factor_distancia * factor_tamaño * factor_estado

Metodología 3: Hedonic (peso 25%)
  feature_coefficients = { bedrooms: 15000, bathrooms: 12000, area_m2: 1200, pool: 25000, parking: 8000 }
  value_hedonic = SUM(coeff * asset_features)

Metodología 4: Tendencia Zonal (peso 10%)
  value_trend = zone_avg_price * (1 + zone_growth_rate)

market_value = (value_per_m2 * 0.35 + value_direct * 0.30 + value_hedonic * 0.25 + value_trend * 0.10)
confidence_interval = 1.96 * STDDEV(comparable_adjustments) / SQRT(comparable_count)
conservative_value = market_value - confidence_interval
optimistic_value = market_value + confidence_interval
margin_of_error = (confidence_interval / market_value) * 100
```

**Índices:**
```sql
CREATE INDEX idx_valuation_estimates_asset ON valuation_estimates(asset_id);
CREATE INDEX idx_valuation_estimates_value ON valuation_estimates(market_value DESC);
CREATE INDEX idx_valuation_estimates_discount ON valuation_estimates(valuation_discount DESC);
CREATE INDEX idx_valuation_estimates_errors ON valuation_estimates(margin_of_error);
```

---

## 10. Tabla 9: valuation_comparables_used

**Propósito:** Registro de cada comparable usado en una valuación.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| valuation_id | UUID | FK → valuation_estimates(id) NOT NULL | Valuación padre |
| comparable_asset_id | UUID | FK → assets(id) | Activo comparable |
| comparable_title | VARCHAR(500) | | Título del comparable |
| comparable_price | DECIMAL(14,2) | | Precio del comparable |
| comparable_area | DECIMAL(10,2) | | Área del comparable |
| comparable_price_m2 | DECIMAL(10,2) | | Precio m² del comparable |
| distance_km | DECIMAL(5,2) | | Distancia al activo valuado |
| similarity_score | DECIMAL(5,2) | | Score de similitud (0-1) |
| price_adjustment | DECIMAL(5,2) | | Ajuste de precio aplicado % |
| adjusted_price | DECIMAL(14,2) | | Precio ajustado usado en valuación |
| is_outlier | BOOLEAN | DEFAULT false | Excluido como outlier |
| methodology_used | VARCHAR(50) | | Metodología que usó este comparable |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_val_comp_valuation ON valuation_comparables_used(valuation_id);
CREATE INDEX idx_val_comp_comparable ON valuation_comparables_used(comparable_asset_id);
CREATE INDEX idx_val_comp_similarity ON valuation_comparables_used(similarity_score DESC);
```

**Filas estimadas:** = valuation_estimates × 10-15

---

## 11. Tabla 10: asset_versions

**Propósito:** Versionado completo de activos (nunca se sobrescribe).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| asset_id | UUID | FK → assets(id) NOT NULL | Activo |
| version_number | INT | NOT NULL | Número de versión (1, 2, 3...) |
| valid_from | TIMESTAMPTZ | NOT NULL | Desde cuándo es válida esta versión |
| valid_to | TIMESTAMPTZ | NULL si es actual | Hasta cuándo fue válida |
| is_current | BOOLEAN | DEFAULT false | Versión actual |
| snapshot | JSONB | NOT NULL | Copia completa del activo |
| changed_fields | TEXT[] | | Campos que cambiaron |
| change_reason | VARCHAR(200) | | Razón del cambio |
| source_run_id | UUID | | ID del scraper run que generó el cambio |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_asset_versions_asset ON asset_versions(asset_id, version_number DESC);
CREATE INDEX idx_asset_versions_current ON asset_versions(asset_id) WHERE is_current = true;
CREATE INDEX idx_asset_versions_valid ON asset_versions(asset_id, valid_from, valid_to);
CREATE INDEX idx_asset_versions_reason ON asset_versions(change_reason);
```

**Filas estimadas:** = activos × ~15 versiones

---

## 12. Tabla 11: asset_timeline_events

**Propósito:** Línea de tiempo de eventos de cada activo.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| asset_id | UUID | FK → assets(id) NOT NULL | Activo |
| event_type | timeline_event_type | NOT NULL | Tipo de evento |
| event_date | TIMESTAMPTZ | NOT NULL | Fecha del evento |
| price_before | DECIMAL(14,2) | | Precio antes del evento |
| price_after | DECIMAL(14,2) | | Precio después del evento |
| score_before | INT | | Score antes |
| score_after | INT | | Score después |
| decision_before | VARCHAR(50) | | Decisión antes |
| decision_after | VARCHAR(50) | | Decisión después |
| confidence_before | INT | | Confianza antes |
| confidence_after | INT | | Confianza después |
| event_summary | TEXT | | Descripción legible del evento |
| metadata | JSONB | | Datos adicionales |
| source_run_id | UUID | | Scraper run que detectó el cambio |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_timeline_asset_event ON asset_timeline_events(asset_id, event_date DESC);
CREATE INDEX idx_timeline_asset_type ON asset_timeline_events(asset_id, event_type);
CREATE INDEX idx_timeline_date ON asset_timeline_events(event_date);
```

**Filas estimadas:** = activos × ~30 eventos

---

## 13. Tabla 12: neighborhood_profiles

**Propósito:** Perfiles completos y automatizados por zona.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| zone_id | UUID | FK → zone_hierarchy(id) NOT NULL UNIQUE | Zona |
| zone_type | zone_type | NOT NULL | Tipo de zona |
| market_metrics | JSONB | | Precio promedio, m², oferta, demanda |
| liquidity_metrics | JSONB | | DOM, rotación, absorption rate, pressure |
| rental_metrics | JSONB | | Yield promedio, cap rate, vacancy |
| growth_metrics | JSONB | | Crecimiento anual, mensual, tendencia |
| location_metrics | JSONB | | Scores de ubicación agregados |
| property_type_breakdown | JSONB | | Distribución por tipo de propiedad |
| price_distribution | JSONB | | Percentiles de precio |
| investment_rating | investment_rating | | Rating calculado |
| classification | VARCHAR(50) | | residencial/comercial/mixto/premium/desarrollo |
| risk_level | VARCHAR(20) | | bajo/medio/alto |
| composite_score | INT | CHECK (0-100) | Score compuesto de la zona |
| top_pois | JSONB | | Top POIs de la zona |
| last_calculated | TIMESTAMPTZ | | Último cálculo |
| calculation_id | UUID | FK → calculation_log(id) | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Cálculo de Investment Rating:**
```sql
composite_score := ROUND(
    COALESCE((liquidity_metrics->>'liquidity_score')::int, 0) * 0.25 +
    COALESCE((growth_metrics->>'growth_yearly')::decimal, 0) * 2.5 +  -- Max 25 puntos
    COALESCE((rental_metrics->>'avg_gross_yield')::decimal, 0) * 4.0 + -- Max 20 puntos
    CASE WHEN (growth_metrics->>'trend_stability')::decimal > 0.7 THEN 15 ELSE 5 END +
    CASE WHEN (market_metrics->>'demand_supply_ratio')::decimal > 1.2 THEN 15 ELSE 5 END
);

investment_rating := CASE
    WHEN composite_score >= 80 THEN 'prime'
    WHEN composite_score >= 65 THEN 'desirable'
    WHEN composite_score >= 50 THEN 'stable'
    WHEN composite_score >= 35 THEN 'speculative'
    ELSE 'risky'
END;
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_neighborhood_zone ON neighborhood_profiles(zone_id);
CREATE INDEX idx_neighborhood_rating ON neighborhood_profiles(investment_rating);
CREATE INDEX idx_neighborhood_composite ON neighborhood_profiles(composite_score DESC);
CREATE INDEX idx_neighborhood_zone_type ON neighborhood_profiles(zone_type);
```

---

## 14. Tabla 13: trend_signals

**Propósito:** Señales de mercado detectadas automáticamente.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| zone_id | UUID | FK → zone_hierarchy(id) NOT NULL | Zona |
| signal_type | trend_signal_type | NOT NULL | Tipo de señal |
| confidence | INT | CHECK (0-100) | Confianza en la señal |
| detected_at | TIMESTAMPTZ | NOT NULL | Cuándo se detectó |
| expires_at | TIMESTAMPTZ | | Cuándo expira (si aplica) |
| signal_strength | DECIMAL(5,2) | | Fuerza de la señal (0-1) |
| evidence | JSONB | | Datos que respaldan la señal |
| short_term_slope | DECIMAL(5,2) | | Pendiente 3 meses |
| medium_term_slope | DECIMAL(5,2) | | Pendiente 6 meses |
| long_term_slope | DECIMAL(5,2) | | Pendiente 12 meses |
| is_active | BOOLEAN | DEFAULT true | Señal activa/expirada |
| calculation_id | UUID | FK → calculation_log(id) | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_trend_signals_zone ON trend_signals(zone_id);
CREATE INDEX idx_trend_signals_type ON trend_signals(signal_type);
CREATE INDEX idx_trend_signals_active ON trend_signals(is_active) WHERE is_active = true;
CREATE INDEX idx_trend_signals_detected ON trend_signals(detected_at DESC);
```

**Filas estimadas:** ~500 zonas × ~5 señales activas = ~2,500 activas + históricas

---

## 15. Tabla 14: investment_classifications

**Propósito:** Clasificaciones de inversión por activo.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| asset_id | UUID | FK → assets(id) NOT NULL | Activo |
| primary_category | investment_category | NOT NULL | Categoría principal |
| primary_confidence | INT | CHECK (0-100) | Confianza categoría principal |
| secondary_categories | investment_category[] | | Categorías secundarias |
| classification_explanation | TEXT | | Por qué se clasificó así |
| component_scores | JSONB | | Scores individuales usados |
| source_metrics | JSONB | | Snapshot de métricas usadas |
| calculation_version | VARCHAR(20) | NOT NULL | |
| calculation_id | UUID | FK → calculation_log(id) | |
| classified_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_inv_class_asset ON investment_classifications(asset_id);
CREATE INDEX idx_inv_class_category ON investment_classifications(primary_category);
CREATE INDEX idx_inv_class_confidence ON investment_classifications(primary_confidence DESC);
CREATE INDEX idx_inv_class_asset_category ON investment_classifications(asset_id, primary_category);
```

---

## 16. Tabla 15: market_snapshots

**Propósito:** Instantáneas completas del mercado (generadas semanalmente).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK | |
| snapshot_date | DATE | NOT NULL UNIQUE | Fecha del snapshot |
| total_active_properties | INT | | Total activos en mercado |
| total_new_listings_week | INT | | Nuevos esta semana |
| total_sold_week | INT | | Vendidos esta semana |
| average_price_market | DECIMAL(14,2) | | Precio promedio mercado |
| median_price_market | DECIMAL(14,2) | | Precio mediano mercado |
| average_dom_market | DECIMAL(6,1) | | DOM promedio mercado |
| overall_market_temperature | market_temperature | | Temperatura general |
| total_inventory_value | DECIMAL(16,2) | | Valor total del inventario |
| top_zones | JSONB | | Top 10 zonas por actividad |
| hottest_zones | JSONB | | Top 5 zonas más calientes |
| coldest_zones | JSONB | | Top 5 zonas más frías |
| segment_breakdown | JSONB | | Desglose por segmento |
| metadata | JSONB | | Metadata del snapshot |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE UNIQUE INDEX idx_market_snapshot_date ON market_snapshots(snapshot_date DESC);
CREATE INDEX idx_market_snapshot_temp ON market_snapshots(overall_market_temperature);
```

---

## 17. Tabla 16: calculation_log

**Propósito:** Log de auditoría de cada cálculo de inteligencia.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| engine_id | VARCHAR(50) | NOT NULL | Engine que ejecuta |
| engine_version | VARCHAR(20) | NOT NULL | Versión del engine |
| status | calculation_status | NOT NULL | Estado del cálculo |
| input_summary | TEXT | | Resumen del input |
| output_summary | TEXT | | Resumen del output |
| input_hash | VARCHAR(64) | | SHA-256 del input (para cache) |
| output_hash | VARCHAR(64) | | SHA-256 del output |
| weights_used | JSONB | | Pesos/config usados en el cálculo |
| performance_ms | INT | | Duración en ms |
| error_message | TEXT | | Mensaje de error si falló |
| error_stack | TEXT | | Stack trace si falló |
| cache_hit | BOOLEAN | DEFAULT false | Si fue servido de cache |
| asset_id | UUID | FK → assets(id) NULL | Activo asociado (opcional) |
| zone_id | UUID | FK → zone_hierarchy(id) NULL | Zona asociada (opcional) |
| source_run_id | UUID | | Scraper run asociado |
| correlation_id | UUID | | Para tracing de pipeline |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Índices:**
```sql
CREATE INDEX idx_calc_log_engine ON calculation_log(engine_id, created_at DESC);
CREATE INDEX idx_calc_log_asset ON calculation_log(asset_id, created_at DESC);
CREATE INDEX idx_calc_log_zone ON calculation_log(zone_id, created_at DESC);
CREATE INDEX idx_calc_log_status ON calculation_log(status) WHERE status IN ('failed', 'degraded');
CREATE INDEX idx_calc_log_date ON calculation_log(created_at DESC);
CREATE INDEX idx_calc_log_correlation ON calculation_log(correlation_id);
-- Para limpiar logs viejos
CREATE INDEX idx_calc_log_cleanup ON calculation_log(created_at) WHERE created_at < NOW() - INTERVAL '90 days';
```

**Filas estimadas:** ~50,000/día = ~18M/año (requiere particionamiento por mes)

---

## 18. Funciones de Cálculo

### Función 1: calculate_market_temperature

```sql
CREATE OR REPLACE FUNCTION calculate_market_temperature(
    p_supply INT,
    p_demand INT
) RETURNS market_temperature AS $$
DECLARE
    v_ratio DECIMAL;
BEGIN
    IF p_supply = 0 THEN
        RETURN 'insufficient_data';
    END IF;
    
    v_ratio := (p_demand - p_supply)::DECIMAL / p_supply;
    
    RETURN CASE
        WHEN v_ratio >= 0.30 THEN 'hot'
        WHEN v_ratio >= 0 THEN 'warm'
        WHEN v_ratio >= -0.20 THEN 'cool'
        ELSE 'cold'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Función 2: calculate_zone_metrics

```sql
CREATE OR REPLACE FUNCTION calculate_zone_metrics(
    p_zone_id UUID,
    p_snapshot_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
DECLARE
    v_metrics_id UUID;
BEGIN
    INSERT INTO zone_metrics (
        zone_id, snapshot_date,
        total_properties, average_price, median_price,
        price_per_m2, average_dom, market_temperature
    )
    SELECT
        p_zone_id,
        p_snapshot_date,
        COUNT(*) AS total,
        AVG(a.price_amount) AS avg_price,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY a.price_amount) AS median_price,
        AVG(a.price_amount / NULLIF(a.area_m2, 0)) AS price_m2,
        AVG(a.days_on_market) AS avg_dom,
        calculate_market_temperature(
            COUNT(*) FILTER (WHERE a.status = 'active'),
            COUNT(*) FILTER (WHERE a.status = 'sold' AND a.updated_at >= p_snapshot_date - 30)
        )
    FROM assets a
    WHERE a.zone_id = p_zone_id AND a.status IN ('active', 'sold')
    RETURNING id INTO v_metrics_id;
    
    RETURN v_metrics_id;
END;
$$ LANGUAGE plpgsql;
```

### Función 3: get_market_summary

```sql
CREATE OR REPLACE FUNCTION get_market_summary(
    p_zone_id UUID DEFAULT NULL,
    p_days INT DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT JSONB_BUILD_OBJECT(
        'total_active', COUNT(*) FILTER (WHERE a.status = 'active'),
        'total_value', SUM(a.price_amount) FILTER (WHERE a.status = 'active'),
        'avg_price', AVG(a.price_amount) FILTER (WHERE a.status = 'active'),
        'new_listings', COUNT(*) FILTER (WHERE a.created_at >= NOW() - (p_days || ' days')::INTERVAL),
        'avg_dom', AVG(a.days_on_market) FILTER (WHERE a.status = 'active'),
        'hot_zones', (
            SELECT JSONB_AGG(JSONB_BUILD_OBJECT('name', zh.name, 'temp', zm.market_temperature))
            FROM zone_metrics zm
            JOIN zone_hierarchy zh ON zh.id = zm.zone_id
            WHERE (p_zone_id IS NULL OR zm.zone_id = p_zone_id)
            AND zm.snapshot_date = (SELECT MAX(snapshot_date) FROM zone_metrics WHERE zone_id = zm.zone_id)
            ORDER BY zm.total_properties DESC
            LIMIT 5
        )
    ) INTO v_result
    FROM assets a
    WHERE (p_zone_id IS NULL OR a.zone_id = p_zone_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## 19. Vistas Materializadas

### Vista: asset_intelligence_summary

```sql
CREATE MATERIALIZED VIEW asset_intelligence_summary AS
SELECT
    a.id AS asset_id,
    a.title,
    a.price_amount,
    a.status,
    a.zone_id,
    zh.name AS zone_name,
    zh.province,
    zh.district,
    
    -- Location
    ls.overall_location_score,
    ls.accessibility_score,
    ls.convenience_score,
    ls.neighborhood_score AS location_neighborhood_score,
    
    -- Rental
    re.gross_yield,
    re.cap_rate,
    re.estimated_monthly_rent,
    re.rental_quality,
    
    -- Liquidity
    liq.liquidity_score,
    liq.exit_difficulty,
    liq.estimated_dom,
    
    -- Valuation
    val.market_value,
    val.conservative_value,
    val.optimistic_value,
    val.valuation_discount,
    val.margin_of_error,
    
    -- Neighborhood
    np.investment_rating AS neighborhood_rating,
    np.composite_score AS neighborhood_score,
    np.risk_level,
    
    -- Classification
    ic.primary_category,
    ic.primary_confidence,
    
    -- Opportunity (existente)
    op.score AS opportunity_score,
    op.decision AS opportunity_decision,
    
    -- Calculated values
    CASE 
        WHEN val.market_value > 0 THEN 
            ROUND(((val.market_value - a.price_amount) / val.market_value * 100)::DECIMAL, 1)
        ELSE 0 
    END AS implied_discount,
    
    CURRENT_TIMESTAMP AS refreshed_at
    
FROM assets a
LEFT JOIN zone_hierarchy zh ON zh.id = a.zone_id
LEFT JOIN location_scores ls ON ls.asset_id = a.id
LEFT JOIN rental_estimates re ON re.asset_id = a.id
LEFT JOIN liquidity_scores liq ON liq.asset_id = a.id
LEFT JOIN valuation_estimates val ON val.asset_id = a.id
LEFT JOIN neighborhood_profiles np ON np.zone_id = a.zone_id
LEFT JOIN investment_classifications ic ON ic.asset_id = a.id
LEFT JOIN opportunity_scores op ON op.asset_id = a.id
WHERE a.status = 'active';

CREATE UNIQUE INDEX idx_ais_asset ON asset_intelligence_summary(asset_id);
CREATE INDEX idx_ais_zone ON asset_intelligence_summary(zone_id);
CREATE INDEX idx_ais_score ON asset_intelligence_summary(opportunity_score DESC);
CREATE INDEX idx_ais_discount ON asset_intelligence_summary(implied_discount DESC);
CREATE INDEX idx_ais_decision ON asset_intelligence_summary(opportunity_decision);
CREATE INDEX idx_ais_rating ON asset_intelligence_summary(neighborhood_rating);
CREATE INDEX idx_ais_category ON asset_intelligence_summary(primary_category);
```

---

## 20. Resumen Completo

### Tablas: 16

| # | Tabla | Propósito | Filas Est. | Tipo |
|---|-------|-----------|-----------|------|
| 1 | zone_hierarchy | Jerarquía geográfica | ~500 | Maestra |
| 2 | zone_metrics | Métricas de mercado por zona | ~182K/año | Series |
| 3 | point_of_interest | Puntos de interés | ~5,000 | Maestra |
| 4 | location_scores | Scores de ubicación | = assets | Métrica |
| 5 | location_score_components | Componentes de location score | ×6 | Detalle |
| 6 | rental_estimates | Estimaciones de renta | = assets | Métrica |
| 7 | liquidity_scores | Scores de liquidez | = assets | Métrica |
| 8 | valuation_estimates | Valuaciones con intervalo | = assets | Métrica |
| 9 | valuation_comparables_used | Comparables de valuación | ×10-15 | Detalle |
| 10 | asset_versions | Versionado de activos | ×15 | Histórica |
| 11 | asset_timeline_events | Timeline de eventos | ×30 | Histórica |
| 12 | neighborhood_profiles | Perfiles de zona | ~500 | Métrica |
| 13 | trend_signals | Señales de mercado | ~2,500 | Series |
| 14 | investment_classifications | Clasificaciones de inversión | = assets | Métrica |
| 15 | market_snapshots | Snapshots semanales | 52/año | Series |
| 16 | calculation_log | Log de auditoría | ~50K/día | Auditoría |

### Índices: 45

| Tabla | Índices | Propósito |
|-------|---------|-----------|
| zone_hierarchy | 5 | PK, parent, slug, type, trgm |
| zone_metrics | 4 | Zone+date, date, temp, latest |
| point_of_interest | 5 | Category, zone, category+zone, gist, verified |
| location_scores | 3 | Asset, overall, calculated |
| location_score_components | 2 | Score parent, category |
| rental_estimates | 3 | Asset, yield, quality |
| liquidity_scores | 3 | Asset, score, zone |
| valuation_estimates | 4 | Asset, value, discount, errors |
| valuation_comparables_used | 3 | Valuation, comparable, similarity |
| asset_versions | 3 | Asset+ver, current, valid |
| asset_timeline_events | 3 | Asset+date, asset+type, date |
| neighborhood_profiles | 4 | Zone (unique), rating, composite, type |
| trend_signals | 4 | Zone, type, active, detected |
| investment_classifications | 4 | Asset, category, confidence, asset+cat |
| market_snapshots | 2 | Date, temperature |
| calculation_log | 6 | Engine, asset, zone, status, date, correlation |
| asset_intelligence_summary (MV) | 5 | Asset, zone, score, discount, decision, rating, category |

**Total: 45 índices + 5 MV indexes = 50 estructuras de índice**

### ENUMs: 8

zone_type, market_temperature, trend_signal_type, investment_category,
timeline_event_type, calculation_status, investment_rating, rental_quality

### Funciones: 3

calculate_market_temperature, calculate_zone_metrics, get_market_summary

### Vistas Materializadas: 1

asset_intelligence_summary

---

## 21. Migración SQL

El archivo `migrations/003_data_intelligence_schema.sql` contendrá la migración completa con:
1. Creación de tipos ENUM
2. Creación de tablas (1-16)
3. Creación de índices (45)
4. Creación de funciones (3)
5. Creación de vista materializada (1)
6. Permisos RLS
7. Triggers de actualización automática

---

**Fin del documento de Schema — Siguiente: DATA_INTELLIGENCE_API.md**
