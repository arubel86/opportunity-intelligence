# Dashboard V2: Wireframes

**Versión:** 2.0
**Estado:** BORRADOR PARA APROBACIÓN
**Fecha:** 2026-07-06
**Plataforma:** Hermes Opportunity Intelligence Platform (HOIE)

---

## Wireframe 1: Vista Principal — Desktop (>1024px)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ 🏠 HOIE  │ 450 Activos │ 23 COMPRAR │ 8 ALTA │ 12 NEG │ 🟢 Pipeline OK │ 👤 Admin │
├──────────┬───────────────────────────────────────────────────┬───────────────────┤
│ FILTROS  │                                                   │ DETALLE           │
│          │                                                   │                   │
│ Provincia│              🗺️ MAPA DE PANAMÁ                   │ ┌───────────────┐│
│ [Panamá ▾]│                                                   │ │   [FOTO]      ││
│          │       🟢 🟢 🟡  🟢         🔵 🟠 🔴              │ │               ││
│ Distrito │          🟢  🟡 🟢   🔵 🟠                         │ └───────────────┘│
│ [Todos  ▾]│     🟢  🔵 🟢         🔵 🟠 🔴 🟢                  │ Penthouse Paitilla│
│          │         🟢 🟡      🔵 🟠                           │ 🟢 COMPRAR A-85  │
│ Tipo     │    🟡 🟢 🟢         🔵  🔵 🟢                      │                   │
│ ✅ Casa  │  🟢 🔵   🟢 🟡       🔵 🟠 🔴 🟢                  │ $250,000          │
│ ✅ Apto  │              [Layer Toggle]                        │ Valor: $300,000   │
│ ⬜ Terreno│            ☑Prop ☐Veh ☐Bancos                    │ Desc: -18%        │
│          │            ☐Remate ☐MktTrend ☐Heat               │ ROI: +12.5%       │
│ Precio   │                                                   │                   │
│ ◀───►   │                                                   │ 🧠 Tesis          │
│ $50K $5M │                                                   │ ✔ Prec 18% bajo   │
│          │                                                   │ ✔ Confidence 91%  │
│ Score    │                                                   │ ✔ Comparables alt │
│ ◀────►  │                                                   │                   │
│ 0    100 │                                                   │ 📋 Comparables    │
│          │                                                   │ ┌──┐ ┌──┐ ┌──┐   │
│ Acción   │                                                   │ │$235│$240│$220│   │
│ ✅ COMPRAR│                                                  │ │1.2k│0.8k│2.1k│   │
│ ✅ ALTA  │                                                   │ └──┘ └──┘ └──┘   │
│ ⬜ NEG   │                                                   │                   │
│ ⬜ EVITAR│                                                   │ [Ver original ↗]  │
│          │                                                   │ [Expediente]      │
│ [Limpiar]│                                                   │                   │
├──────────┴───────────────────────────────────────────────────┴───────────────────┤
│ 🔍 Buscar...  │ Score ▾│ Acción │ Tipo  │ Precio   │ Valor  │ ROI │ Conf│ Fuente│Fecha│→│
│              ├────────┼────────┼───────┼──────────┼─────────┼──────┼─────┼──────┼─────┼─┤
│ [Exportar]   │ 85  A- │🟢COMPR │Apto   │$250,000  │$300,000│+12.5│91%  │E24   │07/06│→│
│              │ 78  B+ │🔵ALTA  │Casa   │$180,000  │$200,000│+8.2 │82%  │E24   │07/05│→│
│              │ 72  B  │🟡NEGOC │Apto   │$320,000  │$350,000│+6.1 │75%  │E24   │07/05│→│
│              │ 65  C+ │🟠OBSER │Casa   │$450,000  │$480,000│+3.5 │62%  │E24   │07/04│→│
│              │ 45  D  │🔴EVITAR│Terreno│$80,000   │$75,000 │-6.2 │38%  │E24   │07/03│→│
│              │  ...   │  ...   │  ...  │  ...     │  ...   │ ... │ ... │ ...  │ ... │→│
└──────────────────────────────────────────────────────────────────────────────────┘
  240px           60-70% ancho (flexible)                                   360px
```

---

## Wireframe 2: Vista Principal — Tablet (768-1024px)

```
┌──────────────────────────────────────────────────────────┐
│ 🏠 HOIE │ 450 Activos │ 23 Comprar │ 🟢 Pipeline │ 👤   │
├────────────┬─────────────────────────────────────────────┤
│ FILTROS    │              🗺️ MAPA DE PANAMÁ              │
│            │                                             │
│ Provincia  │       🟢 🟢 🟡 🟢   🔵 🟠 🔴              │
│ [Panamá ▾] │          🟢 🟡 🟢  🔵 🟠                    │
│            │     🟢 🔵 🟢       🔵 🟠 🔴                  │
│ Tipo       │    🟢 🔵 🟢 🟡    🔵 🟠 🔴 🟢               │
│ ✅ Casa    │              [☑Prop ☐Bancos]                │
│ ✅ Apto    │                                             │
│            │                              ┌──────────────┐
│ Precio     │                              │ DETALLE (overlay)│
│ ◀──►      │                              │ [FOTO]         │
│            │                              │ Penthouse      │
│ Score      │                              │ 🟢COMPRAR 85   │
│ ◀──►      │                              │ $250,000       │
│            │                              │ ✔ Prec 18% bajo│
│ [Limpiar]  │                              │ [Ver original] │
│            │                              │          [✕]   │
├────────────┴─────────────────────────────┴──────────────┤
│ Tabla (mismo formato, scroll horizontal)                 │
└──────────────────────────────────────────────────────────┘
```

---

## Wireframe 3: Vista Principal — Mobile (<600px)

```
┌─────────────────────┐
│ 🏠 HOIE     👤      │
│ 450│23│🟢 OK        │
├─────────────────────┤
│                     │
│   🗺️ MAPA 40vh      │
│                     │
│   🟢 🟢 🟡 🟢      │
│      🟢 🟡 🟢       │
│   🟢 🔵 🟢          │
│                     │
├─────────────────────┤
│  Tabla (5 filas)    │
│  Score│Acción│Precio│
│  85  │🟢    │$250K │
│  78  │🔵    │$180K │
│  72  │🟡    │$320K │
│  65  │🟠    │$450K │
│  45  │🔴    │$80K  │
├─────────────────────┤
│ [🗺️]  [📋]  [⚙️]   │ ← bottom nav
└─────────────────────┘

Al click [🗺️] → mapa full screen
Al click [📋] → tabla full screen
Al click [⚙️] → admin (si authenticated)
Filtros → modal full-screen
Detail → modal full-screen
```

---

## Wireframe 4: Detail Panel — Expanded (Expediente Completo)

```
┌───────────────────────────────────┐
│ DETALLE                    [✕]     │
├───────────────────────────────────┤
│ ┌─────────────────────────────┐   │
│ │  [FOTO PRINCIPAL 320x200]   │   │
│ │                             │   │
│ └─────────────────────────────┘   │
│ [thumb1][thumb2][thumb3][thumb4]  │
├───────────────────────────────────┤
│ Penthouse Paitilla                 │
│ 🟢 COMPRAR  📊 A- 85               │
│ 📍 Panamá, San Francisco, Paitilla│
├───────────────────────────────────┤
│ PRECIO                            │
│ Lista:   $250,000                 │
│ Estimado: $300,000                │
│ Descuento: -18% 🟢                │
│ ROI esperado: +12.5% YoY          │
├───────────────────────────────────┤
│ 🧠 EXPLAINABILITY                 │
│ ✔ Precio 18% debajo del mercado   │
│ ✔ Zona con crecimiento 9% anual  │
│ ✔ Confidence 91%                  │
│ ✔ Comparables alta calidad (0.85) │
│ ✔ Vendedor redujo precio 3 veces │
│ ✔ Riesgo legal bajo               │
│ ✔ Alta liquidez (DOM: 45 días)    │
├───────────────────────────────────┤
│ 📋 COMPARABLES (5 propiedades)    │
│ ┌─────────────────────────────┐   │
│ │[foto] $235,000  📏 1.2 km   │   │
│ │       120 m² · 3 hab         │   │
│ │       Peso: ████████░ 0.85  │   │
│ │       "Misma zona"           │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │[foto] $240,000  📏 0.8 km   │   │
│ │       110 m² · 3 hab         │   │
│ │       Peso: ███████░░ 0.72  │   │
│ └─────────────────────────────┘   │
│ ...                               │
├───────────────────────────────────┤
│ 📈 HISTORIAL DE PRECIOS           │
│ 2024-07-06: $250,000 (actual)     │
│ 2024-06-15: $265,000 (-$15K)     │
│ 2024-05-01: $290,000 (-$25K)     │
│ 2024-03-20: $310,000 (-$20K)     │
├───────────────────────────────────┤
│ 🎯 CONFIDENCE: 91%                │
│ ████████████████████░  91/100     │
├───────────────────────────────────┤
│ ⚙️ DECISION ENGINE                │
│ Perfil: value_investment          │
│ Urgencia: 4/5 ⚠️                  │
│ Tesis: Precio 18% bajo, zona...  │
├───────────────────────────────────┤
│ 🏢 SELLER ANALYSIS                │
│ Tipo: agent                       │
│ Propietario: Inversiones XYZ      │
├───────────────────────────────────┤
│ ⚠️ RISK ANALYSIS                  │
│ Riesgo legal: bajo                │
│ Riesgo mercado: medio             │
│ Riesgo liquidez: bajo             │
├───────────────────────────────────┤
│ 📊 MARKET TREND                   │
│ Provincia: hot 🔥                 │
│ Distrito: warm 🌡️                │
├───────────────────────────────────┤
│ 🔗 FUENTE                         │
│ Encuentra24                       │
│ [Ver publicación original ↗]      │
├───────────────────────────────────┤
│ [Abrir expediente completo ▼]    │
│ [Ver publicación original ↗]      │
└───────────────────────────────────┘
```

---

## Wireframe 5: Comparables Section (Detail Panel)

```
┌───────────────────────────────────┐
│ 📋 COMPARABLES (5 propiedades)    │
│ Usados por Hermes para evaluación │
├───────────────────────────────────┤
│ ┌─────────────────────────────┐   │
│ │┌──┐                         │   │
│ ││ft│  $235,000   📏 1.2 km  │   │
│ │└──┘  120 m² · 3 hab         │   │
│ │       📅 hace 15 días        │   │
│ │       Peso: ████████░ 0.85  │   │
│ │       Quality Score: 0.85   │   │
│ │       "Misma zona, tipo"    │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │┌──┐                         │   │
│ ││ft│  $240,000   📏 0.8 km   │   │
│ │└──┘  110 m² · 3 hab         │   │
│ │       📅 hace 20 días        │   │
│ │       Peso: ███████░░ 0.72  │   │
│ │       "Mismo edificio"      │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │┌──┐                         │   │
│ ││ft│  $220,000   📏 2.1 km   │   │
│ │└──┘  130 m² · 3 hab         │   │
│ │       Peso: ██████░░░ 0.61  │   │
│ │       "Zona similar"        │   │
│ └─────────────────────────────┘   │
│                                   │
│ [Click comparable → mapa flyTo]  │
└───────────────────────────────────┘
```

---

## Wireframe 6: Map Popup (Hover)

```
        ┌────────────────────────────┐
        │ ┌──┐                       │
        │ │ft│  Penthouse Paitilla   │
        │ └──┘  $250,000             │
        │        🟢 COMPRAR  A- 85    │
        │        📊 Score: 85         │
        └────────────────────────────┘
           ▲
           │ (marcador en el mapa)
        🟢
```

---

## Wireframe 7: Filtros Expandidos (Sidebar)

```
┌───────────────────────────┐
│ FILTROS          [Limpiar]│
├───────────────────────────┤
│ 📍 Provincia              │
│ [Panamá           ▾]      │
│ 📍 Distrito               │
│ [San Francisco    ▾]      │
│ 📍 Corregimiento          │
│ [Todos             ▾]    │
├───────────────────────────┤
│ 🏠 Tipo                   │
│ ☑ Casa                    │
│ ☑ Apartamento             │
│ ☐ Terreno                 │
│ ☐ Comercial               │
├───────────────────────────┤
│ 💰 Precio                 │
│ ◀═══════════════════►    │
│ $50K              $5M    │
├───────────────────────────┤
│ 📐 Área (m²)              │
│ ◀═══════════════════►    │
│ 0                  1000  │
├───────────────────────────┤
│ 🛏 Habitaciones           │
│ ☑ 1  ☑ 2  ☑ 3             │
│ ☐ 4  ☐ 5+                 │
├───────────────────────────┤
│ 📊 Opportunity Score      │
│ ◀═══════════════════►    │
│ 0                  100   │
├───────────────────────────┤
│ 💵 ROI (mínimo)           │
│ ◀═════════►              │
│ 0%        20%            │
├───────────────────────────┤
│ 🎯 Confidence             │
│ ◀═══════════════════►    │
│ 0                  100   │
├───────────────────────────┤
│ ⚠️ Riesgo                 │
│ ○ Bajo  ○ Medio  ○ Alto  │
├───────────────────────────┤
│ 🏷 Acción                 │
│ ☑ COMPRAR                 │
│ ☑ ALTA PRIORIDAD          │
│ ☐ NEGOCIAR                │
│ ☐ OBSERVAR                │
│ ☐ EVITAR                  │
├───────────────────────────┤
│ 📅 Fecha                  │
│ Desde: [2024-01-01]       │
│ Hasta: [2026-07-06]       │
├───────────────────────────┤
│ 🏦 Fuente                 │
│ ☑ Encuentra24             │
│ ☐ CompaMostrar            │
│ ☐ Encuentra24 Vehículos   │
├───────────────────────────┤
│ Chips activos:            │
│ [Provincia: Panamá ✕]    │
│ [Tipo: Casa ✕]           │
│ [Acción: COMPRAR ✕]      │
└───────────────────────────┘
```

---

## Wireframe 8: Dashboard Técnico (Admin)

```
┌────────────────────────────────────────────────────────────────┐
│ ⚙️ PANEL TÉCNICO (ADMIN)                           [✕ Salir]   │
├────────────────────────────────────────────────────────────────┤
│ ESTADO DEL SISTEMA                                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│ │ Scrapers   │ │ Pipeline   │ │ Supabase   │ │ Latencia     │ │
│ │ 🟢 3/3 OK  │ │ 🟢 Último: │ │ 🟢 Online  │ │ 42ms         │ │
│ │            │ │ 2024-07-06 │ │            │ │              │ │
│ └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │
├────────────────────────────────────────────────────────────────┤
│ SCRAPERS                                                       │
│ ┌──────────────────┬─────────┬──────────┬──────────┬──────────┐│
│ │ Source           │ Vertical│ Estado   │ Last Run │ Quality  ││
│ ├──────────────────┼─────────┼──────────┼──────────┼──────────┤│
│ │ Encuentra24      │ real_est│ 🟢 active│ 07/06 22│ 0.85     ││
│ │ CompaMostrar     │ real_est│ 🟢 active│ 07/06 22│ 0.72     ││
│ │ Encuentra24 Auto │ vehicles│ 🟡 idle  │ 07/05 18│ 0.65     ││
│ └──────────────────┴─────────┴──────────┴──────────┴──────────┘│
├────────────────────────────────────────────────────────────────┤
│ PIPELINE RUNS (últimos 50)                                  [▾]│
│ ┌────────────┬──────────┬───────┬──────┬──────┬──────┬──────┐ │
│ │ Run ID     │ Inicio   │Status │Assets│Scored│Errors│Duración│ │
│ ├────────────┼──────────┼───────┼──────┼──────┼──────┼──────┤ │
│ │ #a3f2...   │ 07/06 22 │ 🟢 OK │  450 │  450 │    0 │ 1.2s │ │
│ │ #b2c1...   │ 07/05 18 │ 🟢 OK │  420 │  418 │    2 │ 1.5s │ │
│ │ #c1d4...   │ 07/04 22 │ 🔴 ERR│  380 │  300 │   80 │ 3.1s │ │
│ └────────────┴──────────┴───────┴──────┴──────┴──────┴──────┘ │
├────────────────────────────────────────────────────────────────┤
│ LOGS (error_log del run #c1d4...)                             │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ {                                                          ││
│ │   "errors": [                                             ││
│ │     {"source": "Encuentra24", "msg": "Timeout", "count": 8}││
│ │   ]                                                        ││
│ │ }                                                          ││
│ └────────────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────────┤
│ MÉTRICAS                                                       │
│ Tiempo promedio scraping: 1.3s                                 │
│ Assets procesados/run: 416                                     │
│ Error rate: 1.2%                                               │
│ Pipeline runs totales: 148                                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 9: Timeline Slider (Expandido)

```
┌──────────────────────────────────────────────────────────────────┐
│ TIMELINE                                                          │
│                                                                   │
│ 2024-01  2024-07  2025-01  2025-07  2026-01  2026-07              │
│   ◀════════●════════════════════════════════════════════════●▶  │
│          Mar 2025                                          Jul 2026│
│                                                                   │
│  [▶ Play]  [⏸ Pause]  1 mes/segundo      Mostrando: 1,240 assets│
└──────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 10: Heatmap View

```
┌────────────────────────────────────────────────────┐
│ 🗺️ MAPA — HEATMAP ACTIVADO        [☑ Heatmap ON]│
├────────────────────────────────────────────────────┤
│                                                    │
│         ░░░░░░░░          ▓▓▓▓▓▓                  │
│       ░░░▓▓▓▓░░░░░      ▓▓▓████▓▓                  │
│     ░░░▓▓████▓▓▓░░░    ▓▓██████▓▓                  │
│       ░▓▓████▓▓░░░░      ▓▓████▓▓                  │
│         ░░▓▓░░░░          ▓▓▓▓▓▓                  │
│                                                    │
│    ░ = baja    ▓ = media    █ = alta              │
│                                                    │
│  Concentración de oportunidades (score >= 70)     │
│                                                    │
│  [☑ Propiedades]  [☑ Heatmap]  [☐ Polígonos]     │
└────────────────────────────────────────────────────┘
```

---

## Wireframe 11: Zone Polygon View

```
┌────────────────────────────────────────────────────┐
│ 🗺️ MAPA — POLÍGONOS POR ZONA      [☑ Polígonos]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────────┐    ┌──────────────┐           │
│  │  Panamá         │    │  Colón       │           │
│  │  450 assets     │    │  120 assets  │           │
│  │  ROI: +12.5%    │    │  ROI: +8.2%  │           │
│  │  Trend: 🔥 hot  │    │  Trend: 🌡️   │           │
│  │  Conf: 78%      │    │  Conf: 65%   │           │
│  └─────────────────┘    └──────────────┘           │
│           ┌──────────────────┐                    │
│           │  San Francisco    │                    │
│           │  180 assets       │                    │
│           │  ROI: +15.2%      │                    │
│           │  Trend: 🔥🔥     │                    │
│           └──────────────────┘                    │
│                                                    │
│  Click zona → zoom + filtra                        │
└────────────────────────────────────────────────────┘
```

---

## Wireframe 12: Empty State — Sin Assets

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│                   🗺️                                │
│                                                    │
│           Sin propiedades                          │
│                                                    │
│      No hay propiedades disponibles.                │
│      Ejecuta el pipeline para generar              │
│      evaluaciones.                                 │
│                                                    │
│            [▶ Ejecutar pipeline]                  │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Wireframe 13: Loading State

```
┌────────────────────────────────────────────────────┐
│ 🏠 HOIE │ ████ │ ████ │ ████ │ 🟢 OK │ 👤         │
├──────────┬───────────────────────────┬─────────────┤
│ FILTROS  │                           │ DETALLE     │
│          │      ╭─────╮              │             │
│ ████     │      │  ⊜  │              │ ████████    │
│ ████     │      │loading│             │ ████████    │
│ ████     │      ╰─────╯              │ ████████    │
│          │                           │ ████████    │
│ ████     │                           │ ████████    │
│ ████     │                           │ ████████    │
├──────────┴───────────────────────────┴─────────────┤
│ ████│████│████│████│████│████│████│████│████│████│██│
│ ████│████│████│████│████│████│████│████│████│████│██│
│ ████│████│████│████│████│████│████│████│████│████│██│
└────────────────────────────────────────────────────┘
```

---

## Wireframe 14: Error State

```
┌────────────────────────────────────────────────────────────────┐
│ 🏠 HOIE │ ⚠️ Sin conexión a Supabase. Reintentando... [↻]      │
├────────────────────────────────────────────────┬───────────────┤
│ FILTROS  │                                      │ DETALLE       │
│          │                                      │               │
│          │    ┌──────────────────────────┐      │               │
│          │    │                          │      │               │
│          │    │   ⚠️                     │      │               │
│          │    │                          │      │               │
│          │    │   Error al cargar datos  │      │               │
│          │    │                          │      │               │
│          │    │   Connection refused     │      │               │
│          │    │                          │      │               │
│          │    │   [↻ Reintentar]         │      │               │
│          │    │                          │      │               │
│          │    └──────────────────────────┘      │               │
└────────────────────────────────────────────────┴───────────────┘
```

---

## Resumen

| # | Wireframe | Vista |
|---|-----------|-------|
| 1 | Desktop | Grid completo: Header + Filtros + Mapa + Detail + Tabla |
| 2 | Tablet | Detail overlay, filtros 200px |
| 3 | Mobile | Stack vertical + bottom nav |
| 4 | Detail expanded | Expediente completo con 13 secciones |
| 5 | Comparables | Cards con foto, precio, distancia, peso |
| 6 | Map popup | Hover preview compacto |
| 7 | Filtros | Sidebar con 15 filtros + chips |
| 8 | Admin | Estado scrapers, pipeline, logs, métricas |
| 9 | Timeline | Slider 2024-2026 con play/pause |
| 10 | Heatmap | Mapa con capa de calor |
| 11 | Polígonos | Zonas con métricas overlay |
| 12 | Empty state | Sin assets |
| 13 | Loading | Skeleton blocks |
| 14 | Error | Error boundary con retry |

---

**Fin del Wireframes — DASHBOARD_V2_WIREFRAMES.md**