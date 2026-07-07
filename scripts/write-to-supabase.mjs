#!/usr/bin/env node
/**
 * Write pipeline output to Supabase
 * Usage: node scripts/write-to-supabase.mjs [--file=path/to/pipeline-output.json]
 */
import { readFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const fileArg = args.find(a => a.startsWith('--file='))
const DEFAULT_FILE = resolve(ROOT, 'benchmark/reports/pipeline-1783046911514.json')
const inputPath = fileArg ? resolve(ROOT, fileArg.split('=')[1]) : DEFAULT_FILE

// Load env
function loadEnv() {
  const envPath = resolve(ROOT, '.env')
  if (!existsSync(envPath)) throw new Error('.env not found')
  const text = readFileSync(envPath, 'utf-8')
  const vars = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^(SUPABASE_\w+|DATABASE_\w+)=(.*)$/)
    if (m) vars[m[1]] = m[2].trim()
  }
  return vars
}

const ENV = loadEnv()
const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY)

// ── Source UUIDs (from DB seed) ───────────────────────────────────────────
const SOURCES = {
  encuentra24: '89ee5ff1-e448-4ef5-83eb-31252bd89806',
  'banco-nacional': '36553830-0a7e-4d6a-96a5-a061773a7da9',
  'caja-ahorros': '01045869-2ef5-4431-80f9-2924fd6e848f',
}

// ── Helpers ───────────────────────────────────────────────────────────────
function parseLocation(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    province: raw.province || '',
    district: raw.district || '',
    corregimiento: raw.corregimiento || '',
    neighborhood: raw.neighborhood || '',
  }
}

function gradeForScore(score) {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 70) return 'B'
  if (score >= 65) return 'B-'
  if (score >= 60) return 'C+'
  if (score >= 50) return 'C'
  if (score >= 40) return 'C-'
  if (score >= 30) return 'D'
  return 'F'
}

function profileForDecision(action) {
  switch (action) {
    case 'BUY_NOW': return 'value_investment'
    case 'WATCH': return 'appreciation'
    case 'WATCH_HIGH_PRIORITY': return 'appreciation'
    case 'NEGOTIATE': return 'flip_opportunity'
    case 'AVOID': return 'high_risk_opportunity'
    default: return 'value_investment'
  }
}

function mapDecision(action) {
  switch (action) {
    case 'BUY_NOW': return 'BUY_NOW'
    case 'WATCH': return 'WATCH_HIGH_PRIORITY'
    case 'NEGOTIATE': return 'NEGOTIATE'
    case 'AVOID': return 'AVOID'
    case 'MANUAL_REVIEW': return 'MANUAL_REVIEW_REQUIRED'
    default: return 'AVOID'
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n╔═══════════════════════════════════════════════╗`)
  console.log(`║     SUPABASE WRITER                          ║`)
  console.log(`╚═══════════════════════════════════════════════╝`)
  console.log(`  Input: ${inputPath}\n`)

  // Read input
  if (!existsSync(inputPath)) {
    console.error(`  ❌ File not found: ${inputPath}`)
    console.error(`  ℹ️  Run the pipeline first: node scripts/pipeline.mjs`)
    process.exit(1)
  }
  const data = JSON.parse(readFileSync(inputPath, 'utf-8'))
  const items = Array.isArray(data) ? data : [data]
  console.log(`  Items to process: ${items.length}\n`)

  let inserted = 0
  let errors = 0

  for (const item of items) {
    const asset = item.asset
    if (!asset) {
      console.log(`  ⚠️  Skipping item without asset data`)
      errors++
      continue
    }

    const sourceName = asset.source_id || 'encuentra24'
    const sourceUUID = SOURCES[sourceName]
    if (!sourceUUID) {
      console.log(`  ⚠️  Unknown source: ${sourceName}`)
      errors++
      continue
    }

    // 1. Insert asset
    const assetRow = {
      source_id: sourceUUID,
      source_listing_id: asset.asset_id || null,
      source_listing_url: asset.source_listing_url || null,
      vertical: asset.vertical || 'real_estate',
      status: (asset.status || 'active').toLowerCase(),
      title: (asset.title || '').replace(/[\n\r]+|Compare this ad|Add to favorites/g, ' ').replace(/\s+/g, ' ').trim() || null,
      description: (asset.description || '').trim() || null,
      price_amount: asset.price_amount || null,
      price_currency: asset.price_currency || 'USD',
      seller_type: asset.seller_type || null,
      tags: asset.tags || [],
      location: parseLocation(asset.location),
      scraped_at: new Date().toISOString(),
    }

    const { data: insertedAsset, error: assetErr } = await supabase
      .from('assets')
      .insert(assetRow)
      .select('asset_id')
      .single()

    if (assetErr) {
      // Try upsert on source_listing_id
      if (assetRow.source_listing_id) {
        const { error: upsertErr } = await supabase
          .from('assets')
          .upsert({ ...assetRow, source_listing_id: assetRow.source_listing_id }, {
            onConflict: 'source_id, source_listing_id',
            ignoreDuplicates: false,
          })
          .select('asset_id')
          .single()

        if (upsertErr) {
          console.log(`  ❌ Asset upsert error: ${upsertErr.message.slice(0, 100)}`)
          errors++
          continue
        }
      }
    }

    // Get the asset_id (either from insert or from a fallback query)
    let assetId = insertedAsset?.asset_id
    if (!assetId) {
      const { data: found } = await supabase
        .from('assets')
        .select('asset_id')
        .eq('source_id', sourceUUID)
        .eq('source_listing_id', asset.asset_id)
        .maybeSingle()
      assetId = found?.asset_id
    }

    if (!assetId) {
      console.log(`  ⚠️  Could not resolve asset_id for ${asset.title?.slice(0, 40)}`)
      errors++
      continue
    }

    // 2. Insert opportunity score
    const finalScore = item.score ?? 50
    const grade = item.grade || gradeForScore(finalScore)
    const confidence = item.confidence ?? 50

    const scoreRow = {
      asset_id: assetId,
      version: 1,
      components: {
        estimated_value: item.estimatedValue || null,
        discount_pct: item.discount || null,
        comparable_count: item.comparables?.length || 0,
        comp_prices: item.comparables?.map(c => c.price) || [],
      },
      final_score: Math.round(finalScore),
      grade,
      confidence: Math.round(confidence),
      model_version: 'opportunity-scorer-v1.1',
    }

    const { data: insertedScore, error: scoreErr } = await supabase
      .from('opportunity_scores')
      .insert(scoreRow)
      .select('score_id')
      .single()

    if (scoreErr) {
      console.log(`  ⚠️  Score insert error: ${scoreErr.message.slice(0, 80)}`)
    }

    // 3. Insert investment decision
    const decisionAction = mapDecision(item.decision || 'AVOID')
    const decisionRow = {
      asset_id: assetId,
      opportunity_score_id: insertedScore?.score_id || null,
      opportunity_score: Math.round(finalScore),
      confidence_score: Math.round(confidence),
      investment_profile: profileForDecision(item.decision),
      recommended_action: decisionAction,
      thesis_text: `${grade} rated ${assetRow.title || 'property'} at ${assetRow.price_amount ? '$' + assetRow.price_amount : 'unknown price'}. Score: ${Math.round(finalScore)}/100. Confidence: ${Math.round(confidence)}%.`,
      urgency_level: finalScore >= 70 ? 4 : finalScore >= 50 ? 3 : 2,
      capital_recommendation: {
        max_bid_pct: item.discount ? Math.max(0, 100 + item.discount) : 100,
        hold_period_months: finalScore >= 70 ? 12 : 24,
      },
      risk_factors: {
        score_grade: grade,
        confidence_pct: confidence,
        comparable_quality: item.comparables?.[0]?.quality_score || null,
      },
    }

    const { error: decisionErr } = await supabase
      .from('investment_decisions')
      .insert(decisionRow)

    if (decisionErr) {
      console.log(`  ⚠️  Decision insert error: ${decisionErr.message.slice(0, 80)}`)
    }

    console.log(`  ✅ ${assetRow.title?.slice(0, 50) || 'Untitled'} → ${grade} (${Math.round(finalScore)})`)
    inserted++
  }

  console.log(`\n═══════════════════════════════════════════════`)
  console.log(`  ✅ Inserted: ${inserted}`)
  console.log(`  ❌ Errors: ${errors}`)
  console.log(`═══════════════════════════════════════════════\n`)
}

main().catch(err => {
  console.error(`\n  ❌ Fatal: ${err.message}`)
  process.exit(1)
})
