import type { AssetPipelineRow } from './components'

// ── Marker Colors ──────────────────────────────────────────────────────────

export const ACTION_COLORS: Record<string, string> = {
  BUY_NOW: '#238636',
  WATCH_HIGH_PRIORITY: '#1f6feb',
  NEGOTIATE: '#d29922',
  RESEARCH_MORE: '#d96c1a',
  AVOID: '#f85149',
  MANUAL_REVIEW_REQUIRED: '#64748b',
}

export function markerColor(action: string | null): string {
  return ACTION_COLORS[action || ''] || '#64748b'
}

// ── Marker Size (log scale) ───────────────────────────────────────────────

export function markerSize(price: number | null): number {
  if (!price || price <= 0) return 16
  const size = Math.log(price / 100000) * 8 + 16
  return Math.max(16, Math.min(40, size))
}

// ── GeoJSON Conversion ────────────────────────────────────────────────────

export function assetsToGeoJSON(assets: AssetPipelineRow[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: assets
      .filter(a => a.location?.coordinates?.lat && a.location?.coordinates?.lng)
      .map(a => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [a.location!.coordinates!.lng, a.location!.coordinates!.lat] as [number, number],
        },
        properties: {
          id: a.asset_id,
          title: a.title,
          price: a.price_amount,
          score: a.final_score,
          action: a.recommended_action,
          confidence: a.confidence,
          source: a.source_name,
        },
      })),
  }
}

// ── BBox Check ─────────────────────────────────────────────────────────────

export function inBbox(
  lat: number,
  lng: number,
  bbox: [[number, number], [number, number]] // [[minLng, minLat], [maxLng, maxLat]]
): boolean {
  const [[minLng, minLat], [maxLng, maxLat]] = bbox
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
}

// ── Distance ───────────────────────────────────────────────────────────────

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
