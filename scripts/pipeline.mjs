#!/usr/bin/env node
/**
 * Hermes Automated Pipeline — Orchestrator
 *
 * Coordinates pipeline stages in order:
 *   Scrape → Normalize → Validate → Score → Decide → Persist → Report
 *
 * Usage: node scripts/pipeline.mjs [--limit=10] [--source=encuentra24]
 */

import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

import './config.mjs'

// ── Logger ────────────────────────────────────────────────────────────────
import { log as rawLogger } from './logger.mjs'

// ── Parse args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10')
const SOURCE = args.find(a => a.startsWith('--source='))?.split('=')[1] || 'encuentra24'

// ── Report accumulator (shared mutable state across stages) ───────────────
function createReport() {
  return {
    pipeline: { started_at: new Date().toISOString(), pipeline_version: '2.0.0' },
    scraper: { source: SOURCE, found: 0, new: 0, updated: 0, discarded: 0, duration_ms: 0 },
    normalizer: { processed: 0, errors: 0, duration_ms: 0 },
    scorer: { analyzed: 0, buy_now: 0, watch: 0, negotiate: 0, avoid: 0, duration_ms: 0 },
    database: { inserted: 0, updated: 0, unchanged: 0, deactivated: 0, errors: 0, duration_ms: 0, avg_time_per_asset_ms: 0 },
    dashboard: { updated: false, duration_ms: 0 },
    report: { generated: false },
    total_duration_ms: 0,
    pipeline_run_id: null,
  }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now()
  const report = createReport()

  // Print header
  console.log('')
  console.log('╔═══════════════════════════════════════════════╗')
  console.log('║       HERMES AUTOMATED PIPELINE              ║')
  console.log(`║       Source: ${SOURCE.padEnd(31)}║`)
  console.log(`║       Limit: ${String(LIMIT).padEnd(32)}║`)
  console.log('╚═══════════════════════════════════════════════╝')
  console.log('')

  // ── Supabase client (shared across scoring, persistence) ────────────────
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let supabase = null
  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import('@supabase/supabase-js')
    supabase = createClient(supabaseUrl, supabaseKey)
  }

  // ── Shared context passed through stages ───────────────────────────────
  const ctx = {
    source: SOURCE,
    limit: LIMIT,
    log: rawLogger,
    report,
    supabase,
    _startTime: startTime,
  }

  // ── Stage 1: Scrape ────────────────────────────────────────────────────
  const { run: scrape } = await import(pathToFileURL(resolve(ROOT, 'pipeline/scraper-stage.mjs')).href)
  ctx.listings = await scrape(ctx)

  // ── Stage 2: Normalize ────────────────────────────────────────────────
  const { run: normalize } = await import(pathToFileURL(resolve(ROOT, 'pipeline/normalize-stage.mjs')).href)
  ctx.normalized = await normalize(ctx)

  // ── Stage 3: Validate ──────────────────────────────────────────────────
  const { run: validate } = await import(pathToFileURL(resolve(ROOT, 'pipeline/validation-stage.mjs')).href)
  ctx.validated = await validate(ctx)

  // ── Stage 4: Score ─────────────────────────────────────────────────────
  const { run: score } = await import(pathToFileURL(resolve(ROOT, 'pipeline/scoring-stage.mjs')).href)
  ctx.scored = await score(ctx)

  // ── Stage 5: Decide ────────────────────────────────────────────────────
  const { run: decide } = await import(pathToFileURL(resolve(ROOT, 'pipeline/decision-stage.mjs')).href)
  ctx.decided = await decide(ctx)

  // ── Stage 6: Persist (DB) ──────────────────────────────────────────────
  const { run: persist } = await import(pathToFileURL(resolve(ROOT, 'pipeline/persistence-stage.mjs')).href)
  const persistResult = await persist(ctx)
  ctx.pipeline_run_id = persistResult.pipeline_run_id

  // ── Stage 7: Notify & Alert ───────────────────────────────────────────
  const { run: notifyStage } = await import(pathToFileURL(resolve(ROOT, 'pipeline/notification-stage.mjs')).href)
  await notifyStage(ctx)

  // ── Stage 8: Report ─────────────────────────────────────────────────────
  const { run: reportStage } = await import(pathToFileURL(resolve(ROOT, 'pipeline/reporting-stage.mjs')).href)
  await reportStage(ctx)

  // ── Done ────────────────────────────────────────────────────────────────
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
