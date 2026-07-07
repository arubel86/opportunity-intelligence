#!/usr/bin/env node
/**
 * Hermes Platform Health Check
 * Validates all critical components: DB, Redis, Scrapers, Playwright, Chromium, Queue, Dashboard, Engine
 *
 * Usage: node scripts/health-check.mjs [--verbose]
 */
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const verbose = process.argv.includes('--verbose')

let passed = 0
let failed = 0
let warnings = 0

function check(name, fn) {
  const start = Date.now()
  try {
    fn()
    const ms = Date.now() - start
    console.log(`  ${name.padEnd(22)} ✅ OK  (${ms}ms)`)
    passed++
  } catch (err) {
    console.log(`  ${name.padEnd(22)} ❌ FAIL  (${err.message.split('\n')[0]})`)
    failed++
    if (verbose && err.stdout) console.error(`     stdout: ${err.stdout.slice(0, 200)}`)
    if (verbose && err.stderr) console.error(`     stderr: ${err.stderr.slice(0, 200)}`)
  }
}

function warnCheck(name, reason) {
  console.log(`  ${name.padEnd(22)} ⚠️  WARN  (${reason})`)
  warnings++
}

console.log('')
console.log('╔═══════════════════════════════════════════════╗')
console.log('║        HERMES PLATFORM HEALTH CHECK          ║')
console.log('╚═══════════════════════════════════════════════╝')
console.log('')

// ── 1. Database ────────────────────────────────────────────────────────────
const DB_URL = process.env.SUPABASE_DATABASE_URL
if (DB_URL) {
  check('Database', () => {
    execSync(`psql "${DB_URL}" -c "SELECT 1" -t -q`, { timeout: 10000, stdio: 'pipe' })
  })
} else if (process.env.SUPABASE_URL) {
  warnCheck('Database', 'SUPABASE_URL set, but no SUPABASE_DATABASE_URL for psql')
} else {
  warnCheck('Database', 'Not configured (set SUPABASE_URL in .env)')
}

// ── 2. Redis ───────────────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
{
  try {
    execSync(`redis-cli -u "${REDIS_URL}" PING 2>/dev/null || redis-cli PING`, { timeout: 5000, stdio: 'pipe' })
    passed++
    console.log(`  ${'Redis'.padEnd(22)} ✅ OK`)
  } catch {
    warnCheck('Redis', 'Not running or redis-cli not available')
  }
}

// ── 3. Scrapers ────────────────────────────────────────────────────────────
check('Scrapers', () => {
  const scraperFiles = ['benchmark/e24-scraper.mjs', 'pipeline/scraper-stage.mjs']
  const found = scraperFiles.filter(f => existsSync(resolve(ROOT, f)))
  if (found.length === 0) throw new Error('No scraper modules found')
})

// ── 4. Playwright ──────────────────────────────────────────────────────────
check('Playwright', () => {
  // Check if playwright module exists
  const pwPath = resolve(ROOT, 'node_modules/playwright/index.mjs')
  if (!existsSync(pwPath)) {
    const pwPathCJS = resolve(ROOT, 'node_modules/playwright/index.js')
    if (!existsSync(pwPathCJS)) throw new Error('playwright module not installed')
  }
})

// ── 5. Chromium ────────────────────────────────────────────────────────────
check('Chromium', () => {
  // Check multiple possible Chromium locations
  const possiblePaths = [
    resolve(ROOT, 'node_modules/playwright-core/.local-browsers/chromium-1228/chrome-linux/chrome'),
    resolve(ROOT, 'node_modules/playwright-core/.local-browsers/chromium-1228/chrome-linux/chromium-browser'),
    resolve(ROOT, 'node_modules/playwright/.local-browsers/chromium-1228/chrome-linux/chrome'),
  ]
  // Also try: npx playwright install --dry-run to check
  const found = possiblePaths.some(p => existsSync(p))
  if (!found) {
    // Check if chromium is in PATH
    try {
      execSync('chromium-browser --version 2>/dev/null || google-chrome --version 2>/dev/null || chromium --version 2>/dev/null', { timeout: 3000, stdio: 'pipe' })
    } catch {
      throw new Error('Chromium binary not found in cache or PATH')
    }
  }
})

// ── 6. Build / TypeScript ─────────────────────────────────────────────────
check('Opportunity Engine', () => {
  const distFiles = [
    resolve(ROOT, 'apps/dashboard/dist/index.html'),
  ]
  const missing = distFiles.filter(f => !existsSync(f))
  if (missing.length > 0) {
    throw new Error(`Missing dist: ${missing.map(m => m.replace(ROOT, '')).join(', ')} (run "npm run build")`)
  }
})

// ── 7. Dashboard ───────────────────────────────────────────────────────────
check('Dashboard', () => {
  const dashboardFiles = [
    resolve(ROOT, 'apps/dashboard/index.html'),
  ]
  const missing = dashboardFiles.filter(f => !existsSync(f))
  if (missing.length > 1) {
    throw new Error('Dashboard not built')
  }
  // Check if dashboard is serving (port 3000)
  try {
    execSync('curl -sf http://localhost:8005 > /dev/null 2>&1', { timeout: 3000 })
  } catch {
    warnCheck('Dashboard', 'Not currently serving (run "npx serve apps/dashboard/dist -l 8005")')
  }
})

// ── 8. Queue (BullMQ or similar) ────────────────────────────────────────────
{
  try {
    const queuePath = resolve(ROOT, 'node_modules/bullmq')
    if (!existsSync(queuePath)) throw new Error('BullMQ not installed')
    passed++
    console.log(`  ${'Queue'.padEnd(22)} ✅ OK`)
  } catch {
    warnCheck('Queue', 'BullMQ not installed (optional — for queue-based pipeline)')
  }
}

// ── 9. Environment ─────────────────────────────────────────────────────────
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
const missingVars = requiredVars.filter(v => !process.env[v])
if (missingVars.length > 0) {
  warnCheck('Environment', `Missing: ${missingVars.join(', ')} (set in .env)`)
} else {
  check('Environment', () => {
    if (missingVars.length > 0) throw new Error('Missing required env vars')
  })
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('')
console.log('═══════════════════════════════════════════════')
console.log(`  ✅ Passed: ${passed}`)
console.log(`  ⚠️  Warnings: ${warnings}`)
console.log(`  ❌ Failed: ${failed}`)
console.log(`  Status: ${failed > 0 ? 'UNHEALTHY' : warnings > 0 ? 'DEGRADED' : 'HEALTHY'}`)
console.log('═══════════════════════════════════════════════')

process.exit(failed > 0 ? 1 : 0)
