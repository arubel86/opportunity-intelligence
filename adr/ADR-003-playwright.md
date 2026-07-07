# ADR-003: ¿Por qué Playwright?

**Estado:** Aprobado
**Fecha:** 2026-07-02

---

## Contexto

Hermes necesita extraer datos de portales inmobiliarios panameños (Encuentra24, Banco Nacional, Caja de Ahorros). Estos sitios no tienen APIs públicas y dependen de JavaScript para renderizar contenido.

## Problema

Seleccionar la tecnología de scraping que maximice tasa de éxito en portales panameños, minimice detección/bloqueo, y sea mantenible a largo plazo.

## Alternativas Evaluadas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **Playwright** | Chrome headless completo, anti-detección integrada, espera automática de elementos, network interception, soporte TypeScript nativo, mismo ecosistema Node.js | Consumo de memoria (~100MB por browser), instalación de Chromium (~300MB), overhead de inicialización (~2-5s) |
| **Puppeteer** | Similar a Playwright, maduro, amplia comunidad | Misma huella de recursos, menos ergonómico que Playwright (no tiene auto-wait), mantenimiento menos activo |
| **Cheerio + HTTP** | Liviano, rápido, sin headless browser | NO funciona con sitios SPA/JS-rendered; Encuentra24 usa JS para carga de listings |
| **Axios + DOMParser** | Mínima dependencia, ultra rápido | No ejecuta JS; insuficiente para la mayoría de portales modernos |
| **Scrapy (Python)** | Framework scraping maduro, middlewares integrados, spiders reutilizables | Fuera del ecosistema Node.js (Hermes es TS), integración más compleja con el pipeline existente |

## Decisión

**Playwright es el motor de scraping de Hermes.**

## Consecuencias

### Positivas
- Soporte nativo de TypeScript (mismo ecosistema que Hermes)
- Anti-detección (stealth) mediante fingerprint personalizado
- Auto-wait de elementos (no timeout guessing)
- Network interception (detectar cambios dinámicos, bloquear recursos no deseados)
- Soporte para múltiples browsers (fallback a Firefox si Chrome es detectado)

### Negativas
- Consumo de memoria: ~100MB por instancia de browser
- Descarga inicial de Chromium: ~300MB (ya instalado en el servidor)
- Overhead de ~2-5s por inicialización de browser
- Bloqueable por Cloudflare/DataDome avanzado (mitigación: rotación de fingerprint + proxies)

### Mitigaciones
- Browser pooling: reutilizar instancia de Chromium para múltiples listings (reducir overhead)
- Timeout por página: 30s máximo, con fallback a datos mock
- Proxy rotativo si se detecta bloqueo
- Playwright en modo headless con fingerprint personalizado (viewport, user-agent, webdriver flags)

## Referencias

- [base-scraper.ts](../apps/hoie-agent/src/scraper/base-scraper.ts)
- [DATA_INTELLIGENCE_ARCHITECTURE.md §3.1 — Scraping Strategy](../DATA_INTELLIGENCE_ARCHITECTURE.md)
