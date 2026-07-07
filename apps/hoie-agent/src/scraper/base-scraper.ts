import { chromium, type Browser, type Page } from 'playwright'
import type { Source, Asset } from '@hermes/types'

export class BaseScraper {
  protected browser: Browser | null = null
  protected source: Source

  constructor(source: Source) {
    this.source = source
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--window-size=1280,720'
      ]
    })
  }

  async scrape(): Promise<Asset[]> {
    if (!this.browser) {
      await this.init()
    }

    const assets: Asset[] = []
    const page = await this.browser!.newPage()

    // Apply stealth techniques
    await this.setupStealth(page)

    // Respect rate limits
    const delay = 1000 // Default 1 second delay

    try {
      await page.goto(this.source.base_url, { waitUntil: 'domcontentloaded' })
      
      // Extract listings
      const listingSelector = (this.source.selectors as any)?.listing_container || 'body'
      await page.waitForSelector(listingSelector, { timeout: 10000 })

      const listings = await page.$$(listingSelector)
      
      for (const listing of listings) {
        const asset = await this.extractAsset(page, listing)
        if (asset) {
          assets.push(asset)
        }
        await page.waitForTimeout(delay)
      }

      // Handle pagination
      await this.handlePagination(page, assets, delay)
    } catch (error) {
      console.error(`Scraping error for ${this.source.name}:`, error)
    } finally {
      await page.close()
    }

    return assets
  }

  protected async setupStealth(page: Page): Promise<void> {
    // Randomize user agent
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ]
    await page.setExtraHTTPHeaders({
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)]
    })
  }

  protected async extractAsset(page: Page, listing: any): Promise<Asset | null> {
    try {
      const linkElement = await listing.$('a')
      const link = linkElement ? await linkElement.getAttribute('href') : null
      
      if (!link) return null

      const asset: Asset = {
        source_id: this.source.source_id,
        source_listing_url: this.resolveUrl(link),
        vertical: this.source.vertical,
        status: 'active',
        price_currency: 'USD'
      }

      // Extract fields based on selectors
      const fields = (this.source.selectors as any)?.fields || {}
      
      if (fields.title) {
        const titleEl = await listing.$(fields.title)
        asset.title = titleEl ? (await titleEl.textContent() || undefined) : undefined
      }

      if (fields.price) {
        const priceEl = await listing.$(fields.price)
        const priceText = priceEl ? (await priceEl.textContent() || '') : ''
        asset.price_amount = this.parsePrice(priceText)
      }

      if (fields.location) {
        const locEl = await listing.$(fields.location)
        const locText = locEl ? (await locEl.textContent() || '') : ''
        asset.location = this.parseLocation(locText)
      }

      return asset
    } catch (error) {
      console.error('Error extracting asset:', error)
      return null
    }
  }

  protected async handlePagination(page: Page, assets: Asset[], delay: number): Promise<void> {
    const paginationSelector = (this.source.selectors as any)?.pagination
    if (!paginationSelector) return

    try {
      const nextButton = await page.$(paginationSelector)
      if (nextButton) {
        await nextButton.click()
        await page.waitForTimeout(delay * 2)
        const moreAssets = await this.scrapeCurrentPage(page, delay)
        assets.push(...moreAssets)
      }
    } catch (error) {
      // Pagination ended
    }
  }

  protected async scrapeCurrentPage(page: Page, delay: number): Promise<Asset[]> {
    const assets: Asset[] = []
    const listingSelector = (this.source.selectors as any)?.listing_container || 'body'
    const listings = await page.$$(listingSelector)
    
    for (const listing of listings) {
      const asset = await this.extractAsset(page, listing)
      if (asset) {
        assets.push(asset)
      }
      await page.waitForTimeout(delay)
    }
    
    return assets
  }

  protected resolveUrl(url: string): string {
    if (url.startsWith('http')) return url
    return `${this.source.base_url}${url}`
  }

  protected parsePrice(text: string): number | undefined {
    const match = text.match(/[\d,]+\.?\d*/g)
    return match ? parseFloat(match[0].replace(/,/g, '')) : undefined
  }

  protected parseLocation(text: string): Asset['location'] {
    const parts = text.split(',').map(s => s.trim())
    return {
      province: parts[0] || undefined,
      district: parts[1] || undefined,
      corregimiento: parts[2] || undefined
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
    }
  }
}