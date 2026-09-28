// Asset Normalizer - transforms raw scraped data into canonical format
// No database, pure in-memory transformation

import type { Asset } from '@hermes/types'

export class AssetNormalizer {
  
  normalize(raw: any, sourceId: string, vertical: 'real_estate' | 'vehicles'): Asset {
    const asset: Asset = {
      source_id: sourceId,
      source_listing_url: raw.url || raw.link,
      vertical,
      status: 'active',
      price_currency: 'USD'
    }

    // Extract title
    asset.title = this.cleanString(raw.title || raw.name)

    // Extract price (handle various formats)
    asset.price_amount = this.parsePrice(raw.price || raw.price_amount || raw['precio'])

    // Extract location
    asset.location = this.parseLocation(raw)

    // Extract description
    asset.description = this.cleanString(raw.description || raw.details || raw.content)

    return asset
  }

  private cleanString(str: string | undefined): string | undefined {
    if (!str) return undefined
    return str.trim().replace(/\s+/g, ' ').substring(0, 500)
  }

  private parsePrice(price: any): number | undefined {
    if (typeof price === 'number') return price

    if (typeof price === 'string') {
      // Handle "$250,000", "250000 USD", "B/.250,000.00"
      // Remove leading dots/commas from currency symbols like B/. or $.
      const cleaned = price.replace(/[^\d.,]/g, '')
      const normalized = cleaned.replace(/^[.,]+/, '')
      const match = normalized.match(/[\d.,]+/)
      if (match) {
        // Remove thousand separators (commas) and parse
        return parseFloat(match[0].replace(/,/g, ''))
      }
    }

    return undefined
  }

  private parseLocation(raw: any): Asset['location'] {
    // Composite location string - 'location' or 'address' are full address strings
    const locStr = raw.location || raw.address

    if (locStr && typeof locStr === 'string') {
      // Parse "Panamá, Bella Vista, El Cangrejo"
      const parts = locStr.split(',').map(s => s.trim())
      return {
        province: parts[0] || undefined,
        district: parts[1] || undefined,
        corregimiento: parts[2] || undefined,
        neighborhood: raw.neighborhood || raw.barrio || undefined
      }
    }

    // Object-style location or individual fields
    if (locStr && typeof locStr === 'object') {
      return {
        province: (locStr as any).province || raw.provincia || undefined,
        district: (locStr as any).district || raw.distrito || undefined,
        corregimiento: (locStr as any).corregimiento || raw.corregimiento || undefined,
        neighborhood: (locStr as any).neighborhood || raw.neighborhood || raw.barrio || undefined
      }
    }

    // Individual fields fallback
    return {
      province: raw.provincia || raw.province || undefined,
      district: raw.distrito || raw.district || undefined,
      corregimiento: raw.corregimiento || undefined,
      neighborhood: raw.neighborhood || raw.barrio || undefined
    }
  }

  // Generate hash for deduplication
  generateContentHash(asset: Asset): string {
    const hashContent = `${asset.title}|${asset.price_amount}|${JSON.stringify(asset.location)}`
    return this.simpleHash(hashContent)
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }
}