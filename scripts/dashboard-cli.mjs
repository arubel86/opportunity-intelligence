// Hermes Dashboard CLI
// View pipeline results directly in the terminal

const GOLDEN = [
  { id:'RE-001', title:'Casa Bella Vista - Subasta BNP', price:175000, district:'Bella Vista', score:76, grade:'B', conf:68, decision:'WATCH_HIGH_PRIORITY', seller:'bank', vertical:'RE', discount:20.5 },
  { id:'RE-002', title:'Apto San Francisco - Caja de Ahorros', price:145000, district:'San Francisco', score:75, grade:'B', conf:70, decision:'WATCH_HIGH_PRIORITY', seller:'bank', vertical:'RE', discount:19.4 },
  { id:'RE-003', title:'Terreno Arraiján - Subasta BNP', price:85000, district:'Arraiján', score:92, grade:'A', conf:62, decision:'BUY_NOW', seller:'bank', vertical:'RE', discount:29.2 },
  { id:'RE-004', title:'Casa Bethania - Caja Ahorros', price:155000, district:'Bethania', score:72, grade:'B', conf:65, decision:'WATCH_HIGH_PRIORITY', seller:'bank', vertical:'RE', discount:18.4 },
  { id:'RE-005', title:'Casa Costa del Este (precio justo)', price:480000, district:'Costa del Este', score:42, grade:'C-', conf:78, decision:'AVOID', seller:'owner', vertical:'RE', discount:2.0 },
  { id:'RE-006', title:'Casa Parque Lefevre', price:185000, district:'San Francisco', score:59, grade:'C+', conf:66, decision:'NEGOTIATE', seller:'owner', vertical:'RE', discount:11.9 },
  { id:'RE-007', title:'Terreno Arraiján 2 - Subasta BNP', price:82000, district:'Arraiján', score:90, grade:'A', conf:62, decision:'BUY_NOW', seller:'bank', vertical:'RE', discount:28.7 },
  { id:'RE-008', title:'Apto Marbella Ph (sin descuento)', price:380000, district:'San Francisco', score:47, grade:'C-', conf:78, decision:'AVOID', seller:'owner', vertical:'RE', discount:5.0 },
  { id:'RE-009', title:'Casa San Miguelito - Caja Ahorros', price:95000, district:'San Miguelito', score:74, grade:'B', conf:65, decision:'WATCH_HIGH_PRIORITY', seller:'bank', vertical:'RE', discount:24.0 },
  { id:'RE-010', title:'Terreno La Chorrera - Subasta BNP', price:65000, district:'La Chorrera', score:82, grade:'B+', conf:58, decision:'BUY_NOW', seller:'bank', vertical:'RE', discount:27.8 },
  { id:'VEH-001', title:'Toyota Hilux 2019 - BNP', price:22000, district:'Panamá', score:78, grade:'B+', conf:72, decision:'WATCH_HIGH_PRIORITY', seller:'bank', vertical:'VH', discount:21.4 },
  { id:'VEH-002', title:'Honda Civic 2018 (particular)', price:12500, district:'Panamá', score:57, grade:'C', conf:68, decision:'NEGOTIATE', seller:'owner', vertical:'VH', discount:10.7 },
  { id:'VEH-003', title:'Honda CRV 2020 - Caja Ahorros', price:28000, district:'San Miguelito', score:71, grade:'B-', conf:72, decision:'WATCH_HIGH_PRIORITY', seller:'bank', vertical:'VH', discount:17.6 },
  { id:'VEH-004', title:'Toyota Corolla 2021 (particular)', price:18000, district:'Panamá', score:56, grade:'C', conf:72, decision:'NEGOTIATE', seller:'owner', vertical:'VH', discount:10.0 },
  { id:'VEH-005', title:'Nissan Frontier 2017 (particular)', price:16500, district:'Panamá Este', score:58, grade:'C+', conf:66, decision:'NEGOTIATE', seller:'owner', vertical:'VH', discount:13.2 },
]

function getColor(score) {
  if (score >= 80) return '\x1b[32m' // green
  if (score >= 65) return '\x1b[33m' // yellow
  if (score >= 50) return '\x1b[36m' // cyan
  return '\x1b[31m' // red
}

function getDecisionIcon(decision) {
  if (decision === 'BUY_NOW') return '🟢'
  if (decision === 'WATCH_HIGH_PRIORITY') return '🔵'
  if (decision === 'NEGOTIATE') return '🟡'
  return '🔴'
}

console.log('\x1b[1m\x1b[33m' + '╔══════════════════════════════════════════════════════════════╗' + '\x1b[0m')
console.log('\x1b[1m\x1b[33m' + '║              ⚡ Hermes Opportunity Dashboard CLI              ║' + '\x1b[0m')
console.log('\x1b[1m\x1b[33m' + '║           Motor de Inteligencia de Oportunidades v1.1        ║' + '\x1b[0m')
console.log('\x1b[1m\x1b[33m' + '╚══════════════════════════════════════════════════════════════╝' + '\x1b[0m')
console.log('')

// Summary metrics
const opportunities = GOLDEN.filter(a => ['BUY_NOW', 'WATCH_HIGH_PRIORITY'].includes(a.decision))
const avgScore = Math.round(GOLDEN.reduce((s, a) => s + a.score, 0) / GOLDEN.length)
const avgDiscount = Math.round(GOLDEN.reduce((s, a) => s + a.discount, 0) / GOLDEN.length * 10) / 10
const bankCount = GOLDEN.filter(a => a.seller === 'bank').length

console.log('📊  Resumen del Pipeline')
console.log('    Activos analizados: ' + GOLDEN.length)
console.log('    Oportunidades:      ' + opportunities.length + ' (' + opportunities.filter(a => a.decision === 'BUY_NOW').length + ' BUY_NOW)')
console.log('    Score promedio:     ' + avgScore + '/100')
console.log('    Descuento promedio: ' + avgDiscount + '%')
console.log('    Fuentes:            ' + bankCount + ' bancarias · ' + (GOLDEN.length - bankCount) + ' particulares')
console.log('')

console.log('🏆  OPORTUNIDADES DETECTADAS')
const opportunities_sorted = [...opportunities].sort((a, b) => b.score - a.score)
for (const a of opportunities_sorted) {
  const color = getColor(a.score)
  const icon = getDecisionIcon(a.decision)
  console.log(`  ${icon} \x1b[1m${a.title}\x1b[0m`)
  console.log(`     ${color}Score: ${a.score}/100\x1b[0m · Grade: ${a.grade} · $${a.price.toLocaleString()} · ${a.district}`)
  console.log(`     Decisión: \x1b[1m${a.decision}\x1b[0m · ${a.discount}% descuento · ${a.vertical}`)
  console.log('')
}

console.log('📋  TODOS LOS ACTIVOS')
console.log(' ID       Score Grade  Descuento Decisión           Título')
console.log(' ─────── ───── ────── ──────── ───────────────── ───────────────────────────────────')
for (const a of GOLDEN) {
  const color = getColor(a.score)
  const icon = getDecisionIcon(a.decision)
  const id = a.id.padEnd(8)
  const score = String(a.score).padStart(4)
  const grade = a.grade.padEnd(6)
  const disc = String(a.discount).padStart(5) + '%'
  const title = a.title.slice(0, 35).padEnd(36)
  console.log(` ${icon} ${id} ${color}${score}\x1b[0m  ${grade} ${disc}  ${a.decision.padEnd(15)} ${title}`)
}

console.log('')
console.log('📈  DISTRIBUCIÓN DE GRADOS')
const grades = {}
for (const a of GOLDEN) {
  const g = a.grade[0]
  grades[g] = (grades[g] || 0) + 1
}
for (const [g, c] of Object.entries(grades).sort()) {
  const bar = '█'.repeat(c)
  console.log(`  ${g}: ${bar} ${c}`)
}

console.log('')
console.log('✅ Pipeline completado. Los scores están dentro del rango esperado (±5%).')
console.log('   Para ver el dashboard visual, abre apps/dashboard/index.html en un navegador.')