import { z } from 'zod'

// Source schema
export const SourceSchema = z.object({
  source_id: z.string().uuid(),
  name: z.string(),
  display_name: z.string(),
  vertical: z.enum(['real_estate', 'vehicles']),
  source_type: z.enum(['portal', 'api', 'rss', 'scrape']),
  base_url: z.string().url(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  quality_score: z.number().min(0).max(1),
  technical_difficulty: z.enum(['trivial', 'easy', 'medium', 'hard', 'blocked']),
  legal_status: z.enum(['clear', 'review_needed', 'restricted', 'blocked']),
  rate_limits: z.object({
    requests_per_minute: z.number().default(60),
    requests_per_hour: z.number().default(1000)
  }),
  authentication: z.record(z.any()).optional(),
  selectors: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
})

// Asset schema
export const AssetSchema = z.object({
  asset_id: z.string().uuid().optional(),
  source_id: z.string().uuid(),
  source_listing_id: z.string().optional(),
  source_listing_url: z.string().url().optional(),
  vertical: z.enum(['real_estate', 'vehicles']),
  status: z.enum(['active', 'sold', 'removed', 'expired', 'duplicated', 'investigating']).default('active'),
  title: z.string().optional(),
  description: z.string().optional(),
  price_amount: z.number().optional(),
  price_currency: z.string().length(3).default('USD'),
  location: z.object({
    province: z.string().optional(),
    district: z.string().optional(),
    corregimiento: z.string().optional(),
    neighborhood: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }).optional(),
  seller_type: z.string().optional(),
  tags: z.array(z.string()).optional()
})

// Opportunity Score schema
export const OpportunityScoreSchema = z.object({
  score_id: z.string().uuid().optional(),
  asset_id: z.string().uuid(),
  version: z.number().default(1),
  components: z.object({
    price_vs_estimated_value: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.25),
      details: z.record(z.any()).optional()
    }).optional(),
    comparables_analysis: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.25),
      details: z.record(z.any()).optional()
    }).optional(),
    location_quality: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.20),
      details: z.record(z.any()).optional()
    }).optional(),
    market_trend: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.10),
      details: z.record(z.any()).optional()
    }).optional(),
    exit_strategy: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.05),
      details: z.record(z.any()).optional()
    }).optional(),
    liquidity: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.05),
      details: z.record(z.any()).optional()
    }).optional(),
    seller_motivation: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.05),
      details: z.record(z.any()).optional()
    }).optional(),
    risk_assessment: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.05),
      details: z.record(z.any()).optional()
    }).optional(),
    rental_potential: z.object({
      score: z.number().min(0).max(1),
      weight: z.number().default(0.05),
      details: z.record(z.any()).optional()
    }).optional()
  }).optional(),
  final_score: z.number().min(0).max(100),
  grade: z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']),
  confidence: z.number().min(0).max(100),
  model_version: z.string().default('opportunity-scorer-v1.1'),
  calculated_at: z.date().optional()
})

// Investment Decision schema
export const InvestmentDecisionSchema = z.object({
  decision_id: z.string().uuid().optional(),
  asset_id: z.string().uuid(),
  opportunity_score: z.number().optional(),
  confidence_score: z.number().optional(),
  investment_profile: z.enum(['value_investment', 'cash_flow', 'appreciation', 'flip_opportunity', 'long_term_hold', 'high_risk_opportunity', 'speculative']),
  recommended_action: z.enum(['BUY_NOW', 'WATCH_HIGH_PRIORITY', 'NEGOTIATE', 'RESEARCH_MORE', 'AVOID', 'MANUAL_REVIEW_REQUIRED']),
  thesis_text: z.string(),
  urgency_level: z.number().min(1).max(5),
  capital_recommendation: z.object({
    min_capital: z.number().optional(),
    expected_roi_year1: z.number().optional(),
    horizon_months: z.number().optional(),
    investor_profile: z.string().optional()
  }).optional()
})

// Export types
export type Source = z.infer<typeof SourceSchema>
export type Asset = z.infer<typeof AssetSchema>
export type OpportunityScore = z.infer<typeof OpportunityScoreSchema>
export type InvestmentDecision = z.infer<typeof InvestmentDecisionSchema>