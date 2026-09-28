#!/usr/bin/env node
/**
 * Hermes Automated Scheduler & Batch Pipeline Runner
 *
 * Runs scrapers periodically or executes a batch run across all configured sources.
 *
 * Usage:
 *   node scripts/scheduler.mjs --run-all             # Run all active sources once
 *   node scripts/scheduler.mjs --interval-hours=6    # Run periodically every 6 hours
 *   node scripts/scheduler.mjs --sources=caja-ahorros,banco-nacional,encuentra24
 */

import './config.mjs'
import { fork } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PIPELINE_SCRIPT = resolve(ROOT, 'scripts/pipeline.mjs')

// Fuentes prioritarias y activas por defecto
const DEFAULT_SOURCES = [
  'caja-ahorros',
  'banco-nacional',
  'encuentra24',
  'compreoalquile',
  'bac-panama',
  'e24-autos',
  'banco-nacional-autos',
  'caja-ahorros-autos'
]

// Argumentos CLI
const args = process.argv.slice(2)
const RUN_ALL_ONCE = args.includes('--run-all') || args.includes('--once')
const INTERVAL_HOURS = parseFloat(args.find(a => a.startsWith('--interval-hours='))?.split('=')[1] || '6')
const LIMIT_PER_SOURCE = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '20')
const CUSTOM_SOURCES = args.find(a => a.startsWith('--sources='))?.split('=')[1]?.split(',').map(s => s.trim())

const SOURCES_TO_RUN = CUSTOM_SOURCES && CUSTOM_SOURCES.length > 0 ? CUSTOM_SOURCES : DEFAULT_SOURCES

function logHeader(title) {
  console.log('\n' + '═'.repeat(60))
  console.log(`  ${title}`)
  console.log('═'.repeat(60))
}

/**
 * Ejecuta el pipeline para una fuente específica de forma aislada
 */
function runSourcePipeline(source, limit) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    console.log(`\n▶ [${new Date().toLocaleTimeString('es-PA')}] Iniciando extracción: ${source} (límite: ${limit})`)

    const child = fork(PIPELINE_SCRIPT, [`--source=${source}`, `--limit=${limit}`], {
      cwd: ROOT,
      env: process.env,
      stdio: 'inherit'
    })

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      if (code === 0) {
        console.log(`✔ [${source}] Completado exitosamente en ${duration}s`)
        resolve({ source, success: true, duration })
      } else {
        console.warn(`✖ [${source}] Finalizó con código de error ${code} en ${duration}s`)
        resolve({ source, success: false, code, duration })
      }
    })

    child.on('error', (err) => {
      console.error(`✖ [${source}] Error al ejecutar proceso:`, err.message)
      resolve({ source, success: false, error: err.message })
    })
  })
}

/**
 * Ejecuta el ciclo completo a través de todas las fuentes configuradas
 */
async function executeBatch() {
  logHeader(`HERMES BATCH EXTRACTION CYCLE — ${new Date().toLocaleString('es-PA')}`)
  console.log(`Fuentes a procesar (${SOURCES_TO_RUN.length}): ${SOURCES_TO_RUN.join(', ')}`)
  console.log(`Límite por fuente: ${LIMIT_PER_SOURCE} registros`)

  const results = []
  const overallStart = Date.now()

  for (const source of SOURCES_TO_RUN) {
    try {
      const res = await runSourcePipeline(source, LIMIT_PER_SOURCE)
      results.push(res)
    } catch (e) {
      console.error(`Error no controlado en fuente ${source}:`, e.message)
      results.push({ source, success: false, error: e.message })
    }
  }

  const totalSecs = ((Date.now() - overallStart) / 1000).toFixed(1)
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  logHeader('RESUMEN DEL CICLO DE EXTRACCIÓN')
  console.log(`Total de fuentes procesadas: ${results.length}`)
  console.log(`Exitosas: ${successful}`)
  console.log(`Fallidas: ${failed}`)
  console.log(`Tiempo total del ciclo: ${totalSecs} segundos\n`)
}

// ── MODO DE EJECUCIÓN ──
if (RUN_ALL_ONCE) {
  console.log('Modo de ejecución única (--run-all) seleccionado.')
  executeBatch().then(() => {
    console.log('Proceso batch completado. Saliendo.')
    process.exit(0)
  })
} else {
  console.log(`Scheduler iniciado. Intervalo de ejecución: cada ${INTERVAL_HOURS} horas.`)
  console.log('Ejecutando primer ciclo inmediatamente...')
  
  executeBatch()
  
  const intervalMs = INTERVAL_HOURS * 60 * 60 * 1000
  setInterval(() => {
    console.log(`\n⏰ [${new Date().toLocaleTimeString('es-PA')}] Disparando nuevo ciclo programado de extracción...`)
    executeBatch()
  }, intervalMs)
}
