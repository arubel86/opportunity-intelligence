/**
 * Pipeline Stage: Validator
 * Validates normalized assets against business rules.
 * Currently a pass-through; structured for future golden-validator integration.
 *
 * Future: import { validateAsset } from '../apps/hoie-agent/src/pipeline/golden-validator'
 */

/**
 * Validate a batch of normalized assets.
 * @param {object} ctx Pipeline context { normalized, log, report }
 * @returns {Promise<Array>} Validated assets (invalid assets flagged in report)
 */
export async function run(ctx) {
  const { normalized, log, report } = ctx
  const valStart = Date.now()
  const logStage = log.module('VALIDATOR')
  logStage.section('VALIDATION')

  // Currently all assets pass validation.
  // Future: apply golden-validator rules here.
  const seenUrls = new Set()
  const validated = normalized.filter(a => {
    const failures = []

    // Basic structural validation
    if (!a.title || a.title.trim().length === 0) {
      failures.push('missing_title')
    }
    if (!a.price_amount || a.price_amount <= 0) {
      failures.push('invalid_price')
    } else if (a.price_amount < 10000) {
      failures.push('price_below_minimum') // $10,000 min for real estate
    } else if (a.price_amount > 100000000) {
      failures.push('price_above_maximum') // $100M sanity check
    }
    if (!a.source_listing_url) {
      failures.push('missing_source_url')
    }

    // Area validation if available
    const rawData = a.raw_data || {}
    if (rawData.area_m2 && rawData.area_m2 > 100000) {
      failures.push('area_exceeds_maximum') // 100,000 m² sanity check
    }

    // Detect duplicates by source_listing_url within this batch
    if (a.source_listing_url) {
      if (seenUrls.has(a.source_listing_url)) {
        failures.push('duplicate_url_in_batch')
      }
      seenUrls.add(a.source_listing_url)
    }

    // Bedrooms validation
    if (rawData.bedrooms && (rawData.bedrooms < 0 || rawData.bedrooms > 50)) {
      failures.push('invalid_bedrooms')
    }

    // Bathrooms validation
    if (rawData.bathrooms && (rawData.bathrooms < 0 || rawData.bathrooms > 50)) {
      failures.push('invalid_bathrooms')
    }

    if (failures.length > 0) {
      logStage.warn(`Asset ${a.asset_id} validation failed: ${failures.join(', ')}`)
      return false
    }
    return true
  })

  logStage.stats({
    'Assets validated': validated.length,
    'Assets rejected': normalized.length - validated.length,
    'Validation time': log.module().duration(Date.now() - valStart),
  })

  return validated
}
