/**
 * Pipeline Stage: Persistence
 * All database operations: pipeline run registration, asset upsert,
 * versioning, events, scoring, decisions, soft delete.
 */

import { SOURCE_UUIDS, computeContentHash, computeChangeReason,
         gradeForScore, profileForDecision, cleanTitle, extractExtraFields } from './utils.mjs'

/**
 * Persist all scored+decided assets to Supabase.
 * @param {object} ctx Pipeline context { decided, source, log, report }
 * @returns {Promise<object>} Updated context with pipeline_run_id
 */
export async function run(ctx) {
  const { decided, source, log, report } = ctx
  const dbStart = Date.now()
  const logStage = log.module('DATABASE')

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    logStage.info('Supabase not configured — saving to local JSON')
    return ctx // caller will handle file fallback
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)
  const knownAssetIds = new Set()
  let pipelineRunId = ctx.pipeline_run_id

  // ── Step 1: Pre-register pipeline run ──────────────────────────────────
  logStage.section('PIPELINE RUN')
  try {
    const { data: runRow, error: runErr } = await supabase
      .from('pipeline_runs')
      .insert({
        status: 'running',
        assets_scraped: report.scraper.found,
        assets_normalized: report.normalizer.processed,
        assets_scored: report.scorer.analyzed,
        errors_count: 0,
        started_at: report.pipeline.started_at,
        source,
        pipeline_version: '2.0.0',
      })
      .select('run_id')
      .maybeSingle()
    if (runErr) {
      logStage.warn(`Pipeline run registration error: ${runErr.message}`)
    } else if (runRow?.run_id) {
      pipelineRunId = runRow.run_id
      report.pipeline_run_id = pipelineRunId
      logStage.info(`Pipeline run registered: ${pipelineRunId.slice(0, 8)}...`)
    }
  } catch (e) {
    logStage.warn(`Pipeline run pre-registration skipped: ${e.message}`)
  }

  // ── Step 2: Process each asset ─────────────────────────────────────────
  for (const result of decided) {
    const asset = result.asset
    if (!asset) continue

    const sourceUUID = SOURCE_UUIDS[asset.source_id]
    if (!sourceUUID) {
      logStage.warn(`Unknown source: ${asset.source_id}, skipping`)
      report.database.errors++
      continue
    }

    const assetRow = {
      source_id: sourceUUID,
      source_listing_id: asset.asset_id || null,
      source_listing_url: asset.source_listing_url || null,
      vertical: asset.vertical || 'real_estate',
      status: (asset.status || 'active').toLowerCase(),
      title: cleanTitle(asset.title),
      description: (asset.description || '').trim() || null,
      price_amount: asset.price_amount || null,
      price_currency: asset.price_currency || 'USD',
      seller_type: asset.seller_type || null,
      tags: asset.tags || [],
      location: asset.location && typeof asset.location === 'object'
        ? { province: asset.location.province || '', district: asset.location.district || '', neighborhood: asset.location.neighborhood || '' }
        : null,
      scraped_at: new Date().toISOString(),
      raw_data: asset.raw_data || null,
    }

    const extraFields = extractExtraFields(asset)
    const contentHash = computeContentHash(assetRow)
    assetRow.content_hash = contentHash

    const listingId = asset.asset_id || asset.source_listing_id || `${sourceUUID}-${decided.indexOf(result)}`
    knownAssetIds.add(listingId)

    // Query existing asset for change detection
    let existingAsset = null
    if (assetRow.source_listing_id) {
      const { data: existing } = await supabase
        .from('assets')
        .select('asset_id, content_hash, title, price_amount, description, location, seller_type, status, tags')
        .eq('source_id', sourceUUID)
        .eq('source_listing_id', assetRow.source_listing_id)
        .maybeSingle()
      existingAsset = existing
    }

    // ── 2a. Atomic UPSERT ──────────────────────────────────────────────
    let assetId = null
    let upsErr = null
    try {
      const { data: upserted, error: err } = await supabase
        .from('assets')
        .upsert(assetRow, { onConflict: 'source_id,source_listing_id', ignoreDuplicates: false })
        .select('asset_id, content_hash')
        .maybeSingle()
      upsErr = err
      if (upserted?.asset_id) assetId = upserted.asset_id
    } catch (e) { upsErr = e }

    if (upsErr || !assetId) {
      logStage.warn(`Asset upsert error: ${(upsErr?.message || 'unknown').slice(0, 100)}`)
      report.database.errors++
      try {
        await supabase.from('asset_events').insert({
          asset_id: null,
          event_type: 'ASSET_REJECTED',
          pipeline_run_id: pipelineRunId,
          reason: `UPSERT failed: ${(upsErr?.message || 'unknown').slice(0, 120)}`,
          metadata: { source_listing_id: assetRow.source_listing_id, source: sourceUUID },
        })
      } catch (_) {}
      continue
    }

    const isNew = !existingAsset
    const oldHash = existingAsset?.content_hash || null
    const isChanged = existingAsset && oldHash !== contentHash
    const extraDiff = existingAsset ? {
      old_area_m2: extraFields.area_m2, new_area_m2: extraFields.area_m2,
      old_bedrooms: extraFields.bedrooms, new_bedrooms: extraFields.bedrooms,
      old_bathrooms: extraFields.bathrooms, new_bathrooms: extraFields.bathrooms,
      old_property_type: extraFields.property_type, new_property_type: extraFields.property_type,
    } : null

    if (isNew) report.database.inserted++
    else if (isChanged) report.database.updated++
    else report.database.unchanged++

    // ── 2b. Asset Version (only on change) ────────────────────────────
    if (isChanged) {
      let versionNumber = 1
      try {
        const { data: vd } = await supabase
          .from('asset_versions')
          .select('version_number')
          .eq('asset_id', assetId)
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle()
        versionNumber = (vd?.version_number || 0) + 1
      } catch (_) {}

      const changeReason = computeChangeReason(existingAsset, assetRow, extraDiff)
      const snapshot = { ...assetRow }
      delete snapshot.content_hash

      try {
        await supabase.from('asset_versions').insert({
          asset_id: assetId,
          version_number: versionNumber,
          snapshot_json: snapshot,
          changed_fields: changeReason === 'multiple_changes'
            ? ['title', 'description', 'price_amount', 'location', 'seller_type', 'status', 'tags']
                .filter(f => JSON.stringify(existingAsset[f]) !== JSON.stringify(assetRow[f]))
            : [changeReason?.replace('_changed', '') || 'unknown'],
          change_reason: changeReason,
          pipeline_run_id: pipelineRunId,
        })
      } catch (e) { logStage.warn(`Version insert: ${e.message?.slice(0, 80)}`) }
    }

    // ── 2c. Asset Event ──────────────────────────────────────────────
    try {
      await supabase.from('asset_events').insert({
        asset_id: assetId,
        event_type: isNew ? 'ASSET_CREATED' : isChanged ? 'ASSET_UPDATED' : 'ASSET_UNCHANGED',
        pipeline_run_id: pipelineRunId,
        reason: isNew ? 'New asset discovered'
          : isChanged ? `Updated: ${computeChangeReason(existingAsset, assetRow, extraDiff) || 'content_changed'}`
          : 'No changes detected',
        metadata: { content_hash, previous_hash: oldHash, price: assetRow.price_amount, title: assetRow.title?.slice(0, 80) },
      })
    } catch (_) {}

    // ── 2d. Insert / Update Opportunity Score ──────────────────────────
    const finalScore = result.score ?? 50
    const grade = result.grade || gradeForScore(finalScore)
    const confidence = result.confidence ?? 50
    let scoreId = null
    try {
      // Check if a score already exists for this asset + pipeline run
      const { data: existingScore } = await supabase
        .from('opportunity_scores')
        .select('score_id, version')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const currentVersion = existingScore?.version || 0
      const scoreRow = {
        asset_id: assetId,
        version: currentVersion + 1,
        components: {
          estimated_value: result.estimatedValue || null,
          discount_pct: result.discount || null,
          comparable_count: result.comparables?.length || 0,
          comp_prices: result.comparables?.map(c => c.price) || [],
          comp_titles: result.comparables?.map(c => c.title || c.match_reason || '')?.slice(0, 5) || [],
          comp_quality_scores: result.comparables?.map(c => c.quality_score) || [],
          score_factors: result.scoreFactors || null,
        },
        final_score: Math.round(finalScore),
        grade,
        confidence: Math.round(confidence),
        model_version: 'opportunity-scorer-v2.0',
      }

      const { data: sr, error: scoreErr } = await supabase
        .from('opportunity_scores')
        .insert(scoreRow)
        .select('score_id')
        .maybeSingle()
      if (scoreErr) throw scoreErr
      if (sr?.score_id) scoreId = sr.score_id
    } catch (e) {
      logStage.warn(`Score insert error: ${e.message?.slice(0, 80)}`)
    }

    // ── 2e. Store Comparables in comparisons table ─────────────────────
    if (scoreId && result.comparables?.length > 0) {
      // Remove old comparables for this asset first (fresh each run)
      try {
        await supabase.from('comparisons').delete().eq('asset_id', assetId)
      } catch (_) {}

      for (const comp of result.comparables) {
        try {
          // Look up comp_asset_id from db if we have it
          let compAssetId = comp.comp_asset_id || null
          if (!compAssetId && comp.source_listing_id) {
            const { data: ca } = await supabase
              .from('assets')
              .select('asset_id')
              .eq('source_listing_id', comp.source_listing_id)
              .maybeSingle()
            if (ca) compAssetId = ca.asset_id
          }

          await supabase.from('comparisons').insert({
            asset_id: assetId,
            comp_asset_id: compAssetId,
            price: comp.price || null,
            distance_km: comp.distance_km || null,
            age_days: comp.age_days || null,
            quality_score: comp.quality_score || null,
            match_reason: comp.match_reason || '',
            created_at: new Date().toISOString(),
          })
        } catch (e) {
          logStage.warn(`Comparable insert: ${e.message?.slice(0, 80)}`)
        }
      }
      logStage.info(`Stored ${result.comparables.length} comparables for ${assetId.slice(0, 8)}`)
    }

    // ── 2f. Insert Investment Decision ──────────────────────────────────
    // Map WATCH → RESEARCH_MORE for schema compat (RESEARCH_MORE exists in CHECK)
    let decisionAction = result.decision || 'AVOID'
    if (decisionAction === 'WATCH') decisionAction = 'RESEARCH_MORE'
    // Ensure the action is valid per the CHECK constraint
    const validActions = ['BUY_NOW', 'WATCH_HIGH_PRIORITY', 'NEGOTIATE', 'RESEARCH_MORE', 'AVOID', 'MANUAL_REVIEW_REQUIRED']
    if (!validActions.includes(decisionAction)) decisionAction = 'AVOID'

    try {
      await supabase.from('investment_decisions').insert({
        asset_id: assetId,
        opportunity_score_id: scoreId,
        opportunity_score: Math.round(finalScore),
        confidence_score: Math.round(confidence),
        investment_profile: profileForDecision(decisionAction),
        recommended_action: decisionAction,
        thesis_text: result.decisionDetails?.thesis_text || `${grade} rated property at ${assetRow.price_amount ? '$' + assetRow.price_amount : 'unknown price'}. Score: ${Math.round(finalScore)}/100.`,
        urgency_level: result.decisionDetails?.urgency_level || (finalScore >= 70 ? 4 : finalScore >= 50 ? 3 : 2),
        capital_recommendation: result.decisionDetails?.capital_recommendation || { max_bid_pct: 100, hold_period_months: 12 },
        risk_factors: result.decisionDetails?.risk_factors || { score_grade: grade, confidence_pct: confidence, comparable_quality: null },
      })
    } catch (e) { logStage.warn(`Decision insert: ${e.message?.slice(0, 80)}`) }
  }

  // ── Step 3: Soft Delete ────────────────────────────────────────────────
  if (knownAssetIds.size > 0) {
    try {
      const { data: sourceAssets } = await supabase
        .from('assets')
        .select('asset_id, source_listing_id, status')
        .eq('source_id', SOURCE_UUIDS[source])
        .eq('status', 'active')

      if (sourceAssets) {
        for (const sa of sourceAssets) {
          if (!knownAssetIds.has(sa.source_listing_id)) {
            await supabase.from('assets')
              .update({ status: 'removed', removed_at: new Date().toISOString() })
              .eq('asset_id', sa.asset_id)

            try {
              await supabase.from('asset_events').insert({
                asset_id: sa.asset_id,
                event_type: 'ASSET_DEACTIVATED',
                pipeline_run_id: pipelineRunId,
                reason: 'Asset no longer present in source scrape',
                metadata: { source_listing_id: sa.source_listing_id },
              })
            } catch (_) {}

            report.database.deactivated++
            logStage.info(`Asset ${sa.asset_id.slice(0, 8)} deactivated (removed from source)`)
          }
        }
      }
    } catch (e) {
      logStage.warn(`Soft delete query failed: ${e.message}`)
    }
  }

  report.database.duration_ms = Date.now() - dbStart
  const assetCount = decided.length || 1
  report.database.avg_time_per_asset_ms = Math.round((report.database.duration_ms / assetCount) * 10) / 10
  logStage.stats({
    Inserted: report.database.inserted,
    Updated: report.database.updated,
    Unchanged: report.database.unchanged,
    Deactivated: report.database.deactivated,
    Errors: report.database.errors || '0',
    'Avg/asset': `${report.database.avg_time_per_asset_ms}ms`,
    'DB time': log.module().duration(report.database.duration_ms),
  })

  // Return updated state
  return { pipeline_run_id: pipelineRunId }
}
