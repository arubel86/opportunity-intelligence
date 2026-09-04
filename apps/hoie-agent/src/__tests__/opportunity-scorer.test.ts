import { describe, it, expect } from 'vitest'
import { OpportunityScorer } from '../scorer/opportunity-scorer.js'

describe('OpportunityScorer', () => {
  const scorer = new OpportunityScorer()

  const mockAsset = {
    asset_id: 'test-123',
    source_id: 'banco-nacional-source',
    vertical: 'real_estate' as const,
    status: 'active' as const,
    price_currency: 'USD',
    title: 'Test Property',
    price_amount: 200000,
    location: {
      province: 'Panamá',
      district: 'Bella Vista'
    },
    seller_type: 'bank'
  }

  it('debe retornar score de 0 si hay menos de 3 comparables (RULE-V-001)', async () => {
    const mockComparables = [
      { price: 250000, distance_km: 0.5, age_days: 15, quality_score: 85 }
    ]

    const result = await scorer.calculate(mockAsset, mockComparables)

    expect(result.final_score).toBe(44) // final_score ponderado con subcomponentes con default
    expect(result.components?.price_vs_estimated_value?.score).toBe(0) // 0 por insuficientes comparables
  })

  it('debe calcular el score ponderado correctamente con 3 comparables válidos', async () => {
    const mockComparables = [
      { price: 250000, distance_km: 0.5, age_days: 15, quality_score: 85 },
      { price: 240000, distance_km: 1.2, age_days: 30, quality_score: 80 },
      { price: 245000, distance_km: 2.0, age_days: 45, quality_score: 75 }
    ]

    const result = await scorer.calculate(mockAsset, mockComparables)

    expect(result.final_score).toBeGreaterThan(0)
    expect(result.grade).toBeDefined()
    expect(result.confidence).toBeDefined()
    expect(result.components?.price_vs_estimated_value?.score).toBeGreaterThan(0)
  })

  it('debe asignar el grado correcto basado en el puntaje obtenido', async () => {
    // Probamos el método calculateGrade indirectamente
    const mockComparables = [
      { price: 300000, distance_km: 0.2, age_days: 5, quality_score: 95 },
      { price: 290000, distance_km: 0.4, age_days: 10, quality_score: 90 },
      { price: 295000, distance_km: 0.6, age_days: 12, quality_score: 88 }
    ]

    const result = await scorer.calculate(mockAsset, mockComparables)
    // El precio de lista es 200,000 frente a un valor estimado de ~295,000 (descuento considerable)
    expect(result.final_score).toBeGreaterThanOrEqual(75) // Esperamos un puntaje alto
    expect(['A+', 'A', 'A-', 'B+', 'B']).toContain(result.grade)
  })
})
