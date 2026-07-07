// ── Component Props Interfaces ──────────────────────────────────────────────

export interface KpiCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    pct: number
  }
  color?: 'default' | 'buy' | 'negotiate' | 'watch' | 'avoid'
  loading?: boolean
}

export interface PipelineStatusProps {
  status: 'running' | 'completed' | 'failed' | 'idle'
  lastRun?: string
  durationMs?: number
}

export interface FilterChipProps {
  label: string
  onRemove: () => void
}

export interface AssetMarkerProps {
  asset: AssetPipelineRow
  isSelected: boolean
  onSelect: (assetId: string) => void
}

export interface MarkerClusterProps {
  clusters: ClusterFeature[]
  onClusterClick: (clusterId: number, center: [number, number]) => void
}

export interface HeatmapLayerProps {
  assets: AssetPipelineRow[]
  visible: boolean
  threshold?: number
}

export interface MapPopupProps {
  asset: AssetPipelineRow
  onClose: () => void
}

export interface DetailPanelProps {
  assetId: string | null
  onClose: () => void
}

export interface DetailPhotoProps {
  photos: string[]
  alt: string
}

export interface DetailExplainabilityProps {
  score: OpportunityScore | null
  riskFactors: RiskFactors | null
}

export interface ComparablesListProps {
  assetId: string
}

export interface ComparableCardProps {
  comparable: {
    comparison_id: string
    comp_asset_id: string
    price: number
    distance_km: number
    age_days: number
    quality_score: number
    match_reason: string
    comp_asset: {
      title: string
      price_amount: number
      raw_data: Record<string, any>
      source_listing_url: string
    }
  }
  onClick: (compAssetId: string) => void
}

export interface GradeBadgeProps {
  grade?: string
  score?: number
  size?: 'sm' | 'md' | 'lg'
}

export interface ActionBadgeProps {
  action: string
  size?: 'sm' | 'md' | 'lg'
}

export interface TimelineSliderProps {
  minDate: string
  maxDate: string
  value: { from: string; to: string }
  onChange: (range: { from: string; to: string }) => void
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
}

export interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'dots'
  count?: number
  height?: string
  message?: string
}

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

// ── Domain Types ───────────────────────────────────────────────────────────

export interface AssetPipelineRow {
  asset_id: string
  source_id: string
  source_name: string
  vertical: string
  title: string | null
  description: string | null
  price_amount: number | null
  price_currency: string
  location: {
    province?: string
    district?: string
    corregimiento?: string
    neighborhood?: string
    coordinates?: { lat: number; lng: number }
  } | null
  seller_type: string | null
  status: string
  final_score: number | null
  grade: string | null
  confidence: number | null
  components: Record<string, any> | null
  recommended_action: string | null
  investment_profile: string | null
  thesis_text: string | null
  urgency_level: number | null
  first_seen_at: string
  last_seen_at: string
  scored_at: string | null
  decision_at: string | null
  raw_data: Record<string, any> | null
  risk_factors: RiskFactors | null
  capital_recommendation: CapitalRecommendation | null
  owner_name: string | null
}

export interface RiskFactors {
  estimated_value?: number
  discount_pct?: number
  score_grade?: string
  confidence_pct?: number
  comparable_quality?: number
}

export interface CapitalRecommendation {
  min_capital?: number
  expected_roi_year1?: number
  horizon_months?: number
  investor_profile?: string
}

export interface OpportunityScore {
  score_id: string
  asset_id: string
  version: number
  components: {
    price_vs_estimated_value?: { score: number; weight: number; details?: Record<string, any> }
    comparables_analysis?: { score: number; weight: number; details?: Record<string, any> }
    location_quality?: { score: number; weight: number; details?: Record<string, any> }
    market_trend?: { score: number; weight: number; details?: Record<string, any> }
    exit_strategy?: { score: number; weight: number; details?: Record<string, any> }
    liquidity?: { score: number; weight: number; details?: Record<string, any> }
    seller_motivation?: { score: number; weight: number; details?: Record<string, any> }
    risk_assessment?: { score: number; weight: number; details?: Record<string, any> }
    rental_potential?: { score: number; weight: number; details?: Record<string, any> }
  } | null
  final_score: number
  grade: string
  confidence: number
  model_version: string
  calculated_at: string
}

export interface InvestmentDecision {
  decision_id: string
  asset_id: string
  opportunity_score: number | null
  confidence_score: number | null
  investment_profile: string
  recommended_action: string
  thesis_text: string
  urgency_level: number
  capital_recommendation: CapitalRecommendation | null
  risk_factors: RiskFactors | null
  created_at: string
}

export interface PipelineRun {
  run_id: string
  status: string
  assets_scraped: number | null
  assets_normalized: number | null
  assets_scored: number | null
  decisions_generated: number | null
  assets_inserted: number | null
  assets_updated: number | null
  errors_count: number | null
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  error_log: Record<string, any> | null
}

export interface Source {
  source_id: string
  name: string
  display_name: string
  vertical: string
  is_active: boolean
}

export interface DashboardSummary {
  total_active_assets: number
  buy_now_count: number
  watch_count: number
  negotiate_count: number
  avoid_count: number
  avg_score: number | null
  avg_confidence: number | null
  avg_price: number | null
  total_portfolio_value: number | null
}

export interface ClusterFeature {
  type: 'Feature'
  properties: {
    cluster?: boolean
    cluster_id?: number
    point_count?: number
    point_count_abbreviated?: string
    id?: string
    title?: string
    price?: number
    score?: number
    action?: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface Reason {
  positive: boolean
  text: string
}
