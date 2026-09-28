// Comparable Engine - finds and scores comparable assets
import { PANAMA_LOCATIONS } from '../data/panama-locations.js'

export class ComparableEngine {
  findComparables(asset, listingPool) {
    const startTime = Date.now()
    const comparables = []
    const discarded = []

    for (const candidate of listingPool) {
      if (candidate.assetId === asset.assetId) continue

      const match = this._evaluateMatch(asset, candidate)
      if (match) {
        if (match.qualityScore >= 30) {
          comparables.push(match)
        } else {
          discarded.push({ assetId: candidate.assetId, reason: 'low_quality', qualityScore: match.qualityScore })
        }
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

  _evaluateMatch(asset, candidate) {
    if (asset.vertical === 'real_estate') {
      return this._matchRealEstate(asset, candidate)
    } else if (asset.vertical === 'vehicles') {
      return this._matchVehicle(asset, candidate)
    }
    return null
  }

  _matchRealEstate(asset, candidate) {
    if (candidate.vertical !== 'real_estate') return null

    let score = 0
    let reasons = []

    // Same district = strong match
    if (candidate.location?.district === asset.location?.district) {
      score += 30
      reasons.push('Mismo distrito')
    } else if (candidate.location?.province === asset.location?.province) {
      score += 10
      reasons.push('Misma provincia')
    } else {
      return null // Different province = no match
    }

    // Same property type
    if (candidate.propertyType === asset.propertyType) {
      score += 20
      reasons.push('Mismo tipo de propiedad')
    } else {
      score += 5
      reasons.push('Tipo de propiedad diferente')
    }

    // Similar price (±30%)
    const assetPrice = asset.priceAmount || 0
    const candPrice = candidate.priceAmount || 0
    if (assetPrice > 0 && candPrice > 0) {
      const ratio = Math.max(candPrice, assetPrice) / Math.min(candPrice, assetPrice)
      if (ratio <= 1.1) { score += 25; reasons.push('Precio casi idéntico') }
      else if (ratio <= 1.2) { score += 20; reasons.push('Precio muy similar') }
      else if (ratio <= 1.3) { score += 15; reasons.push('Precio similar') }
      else if (ratio <= 1.5) { score += 8; reasons.push('Precio aproximado') }
      else { score += 2; reasons.push('Precio diferente') }
    }

    // Similar size (±40%)
    if (asset.areaM2 && candidate.areaM2) {
      const sizeRatio = Math.max(candidate.areaM2, asset.areaM2) / Math.min(candidate.areaM2, asset.areaM2)
      if (sizeRatio <= 1.2) { score += 15; reasons.push('Tamaño similar') }
      else if (sizeRatio <= 1.4) { score += 10; reasons.push('Tamaño aproximado') }
      else { score += 3; reasons.push('Tamaño diferente') }
    }

    // Same bedrooms
    if (candidate.bedrooms && asset.bedrooms && candidate.bedrooms === asset.bedrooms) {
      score += 10
      reasons.push('Mismas habitaciones')
    }

    // Distance factor
    const dist = this.calculateDistance(asset.location, candidate.location)
    if (dist !== null) {
      if (dist <= 0.5) { score += 15; reasons.push('Muy cercano') }
      else if (dist <= 1) { score += 12; reasons.push('Cercano') }
      else if (dist <= 3) { score += 8; reasons.push('Relativamente cercano') }
      else if (dist <= 5) { score += 5; reasons.push('Distancia moderada') }
      else { score += 2; reasons.push('Distante') }
    }

    return {
      price: candPrice,
      listingUrl: candidate.sourceListingUrl,
      title: candidate.title,
      distance_km: dist || 999,
      age_days: this._daysSince(candidate.listingDate),
      qualityScore: Math.min(100, score),
      source: candidate.source,
      reason: reasons.join(', '),
      propertyType: candidate.propertyType,
      areaM2: candidate.areaM2,
      bedrooms: candidate.bedrooms,
      bathrooms: candidate.bathrooms,
      listPrice: candPrice
    }
  }

  _matchVehicle(asset, candidate) {
    if (candidate.vertical !== 'vehicles') return null

    let score = 0
    let reasons = []

    // Same make = strong match
    if (candidate.make === asset.make) {
      score += 25
      reasons.push('Misma marca')

      // Same model = best match
      if (candidate.model === asset.model) {
        score += 20
        reasons.push('Mismo modelo')
      }
    } else {
      score += 5
      reasons.push('Marca diferente')
    }

    // Similar year (±3 years)
    const assetYear = asset.year || 0
    const candYear = candidate.year || 0
    const yearDiff = Math.abs(assetYear - candYear)
    if (yearDiff === 0) { score += 20; reasons.push('Mismo año') }
    else if (yearDiff <= 1) { score += 15; reasons.push('Año muy cercano') }
    else if (yearDiff <= 3) { score += 10; reasons.push('Año cercano') }
    else { score += 3; reasons.push('Año diferente') }

    // Similar price (±25%)
    const assetPrice = asset.priceAmount || 0
    const candPrice = candidate.priceAmount || 0
    if (assetPrice > 0 && candPrice > 0) {
      const ratio = Math.max(candPrice, assetPrice) / Math.min(candPrice, assetPrice)
      if (ratio <= 1.1) { score += 20; reasons.push('Precio casi idéntico') }
      else if (ratio <= 1.15) { score += 15; reasons.push('Precio muy similar') }
      else if (ratio <= 1.25) { score += 10; reasons.push('Precio similar') }
      else { score += 3; reasons.push('Precio aproximado') }
    }

    return {
      price: candPrice,
      listingUrl: candidate.sourceListingUrl,
      title: candidate.title,
      distance_km: 0,
      age_days: this._daysSince(candidate.listingDate),
      qualityScore: Math.min(100, score),
      source: candidate.source,
      reason: reasons.join(', '),
      make: candidate.make,
      model: candidate.model,
      year: candYear,
      kilometers: candidate.kilometers,
      fuel: candidate.fuel,
      listPrice: candPrice
    }
  }

  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return null
    const lat1 = loc1.lat, lng1 = loc1.lng
    const lat2 = loc2.lat, lng2 = loc2.lng
    if (!lat1 || !lng1 || !lat2 || !lng2) return null

    const R = 6371
    const dLat = this._toRad(lat2 - lat1)
    const dLng = this._toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
              Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  _toRad(deg) { return deg * (Math.PI / 180) }

  calculateEstimatedValue(comparables) {
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

  generateComparablesReport(comparables, asset) {
    if (comparables.length === 0) {
      return `No se encontraron comparables para este ${asset.vertical === 'real_estate' ? 'inmueble' : 'vehículo'}.`
    }

    let report = `## Análisis de Comparables\n\n`
    report += `Se encontraron **${comparables.length}** comparables:\n\n`
    report += `| # | Precio | Calidad | Razón |\n|---|---|---|---|\n`
    comparables.forEach((c, i) => {
      report += `| ${i + 1} | $${(c.price || 0).toLocaleString()} | ${c.qualityScore}% | ${c.reason} |\n`
    })

    const estValue = this.calculateEstimatedValue(comparables)
    if (estValue > 0 && asset.priceAmount) {
      const diff = ((estValue - asset.priceAmount) / estValue) * 100
      report += `\n**Valor estimado:** $${Math.round(estValue).toLocaleString()}\n`
      report += `**Precio listado:** $${Math.round(asset.priceAmount).toLocaleString()}\n`
      report += `**Diferencia:** ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%\n`
      if (diff >= 15) report += `\n✅ **OPORTUNIDAD DETECTADA**: Precio ${diff.toFixed(0)}% por debajo del valor estimado\n`
      else if (diff >= 5) report += `\nℹ️ Precio ligeramente por debajo del valor estimado\n`
      else if (diff >= -5) report += `\nℹ️ Precio cercano al valor estimado\n`
      else report += `\n⚠️ Precio por encima del valor estimado\n`
    }

    return report
  }

  _daysSince(dateStr) {
    if (!dateStr) return 999
    const d = new Date(dateStr)
    return Math.floor((Date.now() - d.getTime()) / 86400000)
  }
}
