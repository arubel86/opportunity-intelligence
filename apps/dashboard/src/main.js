import { createClient } from '@supabase/supabase-js'
import './style.css'

// ── Cliente Supabase ────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  document.querySelector('#app').innerHTML = `
    <div class="error-state">
      <h2>⚠️ Configuración Requerida</h2>
      <p>Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env</p>
    </div>`
  throw new Error('Credenciales de Supabase faltantes')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Destino de Render ───────────────────────────────────────────────────
const app = document.querySelector('#app')

// ── Dashboard State ────────────────────────────────────────────
let allCards = []
let currentFilter = 'ALL'

// ── Helpers ─────────────────────────────────────────────────────
function formatPrice(n) {
  if (n == null || isNaN(n)) return '—'
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatPct(n) {
  if (n == null || isNaN(n)) return '—'
  const v = Number(n)
  return (v > 0 ? '+' : '') + v.toFixed(1) + '%'
}

function gradeClass(g) {
  if (!g) return 'grade-d'
  const map = { A: 'grade-a', 'A+': 'grade-a', 'A-': 'grade-a', B: 'grade-b', 'B+': 'grade-b', 'B-': 'grade-b', C: 'grade-c', 'C+': 'grade-c', 'C-': 'grade-c', D: 'grade-d' }
  return map[g.charAt(0)] || 'grade-d'
}

function actionBadge(action) {
  const map = {
    BUY_NOW: { label: 'COMPRAR', cls: 'badge-buy' },
    WATCH_HIGH_PRIORITY: { label: 'ALTA PRIORIDAD', cls: 'badge-watch-high' },
    NEGOTIATE: { label: 'NEGOCIAR', cls: 'badge-negotiate' },
    RESEARCH_MORE: { label: 'OBSERVAR', cls: 'badge-watch' },
    WATCH: { label: 'OBSERVAR', cls: 'badge-watch' },
    AVOID: { label: 'EVITAR', cls: 'badge-avoid' },
  }
  const m = map[action] || { label: action, cls: 'badge-avoid' }
  return `<span class="action-badge ${m.cls}">${m.label}</span>`
}

// ── Display Title Cleaner ───────────────────────────────────────
const EN_TO_ES_DISPLAY = [
  [/for\s+sale/gi, 'en venta'],
  [/pre-sale/gi, 'pre-venta'],
  [/new\s+project/gi, 'nuevo proyecto'],
  [/limited\s+inventory/gi, 'inventario limitado'],
  [/contact\s+now/gi, 'contacte ahora'],
  [/apartment/gi, 'apartamento'],
  [/penthouse/gi, 'penthouse'],
  [/bedroom/gi, 'dormitorio'],
  [/bedrooms/gi, 'dormitorios'],
  [/bathroom/gi, 'baño'],
  [/bathrooms/gi, 'baños'],
  [/parking/gi, 'estacionamiento'],
  [/square\s+meters/gi, 'metros cuadrados'],
  [/sqm/gi, 'm²'],
  [/lot/gi, 'lote'],
  [/house/gi, 'casa'],
  [/townhouse/gi, 'casa'],
  [/property/gi, 'propiedad'],
  [/commercial/gi, 'comercial'],
  [/beach\s*front/gi, 'frente a la playa'],
  [/ocean\s*view/gi, 'vista al mar'],
  [/mountain\s*view/gi, 'vista a la montaña'],
  [/gated\s+community/gi, 'comunidad cerrada'],
  [/condominium/gi, 'condominio'],
  [/building/gi, 'edificio'],
  [/development/gi, 'desarrollo'],
  [/investment/gi, 'inversión'],
  [/exclusive/gi, 'exclusivo'],
  [/boutique/gi, 'boutique'],
  [/tropical/gi, 'tropical'],
  [/lifestyle/gi, 'estilo de vida'],
  [/privacy/gi, 'privacidad'],
  [/spacious/gi, 'espacioso'],
  [/charming/gi, 'encantador'],
  [/residence/gi, 'residencia'],
  [/pool/gi, 'piscina'],
  [/garden/gi, 'jardín'],
  [/garage/gi, 'garaje'],
  [/terrace/gi, 'terraza'],
  [/balcony/gi, 'balcón'],
  [/studio/gi, 'estudio'],
  [/master\s+suite/gi, 'suite principal'],
  [/laundry/gi, 'lavandería'],
  [/storage/gi, 'bodega'],
  [/security/gi, 'seguridad'],
  [/fully\s+furnished/gi, 'totalmente amueblado'],
  [/unfurnished/gi, 'sin amueblar'],
  [/under\s+construction/gi, 'en construcción'],
  [/air\s+conditioning/gi, 'aire acondicionado'],
  [/furnished/gi, 'amueblado'],
]

function translateDisplay(title = '') {
  if (!title) return ''
  let t = title
  for (const [pat, rep] of EN_TO_ES_DISPLAY) {
    t = t.replace(pat, rep)
  }
  return t
}

function cleanTitleForDisplay(title = '') {
  if (!title) return 'Sin título'
  let t = title
    // Strip junk from bad scraper extraction
    .replace(/Compare this ad\s*/gi, '')
    .replace(/Add to favorites\s*/gi, '')
    .replace(/Contact\s+now.*$/gi, '')
    .replace(/📌.*$/gi, '')
    .trim()
  // Translate English → Spanish
  t = translateDisplay(t)
  // If still too long (over 100 chars), truncate at a sentence boundary
  if (t.length > 120) {
    const breakpoints = ['. ', '! ', '? ', ' - ', ' | ', '\n']
    for (const bp of breakpoints) {
      const idx = t.indexOf(bp)
      if (idx > 30 && idx < 110) {
        t = t.slice(0, idx)
        break
      }
    }
    if (t.length > 120) t = t.slice(0, 117) + '...'
  }
  return t.trim()
}

function cleanLocationForDisplay(loc = {}) {
  let parts = [loc.neighborhood, loc.district, loc.province]
    .filter(Boolean)
    .map(s => s.replace(/Compare this ad\s*/gi, '').replace(/Add to favorites\s*/gi, '').trim())
    .filter(Boolean)
  return parts.length ? parts.join(', ') : 'N/D'
}

// ── Fetch ───────────────────────────────────────────────────────────────
async function fetchAll() {
  const [assetsRes, scoresRes, decisionsRes] = await Promise.all([
    supabase.from('assets').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('opportunity_scores').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('investment_decisions').select('*').order('created_at', { ascending: false }).limit(100),
  ])
  return { assets: assetsRes.data || [], scores: scoresRes.data || [], decisions: decisionsRes.data || [] }
}

// ── Mapa de Decisiones ──────────────────────────────────────────────────
function buildDecisionMap(decisions) {
  const map = {}
  for (const d of decisions) {
    const key = d.asset_id
    if (!map[key] || new Date(d.created_at) > new Date(map[key].created_at)) {
      map[key] = d
    }
  }
  return map
}

// ── Render Dashboard ────────────────────────────────────────────────────
function renderDashboard({ assets, scores, decisions }) {
  const decisionMap = buildDecisionMap(decisions)
  const decisionIds = new Set(Object.keys(decisionMap))

  const totalAssets = assets.length
  const scoredAssets = scores.length
  const actionCounts = { BUY_NOW: 0, WATCH_HIGH_PRIORITY: 0, NEGOTIATE: 0, RESEARCH_MORE: 0, AVOID: 0 }

  // Grade distribution
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0 }
  const avgScore = scores.reduce((s, sc) => {
    const f = sc.final_score || 0
    if (f >= 80) gradeDistribution.A++
    else if (f >= 65) gradeDistribution.B++
    else if (f >= 50) gradeDistribution.C++
    else gradeDistribution.D++
    return s + f
  }, 0) / (scores.length || 1)

  for (const d of Object.values(decisionMap)) {
    const a = d.recommended_action || 'AVOID'
    actionCounts[a] = (actionCounts[a] || 0) + 1
  }

  allCards = assets
    .filter(a => decisionIds.has(a.asset_id))
    .map(a => ({ asset: a, decision: decisionMap[a.asset_id] }))

  const totalWithDecision = allCards.length
  const totalGrade = gradeDistribution.A + gradeDistribution.B + gradeDistribution.C + gradeDistribution.D

  const gradeBarHtml = totalGrade > 0
    ? `<div class="grade-dist">
        ${['A', 'B', 'C', 'D'].map(g => {
          const pct = Math.round((gradeDistribution[g] || 0) / totalGrade * 100)
          return `<div class="grade-bar"><div class="grade-bar-fill ${g.toLowerCase()}" style="width:${pct}%"></div></div>`
        }).join('')}
      </div>`
    : ''

  app.innerHTML = `
    <header class="dashboard-header">
      <h1>🏠 Hermes Dashboard</h1>
      <div class="stats-row">
        <div class="stat-card"><span class="stat-value">${totalAssets}</span><span class="stat-label">Activos Totales</span></div>
        <div class="stat-card"><span class="stat-value">${totalWithDecision}</span><span class="stat-label">Con Decisión</span></div>
        <div class="stat-card"><span class="stat-value">${avgScore.toFixed(0)}</span><span class="stat-label">Score Promedio</span></div>
        <div class="stat-card action-summary">
          <span><strong class="c-buy">${actionCounts.BUY_NOW}</strong> COMPRAR</span>
          <span><strong class="c-watch-high">${actionCounts.WATCH_HIGH_PRIORITY}</strong> ALTA</span>
          <span><strong class="c-negotiate">${actionCounts.NEGOTIATE}</strong> NEGOCIAR</span>
          <span><strong class="c-watch">${actionCounts.RESEARCH_MORE}</strong> OBSERVAR</span>
          <span><strong class="c-avoid">${actionCounts.AVOID}</strong> EVITAR</span>
        </div>
        ${totalGrade > 0 ? `<div class="stat-card">${gradeBarHtml}</div>` : ''}
      </div>
    </header>

    <div class="filter-bar">
      <button class="filter-btn active" data-filter="ALL">📋 Todos</button>
      <button class="filter-btn" data-filter="BUY_NOW">🟢 Comprar (${actionCounts.BUY_NOW})</button>
      <button class="filter-btn" data-filter="WATCH_HIGH_PRIORITY">🔵 Alta Prioridad (${actionCounts.WATCH_HIGH_PRIORITY})</button>
      <button class="filter-btn" data-filter="NEGOTIATE">🟡 Negociar (${actionCounts.NEGOTIATE})</button>
      <button class="filter-btn" data-filter="AVOID">🔴 Evitar (${actionCounts.AVOID})</button>
    </div>

    <div class="card-grid">
      ${allCards.length === 0
        ? '<div class="empty-state"><h2>🏠 No hay propiedades con decisión</h2><p>Ejecuta el pipeline para generar evaluaciones.</p></div>'
        : allCards.map(c => renderCard(c.asset, c.decision)).join('')
      }
    </div>

    <footer class="dashboard-footer">
      Hermes Dashboard · ${new Date().toLocaleString('es-PA')} · ${totalWithDecision} propiedades · Actualizado vía Supabase
    </footer>
  `

  // ── Filter listeners ──────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentFilter = btn.dataset.filter
      applyFilter()
    })
  })

  // ── Toggle detail listeners ───────────────────────────────────
  document.querySelectorAll('.toggle-detail').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target)
      if (target) {
        target.classList.toggle('hidden')
        btn.textContent = target.classList.contains('hidden') ? '▶ Ver detalles completos' : '▼ Ocultar detalles'
      }
    })
  })
}

function applyFilter() {
  const cards = document.querySelectorAll('.card')
  cards.forEach(card => {
    const action = card.dataset.action
    if (currentFilter === 'ALL' || action === currentFilter) {
      card.style.display = ''
    } else {
      card.style.display = 'none'
    }
  })

  // Show empty state if filtered results are empty
  const visibleCards = [...cards].filter(c => c.style.display !== 'none').length
  const existingEmpty = document.querySelector('.empty-state-filtered')
  if (visibleCards === 0 && cards.length > 0) {
    if (!existingEmpty) {
      const grid = document.querySelector('.card-grid')
      const el = document.createElement('div')
      el.className = 'empty-state empty-state-filtered'
      el.innerHTML = '<h2>🔍 Sin resultados</h2><p>Ninguna propiedad coincide con este filtro.</p>'
      grid.appendChild(el)
    }
  } else if (existingEmpty) {
    existingEmpty.remove()
  }
}

function renderCard(asset, decision) {
  let components = null
  try {
    components = typeof decision?.risk_factors === 'object'
      ? {
          estimated_value: decision.risk_factors?.estimated_value || null,
          discount_pct: decision.risk_factors?.discount_pct || null,
        }
      : null
  } catch (_) {}

  const estimatedValue = components?.estimated_value || null
  const discountPct = components?.discount_pct || null
  const finalScore = decision?.opportunity_score || null
  const confidence = decision?.confidence_score || null
  const action = decision?.recommended_action || 'AVOID'
  const thesis = decision?.thesis_text || ''
  const cleanThesis = thesis ? thesis.replace(cleanTitleForDisplay(asset?.title || ''), cleanTitleForDisplay(asset?.title || '').slice(0, 60)).trim() : ''

  const price = parseFloat(asset.price_amount) || 0
  const loc = asset.location || {}
  const locStr = cleanLocationForDisplay(loc)

  const displayAction = action === 'RESEARCH_MORE' ? 'WATCH' : action

  // ── Professional structured fields ──
  const owner = asset.owner_name || (asset.raw_data?.seller) || ''
  const raw = asset.raw_data || {}
  const areaM2 = raw.area_m2 || ''
  const bedrooms = raw.bedrooms || ''
  const bathrooms = raw.bathrooms || ''
  const parking = raw.parking || ''

  // Clean title at display time
  const displayTitle = cleanTitleForDisplay(asset.title)

  // Build specs string
  const specs = [bedrooms && `${bedrooms} hab`, bathrooms && `${bathrooms} bañ`, areaM2 && `${areaM2} m²`, parking && `${parking} estac.`].filter(Boolean).join(' · ')

  return `
    <div class="card" data-action="${action}">
      <div class="card-header">
        <div class="card-title">
          <div class="property-meta">
            ${owner ? `<span class="owner-tag">🏢 ${owner}</span>` : ''}
            <span class="loc-tag">📍 ${locStr}</span>
          </div>
          <h3>${displayTitle}</h3>
        </div>
        <div class="card-badges">
          ${actionBadge(displayAction)}
          <span class="grade-badge ${gradeClass(decision?.opportunity_score > 80 ? 'A' : decision?.opportunity_score > 60 ? 'B' : decision?.opportunity_score > 40 ? 'C' : 'D')}">
            ${finalScore != null ? finalScore + '/100' : '?'}
          </span>
        </div>
      </div>

      <div class="card-body">
        <div class="card-col card-col-left">
          <div class="price-row">
            <span class="price-main">${formatPrice(price)}</span>
            ${specs ? `<span class="specs-tag">${specs}</span>` : ''}
          </div>
          <div class="info-row ${discountPct > 5 ? 'positive' : discountPct < -5 ? 'negative' : ''}">
            <span class="info-label">📊 Valor Estimado</span>
            <span class="info-value">${formatPrice(estimatedValue)} <span class="info-sub">(${formatPct(discountPct)})</span></span>
          </div>
          <div class="info-row"><span class="info-label">🎯 Confianza</span><span class="info-value">${confidence != null ? confidence + '%' : '—'}</span></div>
          <div class="info-row"><span class="info-label">🔗 URL</span>
            <span class="info-value">
              ${asset.source_listing_url
                ? `<a href="${asset.source_listing_url}" target="_blank" rel="noopener" class="btn-link">Ver anuncio ↗</a>`
                : '—'}
            </span>
          </div>
        </div>

        <div class="card-col card-col-right">
          <div class="explain-box">
            <h4>🧠 Tesis de inversión</h4>
            <p class="thesis-text">${cleanThesis || 'No hay tesis disponible'}</p>
            ${renderScoreFactors(decision)}
          </div>
        </div>
      </div>

      <button class="toggle-detail" data-target="detail-${asset.asset_id?.slice(0, 8)}">▶ Ver detalles completos</button>
      <div id="detail-${asset.asset_id?.slice(0, 8)}" class="card-detail hidden">
        ${renderScoreDetails(asset, decision)}
      </div>
    </div>`
}

function renderScoreFactors(decision) {
  const factors = decision?.risk_factors || {}
  const lines = []
  if (factors.score_grade) lines.push(`Nota: ${factors.score_grade}`)
  if (factors.confidence_pct) lines.push(`Confianza: ${factors.confidence_pct}%`)
  if (factors.discount_pct != null) lines.push(`Descuento: ${formatPct(factors.discount_pct)}`)
  if (factors.estimated_value != null) lines.push(`Valor Est.: ${formatPrice(factors.estimated_value)}`)
  if (factors.comparable_quality != null) lines.push(`Calidad Comp.: ${(Number(factors.comparable_quality) * 100).toFixed(0)}%`)

  if (lines.length === 0) return '<p class="dim">Sin datos de factores</p>'
  return '<ul class="factor-list">' + lines.map(l => `<li>${l}</li>`).join('') + '</ul>'
}

function renderScoreDetails(asset, decision) {
  const raw = asset?.raw_data || {}
  const loc = asset?.location || {}

  const specs = [
    raw.area_m2 && `${raw.area_m2} m²`,
    raw.bedrooms && `${raw.bedrooms} dorm.`,
    raw.bathrooms && `${raw.bathrooms} baños`,
    raw.parking && `${raw.parking} estac.`,
  ].filter(Boolean).join(' · ')

  const sourceMeta = [
    asset?.scraped_at && `Scraping: ${new Date(asset.scraped_at).toLocaleDateString()}`,
    asset?.updated_at && `Actualizado: ${new Date(asset.updated_at).toLocaleDateString()}`,
  ].filter(Boolean).join(' | ')

  return `
    <div class="detail-grid">
      <div class="detail-item">
        <span class="detail-label">Especificaciones</span>
        <span>${specs || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Tipo</span>
        <span>${raw.property_type || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Vendedor</span>
        <span>${asset?.seller_type === 'agent' ? 'Agente/Agencia' : 'Dueño directo'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Propietario</span>
        <span>${asset?.owner_name || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">ID Activo</span>
        <span>${asset?.asset_id?.slice(0, 8) || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">ID Decisión</span>
        <span>${decision?.decision_id?.slice(0, 8) || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Tesis completa</span>
        <span>${cleanTitleForDisplay(decision?.thesis_text || '') || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Urgencia</span>
        <span>${decision?.urgency_level || '—'}/5</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Perfil</span>
        <span>${decision?.investment_profile || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Fuente</span>
        <span>${asset?.source_id || '—'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">metadata</span>
        <span class="dim">${sourceMeta || '—'}</span>
      </div>
    </div>
  `
}

// ── Inicio ──────────────────────────────────────────────────────────────
async function main() {
  app.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando dashboard...</p></div>'
  try {
    const data = await fetchAll()
    renderDashboard(data)
  } catch (err) {
    app.innerHTML = `<div class="error-state"><h2>❌ Error</h2><p>${err.message}</p></div>`
  }
}

main()
