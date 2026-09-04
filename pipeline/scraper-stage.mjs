/**
 * Pipeline Stage: Scraper
 * Robust scraper runner supporting all 15 real estate & vehicle sources with exponential retries and fallback.
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')

/**
 * Execute an async operation with exponential backoff retries.
 */
async function executeWithRetry(operation, maxRetries = 2, initialDelay = 1500, log) {
  let lastError = null
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation()
    } catch (err) {
      lastError = err
      if (attempt <= maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1)
        if (log) log.warn(`Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

/**
 * Filter out rental listings and invalid records.
 */
function filterForSaleListings(items = []) {
  return items.filter(l => {
    if (!l) return false
    const url = (l.url || '').toLowerCase()
    const title = (l.title || '').toLowerCase()
    const desc = (l.description || '').toLowerCase()

    if (/for-rent|\/rent\/|-alquiler|\/alquiler\//.test(url)) return false
    if (/for rent|en alquiler|alquiler mensual|alquiler comercial/.test(title)) return false
    if (/for rent|en alquiler|alquiler mensual/.test(desc)) return false
    return true
  })
}

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

  // Ensure Playwright browsers path is configured
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && process.platform !== 'win32') {
    process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(ROOT, '.browsers')
  }

  try {
    if (source === 'encuentra24') {
      const scraperPath = resolve(ROOT, 'benchmark/e24-scraper.mjs')
      if (existsSync(scraperPath)) {
        logStage.info(`Scraping ${source} for up to ${limit || 10} properties...`)
        const { default: ScraperClass } = await import(pathToFileURL(scraperPath).href)
        
        listings = await executeWithRetry(async () => {
          const scraper = new ScraperClass()
          await scraper.initialize()
          const res = await scraper.scrapeListings(limit)
          await scraper.close()
          return res || []
        }, 1, 2000, logStage).catch(async (err) => {
          logStage.warn(`Encuentra24 live scraper failed: ${err.message}. Activating structured bank/portal fallback...`)
          const fallbackPath = resolve(ROOT, 'benchmark/bank-fallback-scraper.mjs')
          const { default: FallbackClass } = await import(pathToFileURL(fallbackPath).href)
          const fallbackScraper = new FallbackClass()
          await fallbackScraper.initialize()
          const fbRes = await fallbackScraper.scrapeListings('compreoalquile', limit)
          await fallbackScraper.close()
          return fbRes || []
        })
      }
    } else if (source === 'caja-ahorros') {
      const scraperPath = resolve(ROOT, 'benchmark/ca-scraper.mjs')
      if (existsSync(scraperPath)) {
        logStage.info(`Scraping ${source} for properties...`)
        const { default: ScraperClass } = await import(pathToFileURL(scraperPath).href)
        listings = await executeWithRetry(async () => {
          const scraper = new ScraperClass()
          await scraper.initialize()
          const res = await scraper.scrapeListings()
          await scraper.close()
          return res || []
        }, 1, 2000, logStage)
      }
    } else if (source === 'banco-nacional') {
      const scraperPath = resolve(ROOT, 'benchmark/bn-scraper.mjs')
      if (existsSync(scraperPath)) {
        logStage.info(`Scraping ${source} for properties...`)
        const { default: ScraperClass } = await import(pathToFileURL(scraperPath).href)
        listings = await executeWithRetry(async () => {
          const scraper = new ScraperClass()
          await scraper.initialize()
          const res = await scraper.scrapeListings(limit)
          await scraper.close()
          return res || []
        }, 1, 2000, logStage)
      }
    } else {
      // All other 12 sources (bac-panama, banistmo, banco-general, global-bank, multibank, compreoalquile, e24-autos, banco-nacional-autos, caja-ahorros-autos, clasificar-pa, carrocarros-pa, superautos-pa)
      const scraperPath = resolve(ROOT, 'benchmark/bank-fallback-scraper.mjs')
      if (existsSync(scraperPath)) {
        logStage.info(`Scraping ${source} for listings...`)
        const { default: ScraperClass } = await import(pathToFileURL(scraperPath).href)
        listings = await executeWithRetry(async () => {
          const scraper = new ScraperClass()
          await scraper.initialize()
          const res = await scraper.scrapeListings(source, limit)
          await scraper.close()
          return res || []
        }, 1, 1500, logStage)
      } else {
        logStage.warn(`Scraper for source "${source}" not found`)
      }
    }
  } catch (err) {
    logStage.error(`Scraping stage error for ${source}: ${err.message}`)
    listings = []
  }

  // Filter for-sale listings
  listings = filterForSaleListings(listings)
  if (limit && limit > 0 && listings.length > limit) {
    listings = listings.slice(0, limit)
  }

  report.scraper.found = listings.length
  report.scraper.duration_ms = Date.now() - scrapeStart
  logStage.stats({
    'Properties found': report.scraper.found,
    'Scraping time': log.module().duration(report.scraper.duration_ms),
  })

  return listings
}
