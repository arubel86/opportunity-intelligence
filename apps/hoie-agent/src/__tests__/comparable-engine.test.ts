import { describe, it, expect } from 'vitest'
import { ComparableEngine } from '../engine/comparable-engine.js'

describe('ComparableEngine', () => {
  const engine = new ComparableEngine()

  const targetAsset = {
    asset_id: 'target-1',
    source_id: 'encuentra24',
    vertical: 'real_estate' as const,
    status: 'active' as const,
    price_amount: 150000,
    price_currency: 'USD',
    title: 'Apartamento de 2 recámaras en San Francisco, Panamá',
    description: 'Bello apartamento en San Francisco de 100 m2 con 2 recámaras',
    location: {
      province: 'Panamá',
      district: 'San Francisco',
      neighborhood: 'San Francisco'
    }
  }

  it('debe descartar candidatos de provincias distintas', () => {
    const listingPool = [
      {
        asset_id: 'candidate-diff-province',
        source_id: 'encuentra24',
        vertical: 'real_estate' as const,
        status: 'active' as const,
        price_amount: 140000,
        price_currency: 'USD',
        title: 'Apartamento en David, Chiriquí',
        location: {
          province: 'Chiriquí',
          district: 'David'
        }
      }
    ]

    const result = engine.findComparables(targetAsset, listingPool)

    expect(result.comparables.length).toBe(0)
    expect(result.discarded.some(d => d.reason === 'different_region')).toBe(true)
  })

  it('debe encontrar comparables de calidad aceptable en la misma provincia/distrito', () => {
    const listingPool = [
      {
        asset_id: 'candidate-good-match',
        source_listing_id: 'candidate-good-match',
        source_id: 'encuentra24',
        vertical: 'real_estate' as const,
        status: 'active' as const,
        price_amount: 160000,
        price_currency: 'USD',
        title: 'Apartamento de 2 recámaras en San Francisco',
        description: 'Apartamento cómodo de 110 m2 y 2 recámaras',
        location: {
          province: 'Panamá',
          district: 'San Francisco'
        }
      }
    ]

    const result = engine.findComparables(targetAsset, listingPool)

    expect(result.comparables.length).toBe(1)
    expect(result.comparables[0].qualityScore).toBeGreaterThanOrEqual(30)
    expect(result.comparables[0].reason).toContain('Mismo distrito')
  })

  it('debe ordenar por qualityScore de forma descendente', () => {
    const listingPool = [
      {
        asset_id: 'candidate-low-quality',
        source_listing_id: 'candidate-low-quality',
        source_id: 'encuentra24',
        vertical: 'real_estate' as const,
        status: 'active' as const,
        price_amount: 110000, // Menor similitud de precio
        price_currency: 'USD',
        title: 'Casa en San Francisco',
        location: {
          province: 'Panamá',
          district: 'San Francisco'
        }
      },
      {
        asset_id: 'candidate-high-quality',
        source_listing_id: 'candidate-high-quality',
        source_id: 'encuentra24',
        vertical: 'real_estate' as const,
        status: 'active' as const,
        price_amount: 155000, // Mayor similitud de precio
        price_currency: 'USD',
        title: 'Apartamento en San Francisco',
        location: {
          province: 'Panamá',
          district: 'San Francisco'
        }
      }
    ]

    const result = engine.findComparables(targetAsset, listingPool)

    expect(result.comparables.length).toBe(2)
    expect(result.comparables[0].qualityScore).toBeGreaterThanOrEqual(result.comparables[1].qualityScore)
    expect(result.comparables[0].listingUrl).toBe('candidate-high-quality')
  })
})
