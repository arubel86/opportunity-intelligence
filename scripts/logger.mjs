/**
 * Hermes Structured Logger
 * Professional log output with consistent format for all pipeline processes.
 *
 * Usage:
 *   import { log } from './scripts/logger.mjs'
 *   log.module('SCRAPER').info('37 propiedades nuevas', { tiempo: '34s' })
 */
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }
const LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase()
const THRESHOLD = LEVELS[LEVEL] ?? 1

const SEPARATOR = '─'.repeat(28)

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function formatVal(v) {
  if (v === null || v === undefined) return '—'
  return String(v)
}

function shouldLog(lvl) {
  return (LEVELS[lvl] ?? 0) >= THRESHOLD
}

export const log = {
  module(name = 'HERMES') {
    const prefix = `[${name}]`

    return {
      debug(...args) {
        if (!shouldLog('debug')) return
        console.debug(`${timestamp()}  ${prefix} ${args.join(' ')}`)
      },

      info(msg, meta = {}) {
        if (!shouldLog('info')) return
        const metaStr = Object.entries(meta)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${k}: ${formatVal(v)}`)
          .join(' │ ')
        console.log(`\n${prefix}`)
        console.log(`  ${msg}`)
        if (metaStr) console.log(`  ${metaStr}`)
        console.log(`  ${SEPARATOR}`)
      },

      stats(items) {
        if (!shouldLog('info')) return
        for (const [label, value] of Object.entries(items)) {
          console.log(`  ${label}: ${formatVal(value)}`)
        }
      },

      warn(msg) {
        if (!shouldLog('warn')) return
        console.warn(`${timestamp()}  ⚠️  ${prefix} ${msg}`)
      },

      error(msg, err = null) {
        if (!shouldLog('error')) return
        console.error(`${timestamp()}  ❌ ${prefix} ${msg}`)
        if (err) console.error(`     ${err.message || err}`)
      },

      separator() {
        console.log(`  ${SEPARATOR}`)
      },

      blank() {
        console.log('')
      },

      section(title) {
        console.log(`\n  ═══ ${title} ═══`)
      },

      duration(ms) {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(1)}s`
      },
    }
  },
}

export default log
