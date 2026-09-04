# DATA INTELLIGENCE LAYER — API Specification
## Hermes Opportunity Intelligence Platform

**Versión:** 1.0.0
**Fecha:** 2026-07-02
**Estado:** BORRADOR PARA REVISIÓN

---

## 0. Resumen

Especificación completa de endpoints de la Data Intelligence Layer.

**Total:** 40 endpoints organizados en 10 dominios

**Formato base:** `GET /api/v1/data-intelligence/{domain}/{resource}`

---

## 1. Market Intelligence API

Base: `/api/v1/data-intelligence/market`

### GET /zones
Lista todas las zonas geográficas con sus métricas actuales.

```
GET /api/v1/data-intelligence/market/zones
  ?type=neighborhood         # Filtrar por tipo (province/district/corregimiento/neighborhood)
  &parent_id=uuid           # Filtrar por zona padre
  &search=costa+del+este    # Búsqueda por nombre
  &rating=prime             # Filtrar por investment rating
  &sort=composite_score     # Ordenar por (composite_score|name|avg_price)
  &order=desc               # asc/desc
  &page=1
  &per_page=20

Response:
{
  "data": [{
    "id": "uuid",
    "name": "Costa del Este",
    "type": "neighborhood",
    "province": "Panamá",
    "district": "Panamá",
    "metrics": {
      "average_price": 425000,
      "median_price": 395000,
      "price_per_m2": 2850,
      "total_active": 145,
      "average_dom": 45,
      "market_temperature": "warm",
      "growth_yearly": 5.2
    },
    "investment_rating": "desirable",
    "composite_score": 72
  }],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 85,
    "total_pages": 5
  }
}
```

### GET /zones/{zone_id}
Obtiene perfil completo de una zona.

```
GET /api/v1/data-intelligence/market/zones/{zone_id}

Response:
{
  "id": "uuid",
  "name": "Costa del Este",
  "type": "neighborhood",
  "hierarchy": {
    "province": "Panamá",
    "district": "Panamá",
    "corregimiento": "San Francisco",
    "parent_zone": "Punta Pacífica Corredor Sur"
  },
  "metrics": {
    "price": {
      "average": 425000,
      "median": 395000,
      "per_m2": 2850,
      "per_m2_min": 1800,
      "per_m2_max": 4500,
      "distribution": {
        "p10": 220000,
        "p25": 300000,
        "p50": 395000,
        "p75": 520000,
        "p90": 680000
      }
    },
    "supply_demand": {
      "total_active": 145,
      "new_listings_7d": 8,
      "new_listings_30d": 32,
      "sold_last_30d": 12,
      "absorption_rate": 12,
      "months_of_inventory": 4.5,
      "market_temperature": "warm"
    },
    "time": {
      "average_dom": 45,
      "median_dom": 38,
      "dom_distribution": { "fast": 25, "normal": 45, "slow": 30 }
    },
    "growth": {
      "monthly": 0.8,
      "quarterly": 2.1,
      "yearly": 5.2,
      "trend": "growing"
    },
    "type_breakdown": {
      "apartment": { "count": 89, "avg_price": 380000, "avg_m2": 95 },
      "house": { "count": 32, "avg_price": 520000, "avg_m2": 220 },
      "penthouse": { "count": 18, "avg_price": 780000, "avg_m2": 180 },
      "commercial": { "count": 6, "avg_price": 450000, "avg_m2": 120 }
    }
  },
  "investment_rating": "desirable",
  "risk_level": "low",
  "classification": "premium",
  "last_calculated": "2026-07-01T02:00:00Z"
}
```

### GET /zones/{zone_id}/history
Historial de métricas de zona.

```
GET /api/v1/data-intelligence/market/zones/{zone_id}/history
  ?from=2026-01-01
  &to=2026-07-01
  &interval=daily            # daily|weekly|monthly

Response:
{
  "zone_id": "uuid",
  "history": [{
    "snapshot_date": "2026-06-01",
    "average_price": 418000,
    "median_price": 390000,
    "total_active": 138,
    "market_temperature": "warm",
    "growth_monthly": 0.5
  }, ...],
  "trends": {
    "direction": "growing",
    "strength": 0.72,
    "signals": ["market_growing", "high_demand"]
  }
}
```

### GET /zones/{zone_id}/trends
Señales de mercado activas para una zona.

```
GET /api/v1/data-intelligence/market/zones/{zone_id}/trends
  ?active_only=true

Response:
{
  "zone_id": "uuid",
  "signals": [{
    "type": "market_growing",
    "confidence": 85,
    "signal_strength": 0.72,
    "detected_at": "2026-06-15T02:00:00Z",
    "evidence": {
      "price_change_3m": 3.2,
      "price_change_6m": 5.1,
      "volume_change_3m": 12
    }
  }],
  "summary": {
    "total_active_signals": 2,
    "dominant_signal": "market_growing"
  }
}
```

### GET /market/summary
Resumen general del mercado.

```
GET /api/v1/data-intelligence/market/summary
  ?zone_id=uuid              # Opcional: filtrar por provincia/zona

Response:
{
  "total_active": 2840,
  "total_value": 1250000000,
  "average_price": 440000,
  "median_price": 385000,
  "new_listings_30d": 420,
  "sold_last_30d": 185,
  "average_dom": 52,
  "market_temperature": "warm",
  "total_zones": 85,
  "hot_zones": ["Costa del Este", "Punta Pacífica", "San Francisco"],
  "cold_zones": ["El Chorrillo", "Curundú", "Santa Ana"]
}
```

### GET /market/snapshots
Lista de snapshots de mercado guardados.

```
GET /api/v1/data-intelligence/market/snapshots
  ?limit=12

Response:
{
  "snapshots": [{
    "id": "uuid",
    "snapshot_date": "2026-06-28",
    "total_active": 2840,
    "average_price": 440000,
    "market_temperature": "warm"
  }, ...]
}
```

---

## 2. Location Intelligence API

Base: `/api/v1/data-intelligence/location`

### GET /assets/{asset_id}/scores
Obtiene scores de ubicación para un activo.

```
GET /api/v1/data-intelligence/location/assets/{asset_id}/scores

Response:
{
  "asset_id": "uuid",
  "overall_location_score": 78,
  "components": [
    { "category": "health", "score": 65, "weight": 0.10, "pois_found": 3, "radius_km": 2.0 },
    { "category": "education", "score": 82, "weight": 0.15, "pois_found": 5, "radius_km": 1.5 },
    { "category": "commerce", "score": 90, "weight": 0.20, "pois_found": 12, "radius_km": 1.0 },
    { "category": "services", "score": 70, "weight": 0.10, "pois_found": 4, "radius_km": 1.0 },
    { "category": "recreation", "score": 75, "weight": 0.15, "pois_found": 3, "radius_km": 2.0 },
    { "category": "transport", "score": 80, "weight": 0.30, "pois_found": 6, "radius_km": 0.5 }
  ],
  "derived_scores": {
    "accessibility": 82,
    "convenience": 75,
    "neighborhood": 79,
    "infrastructure": 77,
    "urban_growth": 68
  },
  "confidence": 85,
  "coordinates_quality": "verified_street_level",
  "calculated_at": "2026-07-01T12:00:00Z"
}
```

### GET /pois
Lista puntos de interés.

```
GET /api/v1/data-intelligence/location/pois
  ?category=comercio             # Filtrar por categoría
  &zone_id=uuid                 # Filtrar por zona
  &search=super                 # Búsqueda por nombre
  &verified=true                # Solo verificados
  &page=1
  &per_page=50

Response:
{
  "data": [{
    "id": "uuid",
    "name": "Super 99 Costa del Este",
    "category": "comercio",
    "subcategory": "supermercado",
    "coordinates": { "lat": 8.985, "lng": -79.525 },
    "zone": "Costa del Este",
    "rating": 4.2,
    "verified": true
  }],
  "pagination": { "page": 1, "per_page": 50, "total": 120 }
}
```

### GET /pois/{poi_id}
Detalle de un punto de interés.

```
GET /api/v1/data-intelligence/location/pois/{poi_id}

Response:
{
  "id": "uuid",
  "name": "Super 99 Costa del Este",
  "category": "comercio",
  "subcategory": "supermercado",
  "address": "Cc. Costa del Este, Local 12",
  "coordinates": { "lat": 8.985, "lng": -79.525 },
  "zone_id": "uuid",
  "zone_name": "Costa del Este",
  "phone": "+507 300-1234",
  "website": "https://super99.com",
  "rating": 4.2,
  "source": "google_maps",
  "verified": true,
  "metadata": {},
  "created_at": "2026-01-15T10:00:00Z"
}
```

---

## 3. Rental Intelligence API

Base: `/api/v1/data-intelligence/rental`

### GET /assets/{asset_id}/estimate
Obtiene estimación de rentabilidad.

```
GET /api/v1/data-intelligence/rental/assets/{asset_id}/estimate

Response:
{
  "asset_id": "uuid",
  "estimated_monthly_rent": 1800,
  "estimated_annual_rent": 21600,
  "gross_yield": 5.4,
  "net_yield": 3.8,
  "cap_rate": 3.8,
  "estimated_noi": 15120,
  "cash_flow": {
    "monthly": 450,
    "annual": 5400,
    "assumptions": {
      "down_payment_pct": 30,
      "interest_rate": 5.5,
      "loan_term_years": 30,
      "monthly_mortgage": 1200,
      "monthly_expenses": 150
    }
  },
  "vacancy_rate_estimate": 5.0,
  "time_to_rent_days": 25,
  "rental_demand_score": 72,
  "rental_quality": "good",
  "annual_return": 8.2,
  "expected_roi": 6.8,
  "zone_rental_factor": 1.15,
  "type_adjustment": 1.0,
  "calculated_at": "2026-07-01T12:00:00Z"
}
```

### GET /zones/{zone_id}/rental-metrics
Métricas de alquiler agregadas por zona.

```
GET /api/v1/data-intelligence/rental/zones/{zone_id}/rental-metrics

Response:
{
  "zone_id": "uuid",
  "zone_name": "Costa del Este",
  "avg_gross_yield": 4.8,
  "avg_cap_rate": 3.4,
  "avg_monthly_rent": 1750,
  "avg_price_to_rent_ratio": 28,
  "vacancy_rate": 5.2,
  "avg_days_to_rent": 28,
  "rental_demand_index": 72,
  "best_property_types": ["apartment", "penthouse"],
  "seasonality": {
    "peak_months": ["January", "February", "March"],
    "low_months": ["October", "November"]
  }
}
```

---

## 4. Liquidity Intelligence API

Base: `/api/v1/data-intelligence/liquidity`

### GET /assets/{asset_id}/score
Obtiene score de liquidez.

```
GET /api/v1/data-intelligence/liquidity/assets/{asset_id}/score

Response:
{
  "asset_id": "uuid",
  "liquidity_score": 72,
  "exit_difficulty": 28,
  "estimated_dom": 35,
  "zone_avg_dom": 45,
  "market_pressure": 0.22,
  "historical_velocity": 0.85,
  "rotation_rate": 8.5,
  "buyer_activity_index": 68,
  "comparable_dom_count": 25,
  "liquidity_trend": "improving",
  "factors": {
    "dom_score": 78,
    "velocity_score": 72,
    "rotation_score": 65,
    "pressure_score": 70,
    "buyer_score": 68
  }
}
```

### GET /zones/{zone_id}/liquidity
Métricas de liquidez agregadas por zona.

```
GET /api/v1/data-intelligence/liquidity/zones/{zone_id}/liquidity

Response:
{
  "zone_id": "uuid",
  "zone_name": "Costa del Este",
  "avg_liquidity_score": 68,
  "avg_exit_difficulty": 32,
  "avg_dom": 45,
  "dom_by_type": {
    "apartment": 38,
    "house": 55,
    "penthouse": 72,
    "commercial": 65
  },
  "rotation_rate": 12.5,
  "buyer_activity": "moderate",
  "market_phase": "growth"
}
```

---

## 5. Valuation Intelligence API

Base: `/api/v1/data-intelligence/valuation`

### GET /assets/{asset_id}/valuation
Obtiene valuación completa.

```
GET /api/v1/data-intelligence/valuation/assets/{asset_id}/valuation

Response:
{
  "asset_id": "uuid",
  "asset_price": 375000,
  "valuation": {
    "conservative_value": 365000,
    "market_value": 395000,
    "optimistic_value": 425000,
    "confidence_interval": 30000,
    "margin_of_error": 7.6
  },
  "valuation_discount": 5.1,
  "comparable_count": 12,
  "comparable_summary": {
    "price_min": 340000,
    "price_max": 450000,
    "price_avg": 392000,
    "price_per_m2_avg": 2750
  },
  "method_breakdown": {
    "price_per_m2": { "value": 388000, "weight": 0.35, "confidence": 80 },
    "comparable_direct": { "value": 400000, "weight": 0.30, "confidence": 75 },
    "hedonic": { "value": 392000, "weight": 0.25, "confidence": 70 },
    "zone_trend": { "value": 405000, "weight": 0.10, "confidence": 60 }
  },
  "sensitivity_analysis": [
    { "variable": "area_m2", "impact": 0.35, "description": "±10m² cambia valor en ±5.2%" },
    { "variable": "bedrooms", "impact": 0.22, "description": "±1 habitación cambia valor en ±3.8%" },
    { "variable": "comparable_count", "impact": 0.18, "description": "±3 comparables cambia confianza en ±2.1%" }
  ],
  "explanation": "Valor basado en 12 comparables de Costa del Este. Precio m² promedio de comparables: $2,750/m². La propiedad está $20,000 por debajo del valor de mercado estimado, representando un descuento del 5.1%. Se excluyeron 2 outliers (precios extremos). Alta confianza en la valuación.",
  "outlier_excluded_count": 2,
  "calculated_at": "2026-07-01T12:00:00Z"
}
```

### GET /assets/{asset_id}/valuation/comparables
Comparables usados en la valuación.

```
GET /api/v1/data-intelligence/valuation/assets/{asset_id}/valuation/comparables
  ?include_outliers=false

Response:
{
  "asset_id": "uuid",
  "comparables": [{
    "id": "uuid",
    "title": "Apartamento en Costa del Este, 2 habs",
    "price": 385000,
    "area_m2": 95,
    "price_per_m2": 2895,
    "distance_km": 0.5,
    "similarity_score": 0.92,
    "price_adjustment": 2.5,
    "adjusted_price": 394625,
    "is_outlier": false
  }, ...],
  "total_count": 12,
  "outliers_excluded": 2
}
```

### GET /assets/{asset_id}/valuation/history
Historial de valuaciones del activo.

```
GET /api/v1/data-intelligence/valuation/assets/{asset_id}/valuation/history

Response:
{
  "asset_id": "uuid",
  "valuations": [{
    "id": "uuid",
    "market_value": 395000,
    "conservative_value": 365000,
    "optimistic_value": 425000,
    "comparable_count": 12,
    "calculated_at": "2026-07-01T12:00:00Z"
  }, {
    "id": "uuid",
    "market_value": 382000,
    "conservative_value": 355000,
    "optimistic_value": 410000,
    "comparable_count": 10,
    "calculated_at": "2026-06-01T12:00:00Z"
  }]
}
```

---

## 6. Historical Intelligence API

Base: `/api/v1/data-intelligence/historical`

### GET /assets/{asset_id}/versions
Lista versiones de un activo.

```
GET /api/v1/data-intelligence/historical/assets/{asset_id}/versions
  ?page=1
  &per_page=20

Response:
{
  "asset_id": "uuid",
  "total_versions": 8,
  "versions": [{
    "version_number": 8,
    "valid_from": "2026-07-01T10:00:00Z",
    "valid_to": null,
    "is_current": true,
    "changed_fields": ["price_amount"],
    "change_reason": "price_reduction_detected",
    "created_at": "2026-07-01T10:00:00Z"
  }, {
    "version_number": 7,
    "valid_from": "2026-06-15T08:00:00Z",
    "valid_to": "2026-07-01T10:00:00Z",
    "is_current": false,
    "changed_fields": ["description"],
    "change_reason": "scraper_update",
    "created_at": "2026-06-15T08:00:00Z"
  }, ...]
}
```

### GET /assets/{asset_id}/versions/{version_number}
Obtiene snapshot de una versión específica.

```
GET /api/v1/data-intelligence/historical/assets/{asset_id}/versions/{version_number}

Response:
{
  "asset_id": "uuid",
  "version_number": 7,
  "valid_from": "2026-06-15T08:00:00Z",
  "valid_to": "2026-07-01T10:00:00Z",
  "is_current": false,
  "changed_fields": ["description"],
  "change_reason": "scraper_update",
  "snapshot": {
    "title": "Apartamento en Costa del Este",
    "price_amount": 395000,
    "description": "...versión anterior...",
    "status": "active",
    "area_m2": 95,
    "bedrooms": 2,
    "bathrooms": 2,
    "location": { "lat": 8.985, "lng": -79.525 },
    "source_id": "encuentra24",
    "source_url": "https://..."
  },
  "created_at": "2026-06-15T08:00:00Z"
}
```

---

## 7. Timeline API

Base: `/api/v1/data-intelligence/timeline`

### GET /assets/{asset_id}/timeline
Obtiene línea de tiempo de un activo.

```
GET /api/v1/data-intelligence/timeline/assets/{asset_id}/timeline
  ?event_types=price_change,classification_change

Response:
{
  "asset_id": "uuid",
  "title": "Apartamento en Costa del Este",
  "current_price": 375000,
  "initial_price": 420000,
  "lowest_price": 375000,
  "highest_price": 420000,
  "summary": {
    "total_events": 15,
    "price_reductions": 4,
    "price_increases": 1,
    "score_changes": 3,
    "decision_changes": 1,
    "total_price_change": -10.7,
    "days_on_market": 180,
    "price_trend": "declining",
    "score_trend": "improving",
    "velocity": "slow"
  },
  "events": [{
    "id": "uuid",
    "event_type": "price_reduction",
    "event_date": "2026-07-01T10:00:00Z",
    "price_before": 395000,
    "price_after": 375000,
    "score_before": 68,
    "score_after": 74,
    "decision_before": "WATCH",
    "decision_after": "BUY_NOW",
    "event_summary": "Precio reducido de $395,000 a $375,000 (5.1%↓). Score mejoró de 68 a 74.",
    "metadata": {
      "reduction_amount": 20000,
      "reduction_pct": 5.1,
      "days_since_last_change": 15
    }
  }, ...]
}
```

---

## 8. Neighborhood Intelligence API

Base: `/api/v1/data-intelligence/neighborhood`

### GET /profiles
Lista perfiles de zonas.

```
GET /api/v1/data-intelligence/neighborhood/profiles
  ?rating=prime                       # Filtrar por rating
  &zone_type=corregimiento            # Filtrar por tipo
  &search=pacific                     # Búsqueda
  &sort=composite_score               # Ordenar
  &order=desc
  &page=1
  &per_page=20

Response:
{
  "data": [{
    "zone_id": "uuid",
    "zone_name": "Costa del Este",
    "zone_type": "neighborhood",
    "composite_score": 78,
    "investment_rating": "desirable",
    "risk_level": "low",
    "classification": "premium",
    "metrics_summary": {
      "avg_price": 425000,
      "price_per_m2": 2850,
      "liquidity_score": 72,
      "avg_yield": 4.8,
      "growth_yearly": 5.2
    },
    "last_calculated": "2026-07-01T02:00:00Z"
  }],
  "pagination": { "page": 1, "per_page": 20, "total": 85 }
}
```

### GET /profiles/{zone_id}
Perfil completo de zona.

```
GET /api/v1/data-intelligence/neighborhood/profiles/{zone_id}

Response:
{
  "zone_id": "uuid",
  "zone_name": "Costa del Este",
  "zone_type": "neighborhood",
  "parent_zone": "San Francisco",
  "hierarchy": {
    "province": "Panamá",
    "district": "Panamá",
    "corregimiento": "San Francisco",
    "neighborhood": "Costa del Este"
  },
  "market": {
    "avg_price": 425000,
    "price_per_m2": 2850,
    "total_active": 145,
    "supply_demand_ratio": 1.2,
    "market_temperature": "warm",
    "avg_dom": 45
  },
  "liquidity": {
    "score": 72,
    "exit_difficulty": 28,
    "rotation_rate": 12.5,
    "buyer_activity": "high"
  },
  "rental": {
    "avg_yield": 4.8,
    "avg_cap_rate": 3.4,
    "avg_monthly_rent": 1750,
    "vacancy_rate": 5.2,
    "rental_demand": "moderate"
  },
  "growth": {
    "yearly": 5.2,
    "quarterly": 2.1,
    "monthly": 0.8,
    "trend": "growing"
  },
  "location": {
    "overall_score": 82,
    "accessibility": 85,
    "convenience": 78,
    "infrastructure": 80,
    "top_pois": [
      { "name": "Super 99 Costa del Este", "category": "comercio" },
      { "name": "Hospital Punta Pacífica", "category": "salud" }
    ]
  },
  "investment_rating": "desirable",
  "composite_score": 78,
  "risk_level": "low",
  "classification": "premium",
  "property_type_breakdown": {
    "apartment": 61,
    "house": 22,
    "penthouse": 12,
    "commercial": 5
  },
  "price_distribution": {
    "p10": 220000,
    "p25": 300000,
    "p50": 395000,
    "p75": 520000,
    "p90": 680000
  },
  "last_calculated": "2026-07-01T02:00:00Z"
}
```

---

## 9. Investment Classification API

Base: `/api/v1/data-intelligence/investment`

### GET /assets/{asset_id}/classification
Obtiene clasificación de inversión.

```
GET /api/v1/data-intelligence/investment/assets/{asset_id}/classification

Response:
{
  "asset_id": "uuid",
  "primary_classification": {
    "category": "rental_opportunity",
    "confidence": 82,
    "explanation": "Gross yield 5.4% supera umbral de 5%. Cap Rate 3.8% indica buena rentabilidad. Vacancy rate zona 5.2% bajo. Clasificado como Rental Opportunity."
  },
  "secondary_classifications": [
    {
      "category": "flip_opportunity",
      "confidence": 45,
      "explanation": "Valuación discount 5.1% no alcanza umbral 15% para flip."
    },
    {
      "category": "long_term_hold",
      "confidence": 70,
      "explanation": "Zona PRIME con crecimiento anual 5.2%. Recomendado para hold a largo plazo."
    }
  ],
  "component_scores": {
    "discount": 5.1,
    "liquidity": 72,
    "rental_yield": 5.4,
    "location": 78,
    "market_temperature": "warm",
    "neighborhood_rating": "desirable",
    "growth_yearly": 5.2
  },
  "classified_at": "2026-07-01T12:00:00Z"
}
```

### GET /assets/by-classification
Lista activos por clasificación.

```
GET /api/v1/data-intelligence/investment/assets/by-classification
  ?category=flip_opportunity
  &min_confidence=60
  &zone_id=uuid
  &sort=opportunity_score
  &order=desc
  &page=1
  &per_page=20

Response:
{
  "category": "flip_opportunity",
  "assets": [{
    "id": "uuid",
    "title": "Apartamento en Costa del Este",
    "price": 375000,
    "market_value": 395000,
    "discount": 5.1,
    "opportunity_score": 82,
    "decision": "BUY_NOW",
    "confidence": 75
  }],
  "pagination": { "page": 1, "per_page": 20, "total": 12 }
}
```

### GET /categories
Lista categorías de inversión disponibles.

```
GET /api/v1/data-intelligence/investment/categories

Response:
{
  "categories": [
    {
      "id": "flip_opportunity",
      "name": "Flip Opportunity",
      "description": "Comprar, mejorar y vender rápido con ganancia",
      "min_confidence": 60,
      "condition_summary": "Score ≥ 70, Liquidez ≥ 65, Descuento ≥ 15%"
    },
    {
      "id": "rental_opportunity",
      "name": "Rental Opportunity",
      "description": "Comprar para generar ingreso pasivo por alquiler",
      "min_confidence": 60,
      "condition_summary": "Rental Yield ≥ 5%, Cap Rate ≥ 4%, Vacancy < 10%"
    },
    ...
  ]
}
```

---

## 10. Dashboard & Aggregation API

Base: `/api/v1/data-intelligence/dashboard`

### GET /summary
Resumen agregado para dashboard principal.

```
GET /api/v1/data-intelligence/dashboard/summary

Response:
{
  "market_overview": {
    "total_active": 2840,
    "total_value": 1250000000,
    "new_listings_today": 18,
    "new_listings_week": 95,
    "average_dom": 52
  },
  "opportunities": {
    "buy_now_count": 28,
    "watch_count": 145,
    "negotiate_count": 89,
    "avoid_count": 312,
    "avg_score_buy_now": 84,
    "avg_score_watch": 72
  },
  "market_temperature": "warm",
  "top_zones": [
    { "name": "Costa del Este", "type": "neighborhood", "composite_score": 78, "temperature": "warm" }
  ],
  "recent_classifications": [
    {
      "asset_id": "uuid",
      "title": "Apartamento en Costa del Este",
      "classification": "rental_opportunity",
      "confidence": 82,
      "score": 78
    }
  ],
  "alerts": {
    "new_trend_signals": 3,
    "price_drops_today": 5,
    "new_classifications": 12
  }
}
```

### GET /assets/{asset_id}/intelligence
Obtiene toda la inteligencia disponible para un activo (endpoint compuesto).

```
GET /api/v1/data-intelligence/dashboard/assets/{asset_id}/intelligence

Response:
{
  "asset_id": "uuid",
  "title": "Apartamento en Costa del Este",
  "price": 375000,
  "status": "active",
  "market": { ... },           // Igual a GET /market/zones/{zone_id}
  "location": { ... },         // Igual a GET /location/assets/{asset_id}/scores
  "rental": { ... },           // Igual a GET /rental/assets/{asset_id}/estimate
  "liquidity": { ... },        // Igual a GET /liquidity/assets/{asset_id}/score
  "valuation": { ... },        // Igual a GET /valuation/assets/{asset_id}/valuation
  "timeline": { ... },         // Igual a GET /timeline/assets/{asset_id}/timeline?limit=10
  "classification": { ... },   // Igual a GET /investment/assets/{asset_id}/classification
  "opportunity": {
    "score": 82,
    "decision": "BUY_NOW",
    "confidence": 75
  },
  "refreshed_at": "2026-07-01T12:00:00Z"
}
```

### GET /export/{format}
Exporta datos de inteligencia.

```
GET /api/v1/data-intelligence/dashboard/export/json
  ?zone_id=uuid
  &classification=rental_opportunity
  &min_score=60

Response:
JSON array con todos los activos + inteligencia completa
(Soporta: json, csv)
```

### GET /alerts
Alertas activas de inteligencia.

```
GET /api/v1/data-intelligence/dashboard/alerts
  ?type=trend
  &since=2026-06-30

Response:
{
  "alerts": [{
    "type": "new_trend_signal",
    "zone": "Costa del Este",
    "signal": "market_growing",
    "confidence": 85,
    "detected_at": "2026-07-01T02:00:00Z",
    "summary": "Costa del Este muestra crecimiento sostenido: +3.2% en 3 meses"
  }, {
    "type": "price_drop",
    "asset_id": "uuid",
    "title": "Apartamento en Costa del Este",
    "drop_amount": 20000,
    "drop_pct": 5.1,
    "new_score": 82,
    "new_decision": "BUY_NOW",
    "detected_at": "2026-07-01T10:00:00Z"
  }]
}
```

---

## 11. System API

Base: `/api/v1/data-intelligence/system`

### POST /recalculate/{engine}
Fuerza recálculo de un engine para activos/zonas.

```
POST /api/v1/data-intelligence/system/recalculate/{engine}
Body:
{
  "asset_ids": ["uuid1", "uuid2"],    // Opcional: activos específicos
  "zone_ids": ["uuid3"],              // Opcional: zonas específicas
  "force": true                        // Ignorar cache
}

Response:
{
  "job_id": "uuid",
  "engine": "valuation_intelligence",
  "assets_queued": 15,
  "estimated_duration_seconds": 45,
  "status": "queued"
}
```

### GET /status
Estado de todos los engines.

```
GET /api/v1/data-intelligence/system/status

Response:
{
  "engines": [
    {
      "id": "market_intelligence",
      "version": "1.0.0",
      "status": "operational",
      "last_run": "2026-07-02T02:00:00Z",
      "total_calculations": 12450,
      "average_performance_ms": 45,
      "error_rate_last_hour": 0,
      "cache_hit_rate": 0.72
    },
    ...
  ],
  "system": {
    "last_snapshot": "2026-06-28T02:00:00Z",
    "total_assets_tracked": 2840,
    "total_calculations_today": 1580,
    "average_pipeline_duration_ms": 3200
  }
}
```

### GET /health
Health check de la Data Intelligence Layer.

```
GET /api/v1/data-intelligence/system/health

Response:
{
  "status": "healthy",
  "version": "1.0.0",
  "engines": {
    "market_intelligence": { "status": "healthy", "last_run": "2026-07-02T02:00:00Z" },
    "location_intelligence": { "status": "healthy", "last_run": "2026-07-02T01:30:00Z" },
    "rental_intelligence": { "status": "degraded", "message": "Zone factor table incomplete for 3 zones", "last_run": "2026-07-02T01:30:00Z" },
    "liquidity_intelligence": { "status": "healthy", "last_run": "2026-07-02T01:30:00Z" },
    "valuation_intelligence": { "status": "healthy", "last_run": "2026-07-02T01:00:00Z" },
    "historical_intelligence": { "status": "healthy", "last_run": "2026-07-02T00:00:00Z" },
    "timeline_engine": { "status": "healthy", "last_run": "2026-07-02T00:00:00Z" },
    "neighborhood_intelligence": { "status": "healthy", "last_run": "2026-07-02T02:00:00Z" },
    "market_trend_engine": { "status": "healthy", "last_run": "2026-07-02T02:00:00Z" },
    "investment_intelligence": { "status": "healthy", "last_run": "2026-07-02T01:30:00Z" }
  },
  "cache": { "status": "healthy", "hit_rate": 0.72 },
  "database": { "status": "healthy", "connections": 12, "pool_usage": 24 }
}
```

---

## 12. API Summary

### Total: 40 endpoints

| # | Dominio | Endpoint | Método | Propósito |
|---|---------|----------|--------|-----------|
| 1 | Market | `/zones` | GET | Lista zonas |
| 2 | Market | `/zones/{id}` | GET | Perfil zona |
| 3 | Market | `/zones/{id}/history` | GET | Historial zona |
| 4 | Market | `/zones/{id}/trends` | GET | Señales zona |
| 5 | Market | `/market/summary` | GET | Resumen mercado |
| 6 | Market | `/market/snapshots` | GET | Snapshots |
| 7 | Location | `/assets/{id}/scores` | GET | Scores ubicación |
| 8 | Location | `/pois` | GET | Lista POIs |
| 9 | Location | `/pois/{id}` | GET | Detalle POI |
| 10 | Rental | `/assets/{id}/estimate` | GET | Est. renta |
| 11 | Rental | `/zones/{id}/rental-metrics` | GET | Métricas alquiler zona |
| 12 | Liquidity | `/assets/{id}/score` | GET | Score liquidez |
| 13 | Liquidity | `/zones/{id}/liquidity` | GET | Liquidez zona |
| 14 | Valuation | `/assets/{id}/valuation` | GET | Valuación completa |
| 15 | Valuation | `/assets/{id}/valuation/comparables` | GET | Comparables usados |
| 16 | Valuation | `/assets/{id}/valuation/history` | GET | Historial valuaciones |
| 17 | Historical | `/assets/{id}/versions` | GET | Lista versiones |
| 18 | Historical | `/assets/{id}/versions/{v}` | GET | Snapshot versión |
| 19 | Timeline | `/assets/{id}/timeline` | GET | Línea de tiempo |
| 20 | Neighborhood | `/profiles` | GET | Lista perfiles zona |
| 21 | Neighborhood | `/profiles/{id}` | GET | Perfil zona completo |
| 22 | Investment | `/assets/{id}/classification` | GET | Clasificación inversión |
| 23 | Investment | `/assets/by-classification` | GET | Activos por clasif. |
| 24 | Investment | `/categories` | GET | Categorías disponibles |
| 25 | Dashboard | `/summary` | GET | Resumen dashboard |
| 26 | Dashboard | `/assets/{id}/intelligence` | GET | Todo inteligencia activo |
| 27 | Dashboard | `/export/{format}` | GET | Exportación datos |
| 28 | Dashboard | `/alerts` | GET | Alertas activas |
| 29 | System | `/recalculate/{engine}` | POST | Forzar recálculo |
| 30 | System | `/status` | GET | Estado engines |
| 31 | System | `/health` | GET | Health check |

**Total: 31 endpoints únicos** (GET 30, POST 1)

---

## 13. Plan de Integración con Opportunity Engine

### 13.1 Flujo de Integración

```
┌─────────────────────────────────────────────────────────────────────┐
│                  INTEGRATION ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌───────────────────┐     ┌──────────────┐  │
│  │ Data Intel   │────▶│ Opportunity       │────▶│ Decision      │  │
│  │ Layer        │     │ Engine            │     │ Engine        │  │
│  │              │     │                   │     │              │  │
│  │ Produce:     │     │ Consume:          │     │ Consume:     │  │
│  │ - ZoneMetrics│     │ - locationScore   │     │ - score      │  │
│  │ - LocationS  │     │ - marketTemp      │     │ - decision   │  │
│  │ - RentalEst  │     │ - rentalYield     │     │ - confidence │  │
│  │ - Liquidity  │     │ - liquidityScore  │     │ - metrics    │  │
│  │ - Valuation  │     │ - valuationDisc   │     │              │  │
│  │ - Classif.   │     │ - classif.        │     │              │  │
│  └──────────────┘     └───────────────────┘     └──────────────┘  │
│                           │                       │                 │
│                           ▼                       ▼                 │
│                    ┌──────────────────────────────────────────┐     │
│                    │         Supabase / PostgreSQL              │     │
│                    │  7 existing + 16 new tables               │     │
│                    └──────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 13.2 Integration Points

| Punto | Trigger | Data Intel Produce | Opportunity Engine Consume |
|-------|---------|-------------------|---------------------------|
| **1. Ingestion** | asset.ingested | ZoneMetrics (precio prom, m², temp, tendencia* | `marketContext` (disponible vía Service) |
| **2. Location** | asset.enriched | LocationScores (overall, confianza) | `locationBonus` (feature adicional) |
| **3. Rental** | asset.analyzed | RentalEstimate (yield, cap rate, quality) | `rentalBonus` (feature adicional) |
| **4. Liquidity** | asset.analyzed | LiquidityScore (score, exit difficulty) | `liquidityBonus` (feature adicional) |
| **5. Valuation** | asset.analyzed | ValuationEstimate (discount, confianza) | `valuationDiscount` (reemplaza descuento genérico) |
| **6. Classification** | asset.intelligence_ready | InvestmentClassification (tipo, confianza) | `investmentCategory` (peso en decisión) |
| **7. Neighborhood** | batch (diario) | NeighborhoodProfile (rating, score) | `neighborhoodQuality` (factor contextual) |

### 13.3 Código de Integración

```typescript
// apps/hoie-agent/src/pipeline/data-intelligence-adapter.ts

interface DataIntelligenceInput {
  location: LocationScores;
  market: ZoneMetrics;
  rental: RentalEstimate;
  liquidity: LiquidityScore;
  valuation: ValuationEstimate;
  classification: InvestmentClassification;
  neighborhood: NeighborhoodProfile;
}

class DataIntelligenceAdapter {
  constructor(
    private readonly cacheService: CacheService,
    private readonly dbClient: SupabaseClient
  ) {}

  async getIntelligenceForAsset(assetId: string): Promise<DataIntelligenceInput | null> {
    const cacheKey = `di:asset:${assetId}`;
    
    // Cache check
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached as DataIntelligenceInput;
    
    // Parallel fetch from all engines
    const [location, market, rental, liquidity, valuation, classification, neighborhood] = 
      await Promise.all([
        this.getLocationScores(assetId),
        this.getZoneMetricsForAsset(assetId),
        this.getRentalEstimate(assetId),
        this.getLiquidityScore(assetId),
        this.getValuation(assetId),
        this.getClassification(assetId),
        this.getNeighborhoodForAsset(assetId),
      ]);
    
    const result: DataIntelligenceInput = {
      location, market, rental, liquidity, valuation, classification, neighborhood
    };
    
    // Cache for 1 hour
    await this.cacheService.set(cacheKey, result, 3600);
    return result;
  }

  async integrateIntoScoring(
    asset: Asset,
    currentScore: OpportunityScore
  ): Promise<EnhancedScoreResult> {
    const intelligence = await this.getIntelligenceForAsset(asset.id);
    if (!intelligence) {
      return { score: currentScore, enhanced: false };
    }
    
    const enhancedScore = calculateEnhancedScore({
      discount: asset.originalDiscount ?? 0,
      sellerType: asset.sellerType ?? 'owner',
      comparableCount: asset.comparableCount ?? 0,
      locationScore: intelligence.location?.overall_location_score ?? 50,
      marketTemperature: intelligence.market?.market_temperature ?? 'cool',
      rentalYield: (intelligence.rental?.gross_yield ?? 0) / 100,
      liquidityScore: intelligence.liquidity?.liquidity_score ?? 50,
      valuationConfidence: 100 - (intelligence.valuation?.margin_of_error ?? 50),
      historicalTrend: 'stable',
      investmentType: intelligence.classification?.primary_category ?? 'long_term_hold',
    });
    
    const enhancedConfidence = calculateEnhancedConfidence({
      ...asset,
      locationScore: intelligence.location?.overall_location_score ?? 50,
      valuationConfidence: 100 - (intelligence.valuation?.margin_of_error ?? 50),
      liquidityScore: intelligence.liquidity?.liquidity_score ?? 0,
      historicalTrend: 'stable',
    });
    
    return {
      score: { ...currentScore, score: enhancedScore, confidence: enhancedConfidence },
      enhanced: true,
      usedIntelligence: {
        location: true,
        market: true,
        rental: !!intelligence.rental,
        liquidity: true,
        valuation: true,
        classification: true,
      }
    };
  }
}
```

### 13.4 Pipeline Integration Flow

```
pipeline.mjs (existente)
  │
  ├─ 1. Scrape → normalize
  ├─ 2. Data Intelligence Pipeline (NUEVO)
  │     ├─ market_intelligence_step
  │     ├─ location_intelligence_step
  │     ├─ valuation_step
  │     ├─ rental_step
  │     ├─ liquidity_step
  │     ├─ historical_step
  │     └─ investment_step
  ├─ 3. Opportunity Engine (MEJORADO)
  │     └─ Usa DataIntelligenceAdapter
  ├─ 4. Decision Engine (MEJORADO)
  │     └─ Usa classification + liquidity + neighborhood
  └─ 5. Dashboard / Save (MEJORADO)
        └─ Incluye todas las métricas
```

### 13.5 Flag de Versión

Para mantener compatibilidad hacia atrás durante el desarrollo:

```typescript
// Permitir usar scoring legacy vs enhanced
const SCORING_VERSION = process.env.SCORING_VERSION || 'v2'; // v1 = legacy, v2 = enhanced

async function getScoringVersion(): Promise<'v1' | 'v2'> {
  if (SCORING_VERSION === 'v2' && await isDataIntelligenceAvailable()) {
    return 'v2';
  }
  return 'v1';
}
```

---

**Fin del documento de API — Siguiente: DATA_INTELLIGENCE_ROADMAP.md**
