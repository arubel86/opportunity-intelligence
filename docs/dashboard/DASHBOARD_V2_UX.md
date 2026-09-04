# Dashboard V2: Diseño UX

**Versión:** 2.0
**Estado:** BORRADOR PARA APROBACIÓN
**Fecha:** 2026-07-06
**Plataforma:** Hermes Opportunity Intelligence Platform (HOIE)

---

## 1. Principios de Diseño

### Claridad
- Cada pixel tiene propósito. Sin elementos decorativos sin función.
- Información jerárquica: lo más importante primero.

### Transparencia
- Hermes es transparente: muestra comparables, razones, pesos, quality scores.
- No oculta datos detrás de tabs o modales innecesarios.

### Velocidad
- El usuario responde sus preguntas en segundos, no minutos.
- Filtros y selección son instantáneos (debounce 300ms max).

### Confianza profesional
- El diseño transmite análisis serio, no un juguete.
- Tema oscuro profesional inspirado en Palantir, Bloomberg Terminal, ArcGIS, Grafana, Datadog.

---

## 2. Paleta de Colores

### Evolución desde V1 (no ruptura)

| Token | V1 | V2 | Cambio |
|-------|----|----|--------|
| --bg-base | `#0f1117` | `#0a0e14` | Más oscuro (mayor contraste) |
| --bg-surface | `#161b22` | `#111824` | Tinte azulado (profesional) |
| --bg-elevated | — | `#1a2230` | Nuevo: para dropdowns, popups |
| --bg-hover | `#1c2128` | `#1e2a3a` | Azulado |
| --border | `#30363d` | `#2a3441` | Azulado sutil |
| --border-subtle | `#21262d` | `#1e2530` | Azulado |
| --text-primary | `#e1e4e8` | `#e2e8f0` | Más cálido |
| --text-secondary | `#8b949e` | `#94a3b8` | Slate |
| --text-tertiary | — | `#64748b` | Nuevo: labels, captions |
| --accent | — | `#1f6feb` | Nuevo: links, active states |
| --text-link | `#58a6ff` | `#1f6feb` | Consistente con accent |

### Semantic (acciones)

| Token | Color | Uso |
|-------|-------|-----|
| --semantic-buy | `#238636` | BUY_NOW — verde GitHub |
| --semantic-negotiate | `#d29922` | NEGOTIATE — amarillo |
| --semantic-watch | `#d96c1a` | WATCH/RESEARCH — naranja |
| --semantic-avoid | `#f85149` | AVOID — rojo |
| --semantic-watch-high | `#1f6feb` | WATCH_HIGH_PRIORITY — azul |
| --semantic-neutral | `#64748b` | Sin info — gris |

### Grades

| Token | Color |
|-------|-------|
| --grade-a | `#238636` (verde) |
| --grade-b | `#1f6feb` (azul) |
| --grade-c | `#d29922` (amarillo) |
| --grade-d | `#f85149` (rojo) |

### Mapa

| Token | Color |
|-------|-------|
| --map-tile | CartoDB dark matter |
| --map-heat-low | `rgba(31, 111, 235, 0.2)` (azul) |
| --map-heat-med | `rgba(210, 153, 34, 0.5)` (amarillo) |
| --map-heat-high | `rgba(248, 81, 73, 0.8)` (rojo) |

---

## 3. Tipografía

**Fuente:** Inter (Google Fonts) — mantenida desde V1.

### Escala tipográfica

| Token | Tamaño | Uso |
|-------|--------|-----|
| --text-xs | 12px | Captions, labels, badges |
| --text-sm | 14px | Tabla, info rows, filtros |
| --text-base | 16px | Texto general, descripciones |
| --text-lg | 20px | Títulos de sección |
| --text-xl | 24px | Títulos de panel |
| --text-2xl | 32px | KPI values, header title |

### Pesos

| Peso | Uso |
|------|-----|
| 400 (Regular) | Texto general |
| 500 (Medium) | Labels, badges, subtítulos |
| 600 (Semibold) | Títulos de sección |
| 700 (Bold) | KPIs, header, números importantes |
| 800 (Extrabold) | Logo HOIE |

---

## 4. Layout

### CSS Grid

```css
.app-grid {
  display: grid;
  grid-template-areas:
    "header header header"
    "filters map detail"
    "table table table";
  grid-template-rows: 60px 1fr auto;
  grid-template-columns: 240px 1fr 360px;
  height: 100vh;
}
```

### Áreas

| Área | Grid area | Tamaño |
|------|-----------|--------|
| Header | `header header header` | 60px altura, full width |
| Filtros | `filters` | 240px ancho fijo |
| Mapa | `map` | 1fr (flexible — 60-70% del ancho) |
| Detail | `detail` | 360px ancho fijo |
| Tabla | `table table table` | Full width, altura auto (min 200px) |

### Breakpoints

| Breakpoint | Layout | Cambios |
|------------|--------|---------|
| Desktop >1024px | Grid completo | Todo visible |
| Laptop 768-1024px | Detail = overlay | Detail panel colapsable (overlay 360px desde derecha) |
| Tablet 600-768px | Filtros = bottom sheet | Filtros ocultos, botón "Filtros" los abre como bottom sheet |
| Mobile <600px | Stack vertical | Header → mapa 40vh → tabla → filtros modal |

### Mobile específico

```
┌─────────────────┐
│ Header (condensado) │
├─────────────────┤
│ Mapa 40vh       │
├─────────────────┤
│ Tabla (scroll)  │
├─────────────────┤
│ [Filtros] [Map] │  ← bottom nav
└─────────────────┘
```

---

## 5. Flujos de Usuario

### F1: Inversionista descubre oportunidades

```
[Landing]
  → Usuario abre dashboard
  → Ve header con KPIs (total, buy_now, avg_score)
  → Ve mapa centrado en Panamá con marcadores de colores
  → Los marcadores verdes (BUY_NOW) destacan
  → Mapa tiene heatmap sutil de concentración de oportunidades

[Hover marcador]
  → Popup aparece: foto, título, precio, action badge, score
  → Información compacta (<8 campos)

[Click marcador]
  → Detail panel (derecha) se abre
  → Sección Explainability visible primero
  → "✔ Precio 18% debajo del mercado"
  → "✔ Confidence 91%"
  → Empieza a entender por qué Hermes lo recomienda

[Scroll en detail panel]
  → Ve Comparables con tarjetas (foto, precio, distancia)
  → Ve comparables de alta calidad (quality_score visible)
  → Scrollea a más: ROI, historial, risk analysis

[Click "Ver publicación original"]
  → Nueva pestaña: listing original en Encuentra24
```

### F2: Inversionista filtra por provincia

```
[Estado inicial]
  → Sidebar izquierdo con 15 filtros
  → Todos en estado default

[Abrir dropdown Provincia]
  → Muestra provincias disponibles (Panamá, Colón, Chiriquí, etc.)
  → Click en "Panamá"

[Debounce 300ms]
  → Filtro se aplica
  → Mapa se actualiza: solo marcadores de Panamá
  → Tabla se actualiza: solo filas de Panamá
  → Header KPIs se recalculan
  → Chip aparece: "Provincia: Panamá" con botón X

[Click chip X]
  → Filtro se limpia
  → Mapa muestra todos los assets nuevamente
```

### F3: Admin revisa estado del pipeline

```
[Header]
  → Admin ve botón "Modo Admin" (solo si authenticated)
  → Click → toggle activa

[Admin panel reemplaza Detail panel]
  → Muestra: Pipeline status (last run), estado scrapers, errores
  → Tabla de pipeline_runs (últimos 50)
  → Click en run → expande error_log JSONB
  → Métricas: avg scraping time, assets processed
  → Estado Supabase: verde (conectado) / rojo (error)
```

### F4: Exploración temporal

```
[Bottom del mapa]
  → Timeline slider con dos handles (desde/hasta)
  → Rango: 2024 → 2026

[Mover handle izquierdo a 2025-03]
  → Mapa se actualiza: assets con scraped_at >= 2025-03
  → Label: "Mar 2025"

[Click Play]
  → Animación: 1 mes/segundo
  → Marcadores aparecen/desaparecen temporalmente
  → Usuario ve evolución del mercado
```

### F5: Comparables

```
[Detail panel abierto]
  → Sección "Comparables" con header "5 propiedades comparables"
  → Lista vertical de ComparableCard

[Cada card muestra]
  → Foto thumbnail (letf)
  → Precio destacado
  → Distancia: "1.2 km"
  → Área: "120 m²"
  → Habitaciones: "3 hab"
  → Quality Score: 0.85 (barra de progreso)
  → Match reason: "Misma zona, tipo similar"

[Click en comparable]
  → Mapa vuela a ese comparable (flyTo)
  → Detail panel se actualiza al comparable seleccionado
```

---

## 6. Estados del Sistema

### Loading

| Componente | Estado loading |
|------------|---------------|
| Header KPIs | Skeleton placeholders (bloques grises animados) |
| Mapa | Spinner centrado en mapa + "Cargando datos..." |
| Detail panel | Skeleton de secciones (6-8 bloques) |
| Tabla | Skeleton de filas (5-8 filas grises) |
| Comparables | 3 skeleton cards |

### Empty

| Escenario | Título | Mensaje |
|-----------|--------|---------|
| Sin assets | "🗺️ Sin propiedades" | "No hay propiedades disponibles. Ejecuta el pipeline." |
| Sin resultados de filtro | "🔍 Sin resultados" | "Ninguna propiedad coincide con los filtros activos." |
| Sin comparables | "Sin comparables" | "No hay comparables para esta propiedad." |
| Sin coordenadas | "📍 Ubicación no disponible" | "Esta propiedad no tiene coordenadas geográficas." |

### Error

| Escenario | UI |
|------------|-----|
| Supabase desconectado | Banner rojo fijo en header: "⚠️ Sin conexión a Supabase. Reintentando..." + botón "Reintentar" |
| Query error | Error boundary con: "Error al cargar datos" + stack trace (solo admin) + botón "Reintentar" |
| Geocoding error | Marcador sin posición → mostrado en tabla pero no en mapa + tooltip "Sin ubicación" |

### Partial (sin coordenadas)

- Assets sin `location.coordinates`:
  - No aparecen en el mapa
  - Sí aparecen en la tabla (con icono "📍 N/A")
  - Detail panel muestra "Ubicación no disponible" + provincia/district como texto
  - Geocoding fallback intenta resolver por provincia+district

---

## 7. Interacciones del Mapa

### Click marcador

- Selecciona asset → detail panel se abre (o actualiza)
- Marcador seleccionado: outline blanco + size +4px
- Click fuera de marcador → deselecciona + cierra detail (si está en modo colapsable)

### Hover marcador

- Popup aparece después de 500ms hover
- Popup muestra: foto thumbnail (64x64), título (1 línea), precio, action badge, score badge
- Popup desaparece on mouseout o al mover cursor

### Zoom

- Zoom in (14+): marcadores individuales con popup posterior
- Zoom mid (10-13): clustering activo (supercluster), clusters show count
- Zoom out (<10): clusters grandes agrupados por zona
- Zoom fluido (60fps) con animación de transición

### Pan

- Lazy load de tiles fuera de viewport
- Si bbox query activo: solo fetch assets en viewport

### Layer toggle

- Panel inline en esquina superior derecha del mapa
- Cada capa: checkbox + label + icono
- Toggle on/off inmediato

### Heatmap toggle

- Botón separado en toolbar del mapa
- On: capa de calor aparece sobre marcadores
- Off: capa desaparece

### Click polígono

- Zoom a bounds del polígono
- Tooltip con métricas de zona (ROI, confidence, market trend)
- Click fuera → cierra tooltip

---

## 8. Responsive Behavior

### Desktop >1024px

```
┌──────────────────────────────────────────────┐
│ Header: KPIs | Pipeline status | User    60px │
├────────┬───────────────────────────┬──────────┤
│Filtros │      Mapa (60-70%)         │ Detail  │
│ 240px  │                            │ 360px   │
│        │                           │          │
├────────┴───────────────────────────┴──────────┤
│ Tabla inteligente (full width)                │
└──────────────────────────────────────────────┘
```

### Laptop 768-1024px

```
┌──────────────────────────────────────────────┐
│ Header                                        │
├────────┬──────────────────────────────────────┤
│Filtros │      Mapa (70-80%)                   │
│ 200px  │                                     │
│        │                            ┌────────┐│
│        │                            │Detail  ││ ← overlay
│        │                            │ 320px  ││
│        │                            └────────┘│
├────────┴──────────────────────────────────────┤
│ Tabla                                         │
└──────────────────────────────────────────────┘
```

- Detail panel = overlay (flotante, no empuja el mapa)
- Filtros: 200px (más estrechos)
- Botón "X" para cerrar detail panel

### Tablet 600-768px

```
┌──────────────────────────────────────────────┐
│ Header (condensado: logo + KPIs básicos)      │
├──────────────────────────────────────────────┤
│ Mapa 50vh                                     │
├──────────────────────────────────────────────┤
│ Tabla (scroll interno)                        │
├──────────────────────────────────────────────┤
│ [📍 Filtros]  [📋 Tabla]  [🏠 Mapa]           │ ← bottom nav
└──────────────────────────────────────────────┘
```

- Filtros en bottom sheet (slide up desde bottom nav)
- Detail panel en full-screen modal
- Tabla con scroll horizontal

### Mobile <600px

```
┌─────────────────┐
│ Header (logo)    │
├─────────────────┤
│ Mapa 40vh       │
├─────────────────┤
│ Tabla (5 filas) │
├─────────────────┤
│ [🗺️] [📋] [⚙️]  │ ← bottom nav
└─────────────────┘
```

- Filtros: modal full-screen
- Detail panel: modal full-screen
- Mapa: 40vh fijo
- Bottom nav: mapa / tabla / admin

---

## 9. Accesibilidad

### ARIA Labels

```html
<button aria-label="Filtrar por provincia">...</button>
<div role="dialog" aria-label="Panel de detalles" aria-expanded="true">...</div>
<button aria-label="Cerrar panel de detalles">✕</button>
<div role="status" aria-live="polite" class="loading-indicator">Cargando...</div>
<input aria-label="Buscar en tabla" type="search" />
<button aria-pressed="true" aria-label="Capa de propiedades visible">...</button>
```

### Keyboard Navigation

| Tecla | Acción |
|-------|--------|
| Tab | Avanza entre elementos focusables (header → filtros → mapa → tabla) |
| Enter | Selecciona marcador/fila enfocada |
| Esc | Cierra detail panel / popup / modal |
| Arrow keys | Mueve el mapa (pan) |
| + / - | Zoom in/out del mapa |
| Ctrl+F | Focus en búsqueda de tabla |
| Ctrl+1 | Tab filter "Todos" |
| Ctrl+2 | Tab filter "Comprar" |
| Ctrl+3 | Tab filter "Alta prioridad" |

### Contrast Ratios (WCAG AA mínimo 4.5:1)

| Elemento | Foreground | Background | Ratio | Pass |
|----------|-----------|------------|-------|------|
| Texto general | `#e2e8f0` | `#0a0e14` | 15.2:1 | ✅ |
| Texto secundario | `#94a3b8` | `#0a0e14` | 7.8:1 | ✅ |
| Texto terciario | `#64748b` | `#0a0e14` | 4.6:1 | ✅ |
| Buy badge | `#238636` bg, `#fff` text | — | 4.5:1 | ✅ |
| Avoid badge | `#f85149` bg, `#fff` text | — | 4.2:1 | ⚠️ (mejorar a `#d94842`) |

### Focus Visible

- `outline: 2px solid var(--accent)` en todos los focusables
- border-radius del outline igual al elemento

---

## 10. Animaciones y Transiciones

### Principios

- Sutiles, no distractoras
- Duración: 150-200ms
- Easing: ease-out (deceleración natural)
- Solo animar propiedades que no afecten layout (opacity, transform)

### Transiciones específicas

| Elemento | Transición |
|----------|------------|
| Hover de card/fila | `background 150ms ease-out` |
| Detail panel abrir | `transform: translateX(0) 200ms ease-out` (desde derecha) |
| Popup del mapa | `opacity 0→1 150ms ease-out` + `transform: translateY(-8px→0)` |
| Filtro aplicar | `opacity 0.7→1 200ms ease-out` (ligero parpadeo) |
| Marker seleccionado | `transform: scale(1.15) 150ms ease-out` |
| Tabla sort | Filas reordenan con `transform 200ms ease-out` |
| Loading skeleton | `background: shimmer 1.5s infinite` (gradiente deslizante) |

### Reducir movimiento

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Iconografía

Estilo: outline, 16-20px, stroke 1.5px, color `currentColor`.

| Icono | Uso |
|-------|-----|
| 🏠 | Logo HOIE / propiedades |
| 🚗 | Vehículos |
| 🏦 | Bancos |
| ⚖️ | Remates judiciales |
| 📍 | Ubicación |
| 🔍 | Buscar |
| 📊 | Score/charts |
| 🧠 | Thesis/intelligence |
| ⚙️ | Admin/settings |
| ↗️ | Link externo |
| ⏪ | Timeline anterior |
| ⏩ | Timeline siguiente |
| ▶ | Timeline play |
| ⏸ | Timeline pause |

**Nota:** Usar SVG inline (no emoji) para consistencia visual y control de color. Emojis solo en wireframes textuales.

---

**Fin del UX — DASHBOARD_V2_UX.md**