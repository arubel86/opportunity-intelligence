// Comparable Engine - finds and scores comparable assets from a pool
import type { Asset } from '@hermes/types'
import { PANAMA_LOCATIONS } from '../data/panama-locations.js'

export interface Comparable {
  price: number
  listingUrl?: string
  title?: string
  distance_km: number
  age_days: number
  qualityScore: number
  source?: string
  reason: string
  propertyType?: string
  areaM2?: number
  bedrooms?: number
  bathrooms?: number
  listPrice: number
}

export interface ComparablesResult {
  comparables: Comparable[]
  discarded: { assetId?: string; reason: string; qualityScore: number }[]
  totalCandidates: number
  searchTimeMs: number
  avgQuality: number
}

export class ComparableEngine {
  findComparables(asset: Asset, listingPool: Asset[]): ComparablesResult {
    const startTime = Date.now()
    const comparables: Comparable[] = []
    const discarded: { assetId?: string; reason: string; qualityScore: number }[] = []

    for (const candidate of listingPool) {
      if (asset.asset_id && candidate.asset_id === asset.asset_id) continue

      const match = this._evaluateMatch(asset, candidate)
      if (match) {
        if (match.qualityScore >= 30) {
          comparables.push(match)
        } else {
          discarded.push({ assetId: candidate.asset_id, reason: 'low_quality', qualityScore: match.qualityScore })
        }
      } else {
        discarded.push({ assetId: candidate.asset_id, reason: 'different_region', qualityScore: 0 })
      }
    }

    // Sort by quality descending, take top 15
    comparables.sort((a, b) => b.qualityScore - a.qualityScore)

    return {
      comparables: comparables.slice(0, 15),
      discarded,
      totalCandidates: listingPool.length - 1,
      searchTimeMs: Date.now() - startTime,
      avgQuality: comparables.length > 0
        ? comparables.reduce((s, c) => s + c.qualityScore, 0) / comparables.length
        : 0
    }
  }

  private _evaluateMatch(asset: Asset, candidate: Asset): Comparable | null {
    if (asset.vertical === 'real_estate') {
      return this._matchRealEstate(asset, candidate)
    } else if (asset.vertical === 'vehicles') {
      return this._matchVehicle(asset, candidate)
    }
    return null
  }

  private _matchRealEstate(asset: Asset, candidate: Asset): Comparable | null {
    if (candidate.vertical !== 'real_estate') return null

    let score = 0
    const reasons: string[] = []

    // Same district = strong match
    if (candidate.location?.district && asset.location?.district &&
        candidate.location.district === asset.location.district) {
      score += 30
      reasons.push('Mismo distrito')
    } else if (candidate.location?.province && asset.location?.province &&
               candidate.location.province === asset.location.province) {
      score += 10
      reasons.push('Misma provincia')
    } else {
      return null // Different province = no match
    }

    // Same property type
    const assetType = asset.title?.toLowerCase().includes('apartment') || asset.source_listing_url?.toLowerCase().includes('apartment') ? 'apartment' :
                      asset.title?.toLowerCase().includes('house') || asset.source_listing_url?.toLowerCase().includes('house') ? 'house' : 'property'
    const candType = candidate.title?.toLowerCase().includes('apartment') || candidate.source_listing_url?.toLowerCase().includes('apartment') ? 'apartment' :
                     candidate.title?.toLowerCase().includes('house') || candidate.source_listing_url?.toLowerCase().includes('house') ? 'house' : 'property'

    if (candType === assetType) {
      score += 20
      reasons.push('Mismo tipo de propiedad')
    } else {
      score += 5
      reasons.push('Tipo de propiedad diferente')
    }

    // Similar price (±30%)
    const assetPrice = asset.price_amount || 0
    const candPrice = candidate.price_amount || 0
    if (assetPrice > 0 && candPrice > 0) {
      const ratio = Math.max(candPrice, assetPrice) / Math.min(candPrice, assetPrice)
      if (ratio <= 1.1) { score += 25; reasons.push('Precio casi idéntico') }
      else if (ratio <= 1.2) { score += 20; reasons.push('Precio muy similar') }
      else if (ratio <= 1.3) { score += 15; reasons.push('Precio similar') }
      else if (ratio <= 1.5) { score += 8; reasons.push('Precio aproximado') }
      else { score += 2; reasons.push('Precio diferente') }
    }

    // Similar size (±40%)
    const assetArea = this._extractAreaM2(asset)
    const candArea = this._extractAreaM2(candidate)
    if (assetArea > 0 && candArea > 0) {
      const sizeRatio = Math.max(candArea, assetArea) / Math.min(candArea, assetArea)
      if (sizeRatio <= 1.2) { score += 15; reasons.push('Tamaño similar') }
      else if (sizeRatio <= 1.4) { score += 10; reasons.push('Tamaño aproximado') }
      else { score += 3; reasons.push('Tamaño diferente') }
    }

    // Same bedrooms
    const assetBeds = this._extractBedrooms(asset)
    const candBeds = this._extractBedrooms(candidate)
    if (assetBeds > 0 && candBeds > 0 && assetBeds === candBeds) {
      score += 10
      reasons.push('Mismas habitaciones')
    }

    // Distance factor (using reference locations)
    const dist = this._calculateDistance(asset.location, candidate.location)
    if (dist !== null) {
      if (dist <= 0.5) { score += 15; reasons.push('Muy cercano') }
      else if (dist <= 1) { score += 12; reasons.push('Cercano') }
      else if (dist <= 3) { score += 8; reasons.push('Relativamente cercano') }
      else if (dist <= 5) { score += 5; reasons.push('Distancia moderada') }
      else { score += 2; reasons.push('Distante') }
    }

    return {
      price: candPrice,
      listingUrl: candidate.source_listing_url || candidate.source_listing_id,
      title: candidate.title,
      distance_km: dist || 999,
      age_days: this._daysSince(candidate.description || candidate.title),
      qualityScore: Math.min(100, score),
      source: 'Encuentra24',
      reason: reasons.join(', '),
      propertyType: candType,
      areaM2: candArea,
      bedrooms: candBeds,
      bathrooms: this._extractBathrooms(candidate),
      listPrice: candPrice
    }
  }

  private _matchVehicle(_asset: Asset, _candidate: Asset): Comparable | null {
    // Vehicle matching would go here
    return null
  }

  private _extractAreaM2(asset: Asset): number {
    // Parse from description or title
    const desc = asset.description || asset.title || ''
    const match = desc.match(/([\d.]+)\s*m2/i)
    return match ? parseFloat(match[1]) : 0
  }

  private _extractBedrooms(asset: Asset): number {
    const desc = asset.description || asset.title || ''
    const match = desc.match(/(\d+)\s*(?:bedroom|dormitorio|habitación|recámara|cuarto)/i)
    return match ? parseInt(match[1]) : 0
  }

  private _extractBathrooms(asset: Asset): number {
    const desc = asset.description || asset.title || ''
    const match = desc.match(/(\d+)\s*(?:bathroom|baño)/i)
    return match ? parseInt(match[1]) : 0
  }

  private _calculateDistance(
    loc1?: Asset['location'],
    loc2?: Asset['location']
  ): number | null {
    if (!loc1 || !loc2) return null

    // If exact coordinates exist, use Haversine
    if (loc1.coordinates?.lat && loc1.coordinates?.lng &&
        loc2.coordinates?.lat && loc2.coordinates?.lng) {
      return this._haversine(
        loc1.coordinates.lat, loc1.coordinates.lng,
        loc2.coordinates.lat, loc2.coordinates.lng
      )
    }

    // Fallback: look up reference locations by neighborhood/district
    const ref1 = this._findNearestRef(loc1)
    const ref2 = this._findNearestRef(loc2)
    if (ref1 && ref2) {
      return this._haversine(ref1.lat, ref1.lng, ref2.lat, ref2.lng)
    }

    return null
  }

  private _findNearestRef(loc: Asset['location']): { lat: number; lng: number } | null {
    if (!loc) return null

    // Try exact neighborhood match first
    if (loc.neighborhood) {
      const match = PANAMA_LOCATIONS.find(
        r => r.neighborhood.toLowerCase() === loc.neighborhood!.toLowerCase()
      )
      if (match) return match
    }

    // Try district match
    if (loc.district) {
      const match = PANAMA_LOCATIONS.find(
        r => r.district.toLowerCase() === loc.district!.toLowerCase()
      )
      if (match) return match
    }

    // Try province match
    if (loc.province) {
      const match = PANAMA_LOCATIONS.find(
        r => r.province.toLowerCase() === loc.province!.toLowerCase()
      )
      if (match) return match
    }

    return null
  }

  private _haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = this._toRad(lat2 - lat1)
    const dLng = this._toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
              Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  private _toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  calculateEstimatedValue(comparables: Comparable[]): number {
    if (comparables.length === 0) return 0
    let totalWeighted = 0
    let totalWeight = 0
    for (const comp of comparables) {
      const weight = comp.qualityScore / 100
      totalWeighted += comp.price * weight
      totalWeight += weight
    }
    return totalWeight > 0 ? totalWeighted / totalWeight : 0
  }

  generateComparablesReport(comparables: Comparable[], asset: Asset): string {
    if (comparables.length === 0) {
      return `No se encontraron comparables para este inmueble.`
    }

    let report = `## Análisis de Comparables\n\n`
    report += `Se encontraron **${comparables.length}** comparables:\n\n`
    report += `| # | Precio | Calidad | Razón |\n|---|---|---|---|\n`
    comparables.forEach((c, i) => {
      report += `| ${i + 1} | $${(c.price || 0).toLocaleString()} | ${c.qualityScore}% | ${c.reason} |\n`
    })

    const estValue = this.calculateEstimatedValue(comparables)
    const assetPrice = asset.price_amount || 0
    if (estValue > 0 && assetPrice > 0) {
      const diff = ((estValue - assetPrice) / estValue) * 100
      report += `\n**Valor estimado:** $${Math.round(estValue).toLocaleString()}\n`
      report += `**Precio listado:** $${Math.round(assetPrice).toLocaleString()}\n`
      report += `**Diferencia:** ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%\n`
      if (diff >= 15) report += `\n✅ **OPORTUNIDAD DETECTADA**: Precio ${diff.toFixed(0)}% por debajo del valor estimado\n`
      else if (diff >= 5) report += `\nℹ️ Precio ligeramente por debajo del valor estimado\n`
      else if (diff >= -5) report += `\nℹ️ Precio cercano al valor estimado\n`
      else report += `\n⚠️ Precio por encima del valor estimado\n`
    }

    return report
  }

  private _daysSince(dateStr?: string): number {
    if (!dateStr) return 999
    const d = new Date(dateStr)
    return Math.floor((Date.now() - d.getTime()) / 86400000)
  }
}
