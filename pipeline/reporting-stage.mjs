/**
 * Pipeline Stage: Reporter
 * Updates dashboard metrics, generates JSON report, prints console summary.
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

/**
 * Generate all reports and update dashboard metrics.
 * @param {object} ctx Pipeline context { decided, source, limit, log, report, pipeline_run_id }
 * @returns {Promise<void>}
 */
export async function run(ctx) {
  const { decided, source, log, report, pipeline_run_id } = ctx
  const logStage = log.module('REPORTER')

  // ── Step 1: Dashboard Metrics ─────────────────────────────────────────
  logStage.section('DASHBOARD')
  const dashStart = Date.now()

  const dashboardData = {
    total_assets: decided.length,
    new_assets: report.database.inserted,
    updated_assets: report.database.updated,
    unchanged_assets: report.database.unchanged,
    deactivated_assets: report.database.deactivated,
    buy_now_count: report.scorer.buy_now,
    watch_high_count: report.scorer.watch_high,
    negotiate_count: report.scorer.negotiate,
    watch_count: report.scorer.watch,
    avoid_count: report.scorer.avoid,
    avg_score: decided.length > 0
      ? Math.round(decided.reduce((s, r) => s + r.score, 0) / decided.length)
      : 0,
    avg_confidence: decided.length > 0
      ? Math.round(decided.reduce((s, r) => s + r.confidence, 0) / decided.length)
      : 0,
    pipeline_run_id,
    updated_at: new Date().toISOString(),
  }

  // Save local cache
  writeFileSync(
    resolve(ROOT, 'benchmark/reports/dashboard-metrics.json'),
    JSON.stringify(dashboardData, null, 2)
  )

  // Update Supabase
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const db = createClient(supabaseUrl, supabaseKey)
      await db.from('dashboard_metrics')
        .upsert({ metric_key: 'pipeline_summary', metric_value: dashboardData }, { onConflict: 'metric_key' })
      logStage.info('Supabase dashboard_metrics updated')
    } catch (e) {
      logStage.warn(`Dashboard metrics sync skipped: ${e.message}`)
    }
  }

  report.dashboard.updated = true
  report.dashboard.duration_ms = Date.now() - dashStart
  logStage.info('Dashboard metrics updated')
  logStage.stats({ 'Dashboard time': log.module().duration(report.dashboard.duration_ms) })

  // ── Step 2: Generate JSON Report ──────────────────────────────────────
  logStage.section('REPORT')
  const reportStart = Date.now()
  report.pipeline.finished_at = new Date().toISOString()
  report.total_duration_ms = Date.now() - (ctx._startTime || Date.now())
  report.report.generated = true

  writeFileSync(
    resolve(ROOT, 'benchmark/reports/pipeline-report.json'),
    JSON.stringify(report, null, 2)
  )
  report.report.duration_ms = Date.now() - reportStart
  logStage.info('Pipeline report generated')

  // ── Step 3: Update Pipeline Run ───────────────────────────────────────
  if (supabaseUrl && supabaseKey && pipeline_run_id) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const db = createClient(supabaseUrl, supabaseKey)
      await db.from('pipeline_runs')
        .update({
          status: 'completed',
          assets_scraped: report.scraper.found,
          assets_normalized: report.normalizer.processed,
          assets_scored: report.scorer.analyzed,
          decisions_generated: report.scorer.analyzed,
          assets_inserted: report.database.inserted,
          assets_updated: report.database.updated,
          assets_unchanged: report.database.unchanged,
          assets_deactivated: report.database.deactivated,
          errors_count: report.database.errors,
          finished_at: new Date().toISOString(),
          duration_ms: report.total_duration_ms,
          avg_time_per_asset_ms: report.database.avg_time_per_asset_ms,
          error_log: report.database.errors > 0 ? JSON.stringify({ errors: report.database.errors }) : null,
        })
        .eq('run_id', pipeline_run_id)
      logStage.info('Pipeline run updated with completion status')
    } catch (e) {
      logStage.warn(`Pipeline run update skipped: ${e.message}`)
    }
  }

  // ── Step 4: Console Summary ───────────────────────────────────────────
  const totalSecs = (report.total_duration_ms / 1000).toFixed(1)
  console.log(`\n╔═══════════════════════════════════════════════╗`)
  console.log(`║           PIPELINE COMPLETE                   ║`)
  console.log(`╚═══════════════════════════════════════════════╝`)
  console.log(`\n  Pipeline Summary`)
  console.log(`  ═══════════════`)
  console.log(`  Assets encontrados:         ${report.scraper.found}`)
  console.log(`  Assets nuevos:              ${report.database.inserted}`)
  console.log(`  Assets actualizados:        ${report.database.updated}`)
  console.log(`  Assets sin cambios:         ${report.database.unchanged}`)
  console.log(`  Assets desactivados:        ${report.database.deactivated}`)
  console.log(`  Assets descartados:         ${report.normalizer.errors}`)
  console.log(`  Errores:                    ${report.database.errors}`)
  console.log('')
  console.log(`  Opportunities generadas:    ${report.scorer.analyzed}`)
  console.log(`  BUY_NOW:                    ${report.scorer.buy_now}`)
  console.log(`  WATCH_HIGH:                 ${report.scorer.watch_high}`)
  console.log(`  NEGOTIATE:                  ${report.scorer.negotiate}`)
  console.log(`  WATCH:                      ${report.scorer.watch}`)
  console.log(`  AVOID:                      ${report.scorer.avoid}`)
  console.log('')
  console.log(`  Tiempo total:               ${totalSecs} segundos`)
  console.log(`  Tiempo promedio por asset:  ${report.database.avg_time_per_asset_ms}ms`)
  console.log(`  Pipeline version:           2.0.0`)
  console.log(`  Source:                     ${source}`)
  console.log(`  Pipeline Run ID:            ${pipeline_run_id || 'N/A'}`)
  console.log(`\n  ✅ Pipeline completed successfully.`)
  console.log(`  📊 Report: benchmark/reports/pipeline-report.json`)
  console.log(`  📈 Dashboard: apps/dashboard/index.html\n`)
}
