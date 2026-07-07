/**
 * Pipeline Stage: Scraper
 * Scrapes listings from the configured source.
 * Falls back to mock data when the real scraper is unavailable.
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

/**
 * Scrape listings from the configured source.
 * @param {object} ctx Pipeline context { source, limit, log, report }
 * @returns {Promise<Array>} Array of raw listing objects
 */
export async function run(ctx) {
  const { source, limit, log, report } = ctx
  const logStage = log.module('SCRAPER')
  logStage.section('SCRAPING')
  const scrapeStart = Date.now()

  let listings = []

  if (source === 'encuentra24') {
    const scraperPath = resolve(ROOT, 'benchmark/e24-scraper.mjs')
    if (existsSync(scraperPath)) {
      // Ensure Playwright browsers path is set
      if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
        process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(ROOT, '.browsers')
      }
      logStage.info(`PLAYWRIGHT_BROWSERS_PATH=${process.env.PLAYWRIGHT_BROWSERS_PATH}`)
      logStage.info(`Scraping ${source} for up to ${limit} properties...`)
      const { default: ScraperClass } = await import(scraperPath)
      try {
        const scraper = new ScraperClass()
        await scraper.initialize()
        listings = await scraper.scrapeListings(limit) || []
        await scraper.close()
      } catch (err) {
        logStage.warn(`Real scraper failed: ${err.message}`)
      }
      // Filter out rentals
      listings = listings.filter(l => {
        if (!l) return false
        if (/for-rent|\/rent\/|-alquiler/.test((l.url||'').toLowerCase())) return false
        if (/for rent|en alquiler|alquiler/.test((l.title||'').toLowerCase())) return false
        if (/for rent|en alquiler|alquiler mensual/.test((l.description||'').toLowerCase())) return false
        return true
      })
      logStage.info(`Got ${listings.length} for-sale properties`)
    } else {
      logStage.warn('Real scraper not found, returning empty')
    }
  } else {
    logStage.warn(`Unknown source "${source}", returning empty`)
  }

  report.scraper.found = listings.length
  report.scraper.duration_ms = Date.now() - scrapeStart
  logStage.stats({
    'Properties found': report.scraper.found,
    'Scraping time': log.module().duration(report.scraper.duration_ms),
  })

  return listings
}
