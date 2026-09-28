// Valuation Engine - multiple valuation methods with confidence scoring
import type { Asset } from '@hermes/types'
import { PANAMA_LOCATIONS } from '../data/panama-locations.js'
import type { Comparable } from './comparable-engine.js'

export interface ValuationResult {
  estimatedValue: number
  pricePerM2: number
  confidence: number // 0-100
  methods: ValuationMethod[]
  summary: string
}

export interface ValuationMethod {
  name: string
  value: number
  weight: number
  confidence: number
  details: Record<string, any>
}

export class ValuationEngine {
  /**
   * Calculate estimated value using multiple methods
   */
  estimate(asset: Asset, comparables: Comparable[]): ValuationResult {
    const methods: ValuationMethod[] = []

    // 1. Comparable Method (most reliable with good comparables)
    methods.push(this._comparableMethod(asset, comparables))

    // 2. Price per m2 Method (based on neighborhood averages)
    methods.push(this._pricePerM2Method(asset))

    // 3. Location-adjusted Method (based on location quality scores)
    methods.push(this._locationAdjustedMethod(asset))

    // Filter valid methods
    const validMethods = methods.filter(m => m.value > 0 && m.confidence > 0)

    if (validMethods.length === 0) {
      return {
        estimatedValue: 0,
        pricePerM2: 0,
        confidence: 0,
        methods: [],
        summary: 'No se pudo determinar el valor estimado'
      }
    }

    // Weighted average of all methods
    const totalWeight = validMethods.reduce((s, m) => s + m.weight, 0)
    const weightedValue = validMethods.reduce((s, m) => s + m.value * m.weight, 0) / totalWeight

    // Overall confidence: weighted average of method confidences
    const overallConfidence = validMethods.reduce((s, m) => s + m.confidence * m.weight, 0) / totalWeight

    // Price per m2
    const pricePerM2 = this._calcPricePerM2(asset, weightedValue)

    return {
      estimatedValue: Math.round(weightedValue),
      pricePerM2,
      confidence: Math.round(overallConfidence),
      methods: validMethods,
      summary: this._generateSummary(asset, weightedValue, overallConfidence)
    }
  }

  /**
   * Comparable Method: weighted average of comparable property prices
   */
  private _comparableMethod(asset: Asset, comparables: Comparable[]): ValuationMethod {
    const compPrice = asset.price_amount || 0

    if (comparables.length === 0) {
      return {
        name: 'Comparables',
        value: compPrice,
        weight: 0,
        confidence: 0,
        details: { reason: 'No hay comparables disponibles' }
      }
    }

    // Weighted average by quality score
    let totalWeighted = 0
    let totalWeight = 0
    for (const comp of comparables) {
      const w = comp.qualityScore / 100
      totalWeighted += comp.price * w
      totalWeight += w
    }

    const value = totalWeight > 0 ? totalWeighted / totalWeight : 0

    // Confidence: based on number and quality of comparables
    const avgQuality = comparables.reduce((s, c) => s + c.qualityScore, 0) / comparables.length
    const countBonus = Math.min(comparables.length / 10, 1) * 10
    const qualityBonus = (avgQuality / 100) * 40
    const confidence = Math.min(95, 15 + countBonus + qualityBonus)

    return {
      name: 'Método de Comparables',
      value,
      weight: comparables.length >= 3 ? 0.50 : 0.30,
      confidence,
      details: {
        comparablesCount: comparables.length,
        avgQuality,
        rawValue: value
      }
    }
  }

  /**
   * Price per m2 Method: estimate based on reference avgPricePerM2
   */
  private _pricePerM2Method(asset: Asset): ValuationMethod {
    const location = asset.location
    if (!location) return { name: 'Precio por m2', value: 0, weight: 0, confidence: 0, details: { reason: 'Sin ubicación' } }

    // Find best matching reference location
    const ref = this._findBestLocationRef(location)
    if (!ref) return { name: 'Precio por m2', value: 0, weight: 0, confidence: 0, details: { reason: 'Sin referencia de ubicación' } }

    // Estimate area from description or title
    const areaM2 = this._extractAreaM2(asset)
    if (areaM2 <= 0) return { name: 'Precio por m2', value: 0, weight: 0, confidence: 0, details: { reason: 'Superficie desconocida' } }

    const value = ref.avgPricePerM2 * areaM2
    const confidence = 40 + ((ref.qualityScore / 10) * 30) // Lower reliability than comparables

    return {
      name: 'Precio por m2 de referencia',
      value,
      weight: 0.20,
      confidence,
      details: {
        referenceArea: ref.neighborhood,
        avgPricePerM2: ref.avgPricePerM2,
        qualityScore: ref.qualityScore,
        estimatedArea: areaM2
      }
    }
  }

  /**
   * Location-adjusted Method: adjust listed price based on location quality
   */
  private _locationAdjustedMethod(asset: Asset): ValuationMethod {
    const location = asset.location
    const listedPrice = asset.price_amount || 0
    if (!location || listedPrice <= 0) {
      return { name: 'Ajuste por ubicación', value: 0, weight: 0, confidence: 0, details: { reason: 'Sin precio o ubicación' } }
    }

    const ref = this._findBestLocationRef(location)
    if (!ref) return { name: 'Ajuste por ubicación', value: 0, weight: 0, confidence: 0, details: { reason: 'Sin referencia' } }

    // Calculate average price per m2 in the area from comparables or reference
    const areaM2 = this._extractAreaM2(asset)
    let adjustmentFactor = 1.0

    if (areaM2 > 0) {
      const listedPerM2 = listedPrice / areaM2
      const refPerM2 = ref.avgPricePerM2
      // If listed price/m2 is very different from reference, adjust
      if (refPerM2 > 0) {
        const ratio = listedPerM2 / refPerM2
        if (ratio > 1.3) adjustmentFactor = 0.85 // Overpriced for the area
        else if (ratio < 0.7) adjustmentFactor = 1.15 // Underpriced for the area
      }
    }

    const value = listedPrice * adjustmentFactor
    const confidence = 30 + ((ref.qualityScore / 10) * 20)

    return {
      name: 'Ajuste por ubicación',
      value,
      weight: 0.15,
      confidence,
      details: {
        refQualityScore: ref.qualityScore,
        adjustmentFactor,
        refAvgPricePerM2: ref.avgPricePerM2,
        estimatedAreaM2: areaM2
      }
    }
  }

  /**
   * Compare estimated value to listed price
   */
  assessOpportunity(asset: Asset, valuation: ValuationResult): {
    difference: number
    differencePercent: number
    assessment: string
    recommendation: 'BUY' | 'NEUTRAL' | 'AVOID'
  } {
    const listed = asset.price_amount || 0
    const estimated = valuation.estimatedValue

    if (listed <= 0 || estimated <= 0) {
      return { difference: 0, differencePercent: 0, assessment: 'Datos insuficientes', recommendation: 'NEUTRAL' }
    }

    const diff = ((estimated - listed) / estimated) * 100
    const absDiff = Math.abs(diff)

    let assessment: string
    let recommendation: 'BUY' | 'NEUTRAL' | 'AVOID'

    if (diff >= 15) {
      assessment = `OPORTUNIDAD: Precio ${diff.toFixed(0)}% por debajo del valor estimado`
      recommendation = 'BUY'
    } else if (diff >= 5) {
      assessment = `Ligeramente infravalorado (${diff.toFixed(1)}% por debajo)`
      recommendation = 'BUY'
    } else if (diff >= -5) {
      assessment = `Precio cercano al valor estimado (${diff.toFixed(1)}% de diferencia)`
      recommendation = 'NEUTRAL'
    } else if (diff >= -15) {
      assessment = `Ligeramente sobrevalorado (${Math.abs(diff).toFixed(1)}% por encima)`
      recommendation = 'AVOID'
    } else {
      assessment = `SOBREVALORADO: Precio ${Math.abs(diff).toFixed(0)}% por encima del valor estimado`
      recommendation = 'AVOID'
    }

    return { difference: diff, differencePercent: absDiff, assessment, recommendation }
  }

  private _findBestLocationRef(location: Asset['location']): typeof PANAMA_LOCATIONS[0] | null {
    if (!location) return null

    // Try neighborhood match
    if (location.neighborhood) {
      const match = PANAMA_LOCATIONS.find(
        r => r.neighborhood.toLowerCase() === location.neighborhood!.toLowerCase()
      )
      if (match) return match
    }

    // Try district match
    if (location.district) {
      const match = PANAMA_LOCATIONS.find(
        r => r.district.toLowerCase() === location.district!.toLowerCase()
      )
      if (match) return match
    }

    // Try province match
    if (location.province) {
      const match = PANAMA_LOCATIONS.find(
        r => r.province.toLowerCase() === location.province!.toLowerCase()
      )
      if (match) return match
    }

    return null
  }

  private _extractAreaM2(asset: Asset): number {
    const desc = asset.description || asset.title || ''
    const match = desc.match(/([\d.]+)\s*m2/i)
    return match ? parseFloat(match[1]) : 0
  }

  private _calcPricePerM2(asset: Asset, estimatedValue: number): number {
    const area = this._extractAreaM2(asset)
    if (area <= 0) return 0
    return Math.round(estimatedValue / area)
  }

  private _generateSummary(asset: Asset, estimatedValue: number, confidence: number): string {
    const listed = asset.price_amount || 0
    if (listed <= 0) return `Valor estimado: $${Math.round(estimatedValue).toLocaleString()}`

    const diff = ((estimatedValue - listed) / estimatedValue) * 100
    let level = ''
    if (confidence >= 70) level = 'Alta confianza'
    else if (confidence >= 40) level = 'Confianza media'
    else level = 'Confianza baja'

    return `${level}: Valor estimado $${Math.round(estimatedValue).toLocaleString()} ` +
      `(${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs listado de $${listed.toLocaleString()})`
  }
}
