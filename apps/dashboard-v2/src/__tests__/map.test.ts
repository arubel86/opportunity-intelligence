import { describe, it, expect } from 'vitest'
import { markerColor, markerSize, assetsToGeoJSON, inBbox, haversineDistance } from '../types/map'
import type { AssetPipelineRow } from '../types/components'

describe('map utils', () => {
  describe('markerColor', () => {
    it('returns green for BUY_NOW', () => {
      expect(markerColor('BUY_NOW')).toBe('#238636')
    })
    it('returns red for AVOID', () => {
      expect(markerColor('AVOID')).toBe('#f85149')
    })
    it('returns gray for null action', () => {
      expect(markerColor(null)).toBe('#64748b')
    })
  })

  describe('markerSize', () => {
    it('returns 16 for null/zero price', () => {
      expect(markerSize(null)).toBe(16)
      expect(markerSize(0)).toBe(16)
    })
    it('returns ~16 for $100K', () => {
      expect(markerSize(100000)).toBeGreaterThanOrEqual(16)
      expect(markerSize(100000)).toBeLessThanOrEqual(20)
    })
    it('returns ~40 for $2M', () => {
      expect(markerSize(2000000)).toBeGreaterThanOrEqual(36)
      expect(markerSize(2000000)).toBeLessThanOrEqual(40)
    })
    it('caps at 40', () => {
      expect(markerSize(10000000)).toBe(40)
    })
  })

  describe('assetsToGeoJSON', () => {
    it('converts assets to GeoJSON', () => {
      const assets: AssetPipelineRow[] = [
        {
          asset_id: '1',
          source_id: 's1',
          source_name: 'Test',
          vertical: 'real_estate',
          title: 'Test',
          description: null,
          price_amount: 100000,
          price_currency: 'USD',
          location: { province: 'Panamá', coordinates: { lat: 9, lng: -79 } },
          seller_type: null,
          status: 'active',
          final_score: 80,
          grade: 'A',
          confidence: 90,
          components: null,
          recommended_action: 'BUY_NOW',
          investment_profile: null,
          thesis_text: null,
          urgency_level: 5,
          first_seen_at: '2024-01-01',
          last_seen_at: '2024-01-01',
          scored_at: null,
          decision_at: null,
          raw_data: null,
          risk_factors: null,
          capital_recommendation: null,
          owner_name: null,
        },
      ]
      const geojson = assetsToGeoJSON(assets)
      expect(geojson.type).toBe('FeatureCollection')
      expect(geojson.features).toHaveLength(1)
      expect(geojson.features[0].geometry.type).toBe('Point')
      expect((geojson.features[0].geometry as GeoJSON.Point).coordinates).toEqual([-79, 9])
    })

    it('excludes assets without coordinates', () => {
      const assets: AssetPipelineRow[] = [
        { asset_id: '1', location: { province: 'Panamá' } } as any,
      ]
      const geojson = assetsToGeoJSON(assets)
      expect(geojson.features).toHaveLength(0)
    })
  })

  describe('inBbox', () => {
    it('returns true for point inside bbox', () => {
      expect(inBbox(9, -79, [[-80, 8], [-78, 10]])).toBe(true)
    })
    it('returns false for point outside bbox', () => {
      expect(inBbox(11, -79, [[-80, 8], [-78, 10]])).toBe(false)
    })
  })

  describe('haversineDistance', () => {
    it('returns ~0 for same point', () => {
      expect(haversineDistance(9, -79, 9, -79)).toBeCloseTo(0, 1)
    })
    it('returns positive for different points', () => {
      expect(haversineDistance(9, -79, 9.1, -79)).toBeGreaterThan(0)
    })
  })
})
