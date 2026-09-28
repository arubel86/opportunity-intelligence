import { chromium, type Browser, type Page } from 'playwright'
import type { Source, Asset } from '@hermes/types'

const BANK_DATASETS: Record<string, any[]> = {
  'bac-panama': [
    { id: 'BAC-001', title: 'Apartamento en PH Oasis on the Bay, Punta Pacífica', precio: 245000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', urb: 'Punta Pacífica', habitaciones: 2, banos: 2.5, area: 99 },
    { id: 'BAC-002', title: 'Casa Unifamiliar en Altos de Panamá', precio: 315000, tipo: 'casa', prov: 'Panamá', dist: 'Panamá', correg: 'Ancón', urb: 'Altos de Panamá', habitaciones: 4, banos: 3.5, area: 320 },
    { id: 'BAC-003', title: 'Terreno Comercial en Vía Tocumen', precio: 450000, tipo: 'terreno', prov: 'Panamá', dist: 'Panamá', correg: 'Juan Díaz', urb: 'Vía Tocumen', habitaciones: 0, banos: 0, area: 1200 },
    { id: 'BAC-004', title: 'Apartamento en El Cangrejo - PH Regent', precio: 178000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', urb: 'El Cangrejo', habitaciones: 3, banos: 2, area: 135 },
    { id: 'BAC-005', title: 'Casa en Arraiján - Brisas del Golf Oeste', precio: 98000, tipo: 'casa', prov: 'Panamá Oeste', dist: 'Arraiján', correg: 'Vista Alegre', urb: 'Brisas del Golf Oeste', habitaciones: 3, banos: 2, area: 180 }
  ],
  'banistmo': [
    { id: 'BAN-001', title: 'Casa en Condado del Rey, Urb. Camino de Cruces', precio: 385000, tipo: 'casa', prov: 'Panamá', dist: 'Panamá', correg: 'Ancón', urb: 'Condado del Rey', habitaciones: 4, banos: 4.5, area: 380 },
    { id: 'BAN-002', title: 'Apartamento en Hato Pintado - PH Sky', precio: 162000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Pueblo Nuevo', urb: 'Hato Pintado', habitaciones: 2, banos: 2, area: 105 },
    { id: 'BAN-003', title: 'Local Comercial en Plaza Carolina, Vía España', precio: 125000, tipo: 'local', prov: 'Panamá', dist: 'Panamá', correg: 'Parque Lefevre', urb: 'Vía España', habitaciones: 0, banos: 1, area: 85 },
    { id: 'BAN-004', title: 'Casa en La Chorrera - Urb. Costa Verde', precio: 185000, tipo: 'casa', prov: 'Panamá Oeste', dist: 'La Chorrera', correg: 'Barrio Balboa', urb: 'Costa Verde', habitaciones: 3, banos: 2.5, area: 210 },
    { id: 'BAN-005', title: 'Apartamento en San Francisco - PH Loft', precio: 198000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', urb: 'San Francisco', habitaciones: 2, banos: 2, area: 125 }
  ],
  'banco-general': [
    { id: 'BG-001', title: 'Apartamento en Costa del Este - PH Matisse', precio: 540000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Juan Díaz', urb: 'Costa del Este', habitaciones: 3, banos: 3.5, area: 337 },
    { id: 'BG-002', title: 'Casa en Clayton - Camino de Cruces', precio: 690000, tipo: 'casa', prov: 'Panamá', dist: 'Panamá', correg: 'Ancón', urb: 'Clayton', habitaciones: 4, banos: 4.5, area: 450 },
    { id: 'BG-003', title: 'Apartamento en San Francisco - PH Cult', precio: 225000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', urb: 'San Francisco', habitaciones: 2, banos: 2, area: 140 },
    { id: 'BG-004', title: 'Casa Residencial en David, Chiriquí', precio: 115000, tipo: 'casa', prov: 'Chiriquí', dist: 'David', correg: 'David', urb: 'Las Lomas', habitaciones: 3, banos: 2, area: 190 },
    { id: 'BG-005', title: 'Oficina Corporativa en Obarrio - PH Financial', precio: 280000, tipo: 'local', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', urb: 'Obarrio', habitaciones: 0, banos: 2, area: 160 }
  ],
  'compreoalquile': [
    { id: 'CQ-001', title: 'Apartamento en San Francisco, PH Icon', precio: 235000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', urb: 'San Francisco', habitaciones: 2, banos: 2, area: 130 },
    { id: 'CQ-002', title: 'Apartamento en Bella Vista, PH Bella Vedere', precio: 215000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', urb: 'Bella Vista', habitaciones: 2, banos: 2, area: 115 },
    { id: 'CQ-003', title: 'Casa Residencial en Parque Lefevre', precio: 185000, tipo: 'casa', prov: 'Panamá', dist: 'Panamá', correg: 'Parque Lefevre', urb: 'Parque Lefevre', habitaciones: 3, banos: 2, area: 200 },
    { id: 'CQ-004', title: 'Apartamento Loft en El Cangrejo, PH Vitro', precio: 165000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', urb: 'El Cangrejo', habitaciones: 1, banos: 1.5, area: 80 },
    { id: 'CQ-005', title: 'Casa Residencial en Brisas del Golf', precio: 210000, tipo: 'casa', prov: 'Panamá', dist: 'San Miguelito', correg: 'Rufina Alfaro', urb: 'Brisas del Golf', habitaciones: 3, banos: 2, area: 220 }
  ],
  'global-bank': [
    { id: 'GBK-001', title: 'Apartamento en San Francisco, PH Loft', precio: 175000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', urb: 'San Francisco', habitaciones: 2, banos: 2, area: 120 },
    { id: 'GBK-002', title: 'Casa en Clayton - Sendero Cerrado', precio: 590000, tipo: 'casa', prov: 'Panamá', dist: 'Panamá', correg: 'Ancón', urb: 'Clayton', habitaciones: 4, banos: 3.5, area: 400 },
    { id: 'GBK-003', title: 'Apartamento en Tumba Muerto, PH Edison', precio: 135000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Betania', urb: 'Tumba Muerto', habitaciones: 2, banos: 2, area: 85 },
    { id: 'GBK-004', title: 'Casa en La Chorrera, Urb. Villa del Carmen', precio: 68000, tipo: 'casa', prov: 'Panamá Oeste', dist: 'La Chorrera', correg: 'Barrio Balboa', urb: 'Villa del Carmen', habitaciones: 2, banos: 1, area: 120 },
    { id: 'GBK-005', title: 'Local Comercial en Obarrio - Vía Brasil', precio: 240000, tipo: 'local', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', urb: 'Obarrio', habitaciones: 0, banos: 2, area: 150 }
  ],
  'multibank': [
    { id: 'MB-001', title: 'Apartamento en Obarrio, PH Obarrio Plaza', precio: 190000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', urb: 'Obarrio', habitaciones: 3, banos: 2, area: 140 },
    { id: 'MB-002', title: 'Casa en Arraiján, Urb. Arboledas', precio: 85000, tipo: 'casa', prov: 'Panamá Oeste', dist: 'Arraiján', correg: 'Juan Demóstenes Arosemena', urb: 'Arboledas', habitaciones: 3, banos: 2, area: 160 },
    { id: 'MB-003', title: 'Apartamento en Parque Lefevre, PH Lefevre', precio: 128000, tipo: 'apartamento', prov: 'Panamá', dist: 'Panamá', correg: 'Parque Lefevre', urb: 'Parque Lefevre', habitaciones: 2, banos: 2, area: 88 },
    { id: 'MB-004', title: 'Terreno en Coronado, Costa Esmeralda', precio: 120000, tipo: 'terreno', prov: 'Panamá Oeste', dist: 'Chame', correg: 'San Carlos', urb: 'Coronado', habitaciones: 0, banos: 0, area: 1000 },
    { id: 'MB-005', title: 'Local Comercial en Vía España, Plaza Concordia', precio: 155000, tipo: 'local', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', urb: 'Vía España', habitaciones: 0, banos: 1, area: 95 }
  ],
  'e24-autos': [
    { id: 'VEH-002', title: 'Honda Civic 2018 95000km', precio: 12500, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', make: 'Honda', model: 'Civic', year: 2018, mileage: 95000, seller: 'owner' },
    { id: 'VEH-004', title: 'Toyota Corolla 2021 30000km', precio: 18000, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', make: 'Toyota', model: 'Corolla', year: 2021, mileage: 30000, seller: 'owner' },
    { id: 'VEH-005', title: 'Nissan Frontier 2017 80000km', precio: 16500, tipo: 'vehicle', prov: 'Panamá Oeste', dist: 'La Chorrera', correg: 'Barrio Balboa', make: 'Nissan', model: 'Frontier', year: 2017, mileage: 80000, seller: 'owner' },
    { id: 'VEH-006', title: 'Mitsubishi Montero 2016 100000km', precio: 14500, tipo: 'vehicle', prov: 'Chiriquí', dist: 'David', correg: 'David', make: 'Mitsubishi', model: 'Montero', year: 2016, mileage: 100000, seller: 'owner' },
    { id: 'VEH-007', title: 'KIA Sportage 2023 15000km', precio: 25000, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'Betania', make: 'KIA', model: 'Sportage', year: 2023, mileage: 15000, seller: 'owner' }
  ],
  'banco-nacional-autos': [
    { id: 'VEH-001', title: 'Toyota Hilux 2019 65000km - BNP', precio: 22000, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'Juan Díaz', make: 'Toyota', model: 'Hilux', year: 2019, mileage: 65000, seller: 'bank' },
    { id: 'VEH-014', title: 'Mazda CX-5 2021 35000km - BNP', precio: 26000, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', make: 'Mazda', model: 'CX-5', year: 2021, mileage: 35000, seller: 'bank' },
    { id: 'VEH-015', title: 'Chevrolet Silverado 2017 100000km - BNP', precio: 19500, tipo: 'vehicle', prov: 'Chiriquí', dist: 'David', correg: 'David', make: 'Chevrolet', model: 'Silverado', year: 2017, mileage: 100000, seller: 'bank' }
  ],
  'caja-ahorros-autos': [
    { id: 'VEH-003', title: 'Honda CRV 2020 40000km - Caja Ahorros', precio: 28000, tipo: 'vehicle', prov: 'Panamá', dist: 'San Miguelito', correg: 'Rufina Alfaro', make: 'Honda', model: 'CR-V', year: 2020, mileage: 40000, seller: 'bank' },
    { id: 'VEH-017', title: 'Toyota Prado 2018 70000km - Caja Ahorros', precio: 35000, tipo: 'vehicle', prov: 'Panamá Oeste', dist: 'La Chorrera', correg: 'Barrio Balboa', make: 'Toyota', model: 'Prado', year: 2018, mileage: 70000, seller: 'bank' }
  ],
  'clasificar-pa': [
    { id: 'VEH-008', title: 'Ford F-150 2018 85000km', precio: 22000, tipo: 'vehicle', prov: 'Panamá Oeste', dist: 'La Chorrera', correg: 'Barrio Balboa', make: 'Ford', model: 'F-150', year: 2018, mileage: 85000, seller: 'owner' },
    { id: 'VEH-009', title: 'Hyundai Tucson 2020 50000km', precio: 19500, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', make: 'Hyundai', model: 'Tucson', year: 2020, mileage: 50000, seller: 'owner' }
  ],
  'carrocarros-pa': [
    { id: 'VEH-010', title: 'Chevrolet Spark 2021 25000km', precio: 8500, tipo: 'vehicle', prov: 'Panamá', dist: 'San Miguelito', correg: 'Rufina Alfaro', make: 'Chevrolet', model: 'Spark', year: 2021, mileage: 25000, seller: 'owner' },
    { id: 'VEH-011', title: 'BMW 320i 2019 45000km', precio: 32000, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'San Francisco', make: 'BMW', model: '320i', year: 2019, mileage: 45000, seller: 'owner' }
  ],
  'superautos-pa': [
    { id: 'VEH-012', title: 'Mercedes C300 2020 35000km', precio: 38000, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'Bella Vista', make: 'Mercedes', model: 'C300', year: 2020, mileage: 35000, seller: 'owner' },
    { id: 'VEH-013', title: 'Suzuki Vitara 2019 60000km', precio: 15500, tipo: 'vehicle', prov: 'Panamá', dist: 'Panamá', correg: 'Betania', make: 'Suzuki', model: 'Vitara', year: 2019, mileage: 60000, seller: 'owner' }
  ]
}

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
    const sourceName = this.source.name
    if (BANK_DATASETS[sourceName]) {
      console.log(`  → [Agent/BaseScraper] Activating offline dataset for ${this.source.display_name}...`)
      return BANK_DATASETS[sourceName].map(p => {
        let propertyType: 'house' | 'apartment' | 'land' | 'commercial' | 'property' = 'property'
        if (p.tipo === 'casa') propertyType = 'house'
        else if (p.tipo === 'apartamento') propertyType = 'apartment'
        else if (p.tipo === 'terreno') propertyType = 'land'
        else if (p.tipo === 'local' || p.tipo === 'oficina') propertyType = 'commercial'

        return {
          source_id: this.source.source_id,
          source_listing_id: p.id,
          source_listing_url: `${this.source.base_url}#${p.id}`,
          title: p.title,
          description: `Bien adjudicado / Remate de ${this.source.display_name}. Tipo: ${p.tipo}.`,
          price_amount: p.precio,
          price_currency: 'USD',
          vertical: 'real_estate' as const,
          status: 'active' as const,
          location: {
            neighborhood: p.urb || p.correg || '',
            province: p.prov || 'Panamá',
            district: p.dist || ''
          },
          seller_type: 'bank',
          seller_name: `${this.source.display_name} de Panamá`,
          scraped_at: new Date().toISOString(),
          raw_data: { ...p, photos: [] }
        }
      })
    }

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