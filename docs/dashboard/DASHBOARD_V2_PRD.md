# Dashboard V2: Geospatial Intelligence Center — PRD

**Versión:** 2.0  
**Estado:** BORRADOR PARA APROBACIÓN  
**Fecha:** 2026-07-06  
**Plataforma:** Hermes Opportunity Intelligence Platform (HOIE)

---

## 1. Visión y Objetivos

El Dashboard V2 transforma el dashboard actual en un **Centro de Inteligencia Geoespacial** para inversionistas. La experiencia debe ser comparable a plataformas como Palantir, Zillow, Redfin, Costar y ArcGIS Dashboard.

### Principio rector

> **El mapa es el elemento central de la plataforma.** Todo gira alrededor del mapa — no es un complemento.

### Objetivo de negocio

El usuario debe poder responder inmediatamente:

1. ¿Dónde están las mejores oportunidades?
2. ¿Qué propiedades debo comprar hoy?
3. ¿Por qué Hermes recomienda esa propiedad?
4. ¿Cuál es el potencial de ganancia?
5. ¿Qué zonas están creciendo?
6. ¿Qué zonas presentan mayor riesgo?
7. ¿Qué fuentes están generando las mejores oportunidades?

---

## 2. Personas

### 2.1 Inversionista (Usuario Principal)

- **Perfil:** Inversionista inmobiliario en Panamá, nivel medio-alto
- **Necesidades:** Identificar oportunidades, evaluar riesgos, comparar propiedades, tomar decisiones de compra
- **Conocimiento:** Entiende precios, ROI, ubicaciones, pero no quiere hacer análisis manual
- **Tiempo:** Quiere respuestas en segundos, no minutos

### 2.2 Administrador (Usuario Técnico)

- **Perfil:** Operador de la plataforma HOIE
- **Necesidades:** Monitorear scrapers, pipeline, base de datos, errores, performance
- **Conocimiento:** Técnico, entiende logs y métricas
- **Acceso:** Panel técnico exclusivo, no visible para inversionistas

---

## 3. Preguntas que el Usuario debe Responder

| # | Pregunta | Componente que la responde |
|---|----------|---------------------------|
| 1 | ¿Dónde están las mejores oportunidades? | Mapa con heatmap + marcadores color/tamaño |
| 2 | ¿Qué propiedades debo comprar hoy? | Filtro BUY_NOW + tabla inteligente ordenada por score |
| 3 | ¿Por qué Hermes recomienda esa propiedad? | Panel de detalles → Explainability |
| 4 | ¿Cuál es el potencial de ganancia? | Panel de detalles → ROI + valor estimado + descuento |
| 5 | ¿Qué zonas están creciendo? | Market Dashboard por provincia + ZonePolygon |
| 6 | ¿Qué zonas presentan mayor riesgo? | ZonePolygon + heatmap de riesgo |
| 7 | ¿Qué fuentes generan mejores oportunidades? | Market Dashboard + tabla con columna Fuente |

---

## 4. Features por Prioridad (MoSCoW)

### Must Have (MVP)

- M1. Mapa inteligente centrado en Panamá (MapLibre GL JS)
- M2. Marcadores con color según decisión y tamaño según valor
- M3. Header ejecutivo con KPIs en tiempo real
- M4. Panel de detalles con expediente completo
- M5. Comparables transparentes
- M6. Explainability (razones, no etiquetas)
- M7. Filtros inteligentes con actualización en tiempo real
- M8. Tabla inteligente con ordenar, filtrar, exportar
- M9. Responsive (desktop, laptop, tablet, mobile)
- M10. Tema oscuro profesional

### Should Have

- S1. Dashboard de mercado por provincia
- S2. Dashboard técnico (admin only)
- S3. Popup inteligente en hover de marcador
- S4. Capas del mapa toggleables

### Could Have

- C1. Heatmap de concentración de oportunidades
- C2. Polígonos inteligentes con métricas por zona
- C3. Slider temporal (timeline 2024-2026)
- C4. Clustering de marcadores para miles de assets

### Won't Have (V2 launch)

- W1. Mapa de Google Maps (por costos)
- W2. Machine learning en el frontend
- W3. Notificaciones push
- W4. Chat entre usuarios
- W5. Modo claro (el tema oscuro es el estándar)

---

## 5. Mapa Inteligente (M1) — Must

### Descripción

El mapa de Panamá ocupa el 60-70% del ancho del dashboard en escritorio. Es el primer elemento que ve el usuario.

### Funcionalidades

- Centrado en Panamá (lat: 8.9824, lng: -79.5199, zoom: 10)
- Tiles: estilo oscuro (MapTiler dark o CartoDB dark matter — gratis)
- Marcadores: un punto por asset activo con coordenadas
- Zoom: de nivel calle (16) a nivel país (7)
- Pan: libre, con lazy load de tiles
- Capas base: una sola (dark theme)

### Criterios de aceptación

- [ ] El mapa carga en <2 segundos
- [ ] Muestra todos los assets con coordenadas como marcadores
- [ ] El zoom es fluido (60fps)
- [ ] El mapa se redimensiona correctamente al cambiar el tamaño de ventana

---

## 6. Header Ejecutivo con KPIs (M3) — Must

### Descripción

Barra superior de 60px con métricas clave siempre visibles.

### KPIs a mostrar

| KPI | Fuente de datos |
|-----|-----------------|
| Total de activos | `v_dashboard_summary.total_active_assets` |
| Oportunidades detectadas (BUY_NOW + WATCH_HIGH) | Suma de counts |
| BUY NOW | `v_dashboard_summary.buy_now_count` |
| NEGOTIATE | `v_dashboard_summary.negotiate_count` |
| WATCH | `v_dashboard_summary.watch_count` |
| AVOID | `v_dashboard_summary.avoid_count` |
| ROI promedio | Calculado desde `capital_recommendation.expected_roi_year1` |
| Confidence promedio | `v_dashboard_summary.avg_confidence` |
| Última actualización | `MAX(assets.scraped_at)` |
| Estado de scrapers | `sources.is_active` count |
| Estado de Supabase | Ping conectividad |

### Criterios de aceptación

- [ ] Todos los KPIs se cargan en <1 segundo
- [ ] Los datos se actualizan en tiempo real (Supabase realtime)
- [ ] El header es responsive (colapsa a 2 filas en mobile)

---

## 7. Panel de Detalles (M4) — Must

### Descripción

Panel lateral derecho (360px) que muestra el expediente completo del asset seleccionado.

### Secciones

1. **Foto principal + galería** — thumbnails clickeables, lazy load
2. **Ubicación** — provincia, distrito, corregimiento, neighborhood + mini mapa
3. **Precio** — precio de lista, valor estimado, descuento %
4. **ROI esperado** — `capital_recommendation.expected_roi_year1`
5. **Comparables** — ver sección 8
6. **Historial de precios** — `asset_events` WHERE event_type='price_change'
7. **Confidence** — `opportunity_scores.confidence`
8. **Explicación del Score** — ver sección 9
9. **Decision Engine** — `investment_decisions.thesis_text`, `investment_profile`, `urgency_level`
10. **Seller Analysis** — `seller_type`, `owner_name`
11. **Risk Analysis** — `risk_factors` JSONB
12. **Market Trend** — por zona (si zone_metrics existe) o "Datos insuficientes"
13. **Fuente original** — link al listing original + nombre del source

### Botones

- "Ver publicación original ↗" — abre `source_listing_url` en nueva pestaña
- "Abrir expediente completo" — expande todas las secciones colapsadas

### Criterios de aceptación

- [ ] Panel se carga en <500ms al seleccionar un asset
- [ ] Todas las secciones están presentes (aunque sea "Sin datos")
- [ ] La galería de fotos usa lazy load
- [ ] El mini mapa muestra la ubicación del asset

---

## 8. Comparables Transparentes (M5) — Must

### Descripción

Lista de comparables utilizados por Hermes para evaluar el asset. **Transparencia total** — el CTO exige que Hermes no oculte esta información.

### Datos por comparable

| Campo | Fuente |
|-------|--------|
| Foto | `comp_asset.raw_data.photos[0]` o placeholder |
| Precio | `comparisons.price` |
| Distancia | `comparisons.distance_km` |
| Área | `comp_asset.raw_data.area_m2` |
| Habitaciones | `comp_asset.raw_data.bedrooms` |
| Fecha | `comparisons.age_days` (calculado) |
| Peso utilizado | `comparisons.quality_score` (0-1) |
| Quality Score | `comparisons.quality_score` |
| Razón de match | `comparisons.match_reason` |

### Query

```sql
SELECT c.*, a.title, a.price_amount, a.raw_data, a.source_listing_url
FROM comparisons c
JOIN assets a ON c.comp_asset_id = a.asset_id
WHERE c.asset_id = $1
ORDER BY c.quality_score DESC
```

### Criterios de aceptación

- [ ] Muestra TODOS los comparables (no solo top 3)
- [ ] Cada comparable es clickable → navega a ese asset en el mapa
- [ ] Si no hay comparables, muestra "Sin comparables disponibles"

---

## 9. Explainability (M6) — Must

### Descripción

**Eliminar respuestas tipo "BUY", "AVOID", "WATCH".** Mostrar explicación transparente con razones concretas.

### Formato

Lista de razones con checkmarks (✔) o crossmarks (✘):

```
✔ Precio 18% debajo del mercado
✔ Zona con crecimiento anual de 9%
✔ Confidence 91%
✔ Comparables de alta calidad (Quality Score: 0.85)
✔ Vendedor redujo precio tres veces
✔ Riesgo legal bajo
✔ Alta liquidez (DOM promedio: 45 días)
```

o

```
✘ Precio 5% sobre el mercado
✘ Zona con crecimiento estancado (0.3%)
✘ Confidence 42%
✘ Comparables de baja calidad (Quality Score: 0.31)
✘ Sin reducciones de precio
✘ Riesgo legal moderado
```

### Fuente de datos

Cada razón se genera desde `opportunity_scores.components`:

| Componente | Razón si score > 0.7 | Razón si score < 0.4 |
|-----------|---------------------|---------------------|
| price_vs_estimated_value | "Precio X% debajo del mercado" | "Precio X% sobre el mercado" |
| comparables_analysis | "Comparables de alta calidad" | "Comparables de baja calidad" |
| location_quality | "Ubicación premium" | "Ubicación deficiente" |
| market_trend | "Zona con crecimiento anual de X%" | "Zona con crecimiento estancado" |
| exit_strategy | "Estrategia de salida clara" | "Estrategia de salida incierta" |
| liquidity | "Alta liquidez (DOM: X días)" | "Baja liquidez (DOM: X días)" |
| seller_motivation | "Vendedor motivado (X reducciones)" | "Vendedor sin motivación" |
| risk_assessment | "Riesgo legal bajo" | "Riesgo legal alto" |
| rental_potential | "Alto potencial de alquiler" | "Bajo potencial de alquiler" |

### Criterios de aceptación

- [ ] Muestra mínimo 3 razones (✔ o ✘)
- [ ] Cada razón incluye datos cuantitativos (%, días, score)
- [ ] No muestra etiquetas simples (BUY/AVOID/WATCH)
- [ ] El tono es informativo, no persuasivo

---

## 10. Dashboard de Mercado por Provincia (S1) — Should

### Descripción

Sección con indicadores de mercado agrupados por provincia.

### Indicadores por provincia

| Indicador | Fuente |
|-----------|--------|
| Precio promedio | `AVG(assets.price_amount) GROUP BY province` |
| ROI promedio | `AVG(capital_recommendation.expected_roi_year1)` |
| Tiempo promedio de venta | `AVG(asset_events)` o "N/D" |
| Market Trend | `hot/warm/cool/cold` (calculado) |
| Cantidad de activos | `COUNT(*)` |
| Opportunity Density | `(BUY_NOW count) / (área km²)` |
| Confidence promedio | `AVG(opportunity_scores.confidence)` |

### Criterios de aceptación

- [ ] Muestra las 9 provincias principales de Panamá
- [ ] Click en provincia → filtra mapa + tabla
- [ ] Datos actualizados en tiempo real

---

## 11. Dashboard Técnico (S2) — Should

### Descripción

Panel exclusivo para administradores. No visible para usuarios finales.

### Métricas

| Métrica | Fuente |
|---------|--------|
| Estado de Scrapers | `sources.is_active` |
| Estado Pipeline | `pipeline_runs.status` (latest) |
| Estado Supabase | Ping |
| Logs recientes | `pipeline_runs.error_log` |
| Errores | `pipeline_runs.errors_count` |
| Tiempo promedio scraping | `AVG(pipeline_runs.duration_ms)` |
| Assets procesados | `pipeline_runs.assets_scraped` |
| Pipeline Runs | `pipeline_runs` tabla |
| Uso de CPU | N/D (requiere backend) |
| Uso de memoria | N/D (requiere backend) |
| Latencia | tiempo de respuesta de queries |

### Criterios de aceptación

- [ ] Toggle modo admin requerido (no visible por defecto)
- [ ] Muestra últimos 50 pipeline runs
- [ ] Logs expandibles (error_log JSONB)
- [ ] Solo accesible con rol admin (Supabase Auth)

---

## 12. Filtros Inteligentes (M7) — Must

### Descripción

Sidebar izquierdo (240px) con filtros dinámicos que actualizan el mapa y la tabla en tiempo real.

### Filtros

| Filtro | Tipo | Fuente |
|--------|------|--------|
| Provincia | Dropdown | `DISTINCT location->>'province'` |
| Distrito | Dropdown (dependiente de provincia) | `DISTINCT location->>'district'` |
| Corregimiento | Dropdown (dependiente de distrito) | `DISTINCT location->>'corregimiento'` |
| Tipo | Multi-select | `raw_data->>'property_type'` |
| Precio | Range slider (min/max) | `price_amount` |
| Área | Range slider | `raw_data->>'area_m2'` |
| Habitaciones | Multi-select (1,2,3,4,5+) | `raw_data->>'bedrooms'` |
| Fuente | Multi-select | `sources.display_name` |
| Opportunity Score | Range slider (0-100) | `final_score` |
| ROI | Range slider | `capital_recommendation.expected_roi_year1` |
| Confidence | Range slider (0-100) | `confidence` |
| Riesgo | Dropdown (bajo/medio/alto) | Calculado desde `risk_factors` |
| Acción | Multi-select | `recommended_action` |
| Banco | Dropdown | Solo si source es banco |
| Fecha | Date range | `scraped_at` |

### Criterios de aceptación

- [ ] Debounce de 300ms antes de actualizar
- [ ] Filtros encadenados (provincia → distrito → corregimiento)
- [ ] Chips removibles para filtros activos
- [ ] Botón "Limpiar todo"
- [ ] Filtros persisten en URL (deep linking)

---

## 13. Tabla Inteligente (M8) — Must

### Descripción

Tabla profesional debajo del mapa.

### Columnas

| Columna | Campo | Sortable |
|---------|-------|----------|
| Score | `final_score` | ✅ |
| Acción | `recommended_action` | ✅ |
| Tipo | `raw_data->>'property_type'` | ✅ |
| Precio | `price_amount` | ✅ |
| Valor Estimado | `risk_factors.estimated_value` | ✅ |
| ROI | `capital_recommendation.expected_roi_year1` | ✅ |
| Confidence | `confidence` | ✅ |
| Riesgo | Calculado | ✅ |
| Fuente | `source_name` (via sources join) | ✅ |
| Fecha | `scraped_at` | ✅ |
| Ver Detalle | Botón | ❌ |

### Funcionalidades

- **Ordenar:** click en header (asc/desc)
- **Filtrar:** input de búsqueda global + filtros del sidebar
- **Exportar:** botón "Exportar CSV" / "Exportar JSON"
- **Buscar:** input con debounce 300ms
- **Paginación:** virtualización (@tanstack/react-virtual) para miles de filas
- **Row click:** selecciona asset → abre detail panel

### Criterios de aceptación

- [ ] Renderiza 1000+ filas sin lag (virtualización)
- [ ] Sort funciona en todas las columnas sortable
- [ ] Export genera CSV con todos los campos
- [ ] Búsqueda filtra en tiempo real

---

## 14. Slider Temporal (C3) — Could

### Descripción

Timeline 2024-2026 que permite ver la evolución del mercado.

### Funcionalidades

- Range slider con dos handles (desde/hasta)
- Play/pause para animación temporal
- Al mover → mapa muestra snapshot (filtra assets por `scraped_at`)
- Label con fecha actual del cursor

### Criterios de aceptación

- [ ] Slider cubre desde el primer asset hasta hoy
- [ ] Play anima a 1 Mes/segundo
- [ ] Mapa se actualiza sin lag

---

## 15. Heatmap y Polígonos (C1, C2) — Could

### Heatmap

- Capa de calor sobre el mapa
- Intensidad según concentración de assets con `final_score >= 70`
- Toggle on/off
- Color: gradiente azul → verde → amarillo → rojo

### Polígonos Inteligentes

- Polígonos por zona (provincia/distrito)
- Overlay con métricas: ROI promedio, liquidez, confidence, riesgo, market trend, cantidad activos, tiempo venta
- Hover → tooltip con métricas
- Click → zoom a zona + filtra

### Criterios de aceptación

- [ ] Heatmap no afecta performance del mapa
- [ ] Polígonos solo se muestran con zoom < 12
- [ ] Datos de polígonos se cachean

---

## 16. Requisitos No Funcionales (M10)

### Rendimiento

- Dashboard carga completa en <3 segundos
- Mapa con 5000 marcadores mantiene 60fps
- Filtros aplican en <200ms (client-side)
- Tabla virtualizada para 10,000+ filas

### Responsive

| Breakpoint | Layout |
|------------|--------|
| Desktop >1024px | Grid completo: Header + [Sidebar | Mapa | Detail] + Tabla |
| Laptop 768-1024px | Detail panel colapsable (overlay) |
| Tablet 768px | Filtros en bottom sheet, mapa 50vh |
| Mobile <768px | Stack vertical: header → mapa 40vh → tabla → filtros en modal |

### Optimizaciones

- Clustering de marcadores (supercluster en web worker)
- Carga progresiva de tiles del mapa
- Virtualización de lista/tabla
- Lazy loading de detail panel y comparables
- Caché de map tiles en browser
- Consultas paginadas a Supabase
- SWR para revalidación en background
- Code splitting (mapa se carga lazy)

### Diseño

- Tema oscuro profesional (inspirado en Palantir, Bloomberg Terminal, ArcGIS, Grafana, Datadog)
- Transmitir confianza y análisis profesional
- Tipografía: Inter
- Mapa ocupa 60-70% del ancho en escritorio

---

## 17. Criterios de Aceptación por Feature

### Mapa Inteligente (M1)
- [ ] Carga en <2s
- [ ] 5000 marcadores a 60fps
- [ ] Zoom/pan fluido
- [ ] Responsive

### Marcadores (M2)
- [ ] Color según acción (5 colores)
- [ ] Tamaño según precio (escala log)
- [ ] Click selecciona + abre detail

### Header (M3)
- [ ] 11 KPIs visibles
- [ ] Realtime update
- [ ] Responsive

### Detail Panel (M4)
- [ ] 13 secciones presentes
- [ ] Carga <500ms
- [ ] Botones "Ver original" + "Expediente completo"

### Comparables (M5)
- [ ] Muestra TODOS los comparables
- [ ] 8 campos por comparable
- [ ] Click navega al comparable

### Explainability (M6)
- [ ] Mínimo 3 razones
- [ ] Datos cuantitativos
- [ ] Sin etiquetas simples

### Filtros (M7)
- [ ] 15 filtros funcionales
- [ ] Debounce 300ms
- [ ] Chips removibles
- [ ] Deep linking

### Tabla (M8)
- [ ] 11 columnas
- [ ] Sort + filter + export
- [ ] Virtualización 10K+ filas

---

## 18. Out of Scope

- Google Maps (costos)
- Machine learning en frontend
- Notificaciones push
- Chat entre usuarios
- Modo claro
- App móvil nativa (web responsive es suficiente)
- Integración con CRM externo
- Pasarela de pagos
- Calculadora de hipoteca
- Tour virtual 3D

---

## 19. Dependencias y Supuestos

### Supuestos

1. Los assets tienen coordenadas en `location.coordinates` (si no, geocoding fallback)
2. Supabase RLS permite lectura anon para dashboard público
3. Las vistas `v_asset_pipeline` y `v_dashboard_summary` ya existen y funcionan
4. Los tiles de mapa dark theme están disponibles gratis (CartoDB dark matter)

### Dependencias

- MapLibre GL JS (gratis, open source)
- Supabase JS client (ya integrado)
- React 18 + TypeScript (nueva dependencia)
- Zustand (estado global)
- SWR (data fetching)
- @tanstack/react-virtual (virtualización)
- supercluster (clustering)

---

## 20. Migración desde V1

- Dashboard V1 en `/opt/data/hermes/apps/dashboard/` permanece funcionando
- Dashboard V2 se crea en `/opt/data/hermes/apps/dashboard-v2/`
- Ambos comparten el mismo Supabase backend
- Migración de configuración `.env` V1 → V2
- Deploy V2 a Coolify en subdominio
- Una vez V2 validado, V1 se marca como deprecated (no se borra)

---

**Fin del PRD — DASHBOARD_V2_PRD.md**