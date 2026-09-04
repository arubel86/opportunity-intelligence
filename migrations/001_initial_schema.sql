-- =============================================================================
-- Hermes Migration 001: Initial Schema
-- Creates: tables, indices, RLS, functions, views, triggers
-- =============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Sources (scraping origins) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
  source_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  vertical     TEXT NOT NULL CHECK (vertical IN ('real_estate', 'vehicles')),
  source_type  TEXT NOT NULL CHECK (source_type IN ('portal', 'api', 'rss', 'scrape')),
  base_url     TEXT NOT NULL,
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  quality_score NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (quality_score >= 0 AND quality_score <= 1),
  technical_difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (technical_difficulty IN ('trivial', 'easy', 'medium', 'hard', 'blocked')),
  legal_status TEXT NOT NULL DEFAULT 'clear' CHECK (legal_status IN ('clear', 'review_needed', 'restricted', 'blocked')),
  rate_limits  JSONB NOT NULL DEFAULT '{"requests_per_minute": 60, "requests_per_hour": 1000}',
  tags         TEXT[] DEFAULT '{}',
  selectors    JSONB,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_vertical ON sources(vertical);
CREATE INDEX IF NOT EXISTS idx_sources_priority ON sources(priority);
CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active) WHERE is_active = true;

-- ── Assets (properties/vehicles) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  asset_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id          UUID NOT NULL REFERENCES sources(source_id) ON DELETE CASCADE,
  source_listing_id  TEXT,
  source_listing_url TEXT,
  vertical           TEXT NOT NULL CHECK (vertical IN ('real_estate', 'vehicles')),
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'removed', 'expired', 'duplicated', 'investigating')),
  title              TEXT,
  description        TEXT,
  price_amount       NUMERIC(12,2),
  price_currency     TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(price_currency) = 3),
  seller_type        TEXT,
  tags               TEXT[] DEFAULT '{}',
  location           JSONB,
  raw_data           JSONB,
  content_hash       TEXT,
  first_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scraped_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source_id);
CREATE INDEX IF NOT EXISTS idx_assets_vertical ON assets(vertical);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_price ON assets(price_amount);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets USING GIN (location jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_assets_content_hash ON assets(content_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_source_listing ON assets(source_id, source_listing_id) WHERE source_listing_id IS NOT NULL;

-- ── Comparisons (matched comparables for each asset) ────────────────────────
CREATE TABLE IF NOT EXISTS comparisons (
  comparison_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id      UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  comp_asset_id UUID REFERENCES assets(asset_id) ON DELETE SET NULL,
  price         NUMERIC(12,2),
  distance_km   NUMERIC(8,2),
  age_days      INTEGER,
  quality_score NUMERIC(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  match_reason  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comparisons_asset ON comparisons(asset_id);

-- ── Opportunity Scores ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunity_scores (
  score_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id       UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  version        INTEGER NOT NULL DEFAULT 1,
  components     JSONB,
  final_score    NUMERIC(5,2) NOT NULL CHECK (final_score >= 0 AND final_score <= 100),
  grade          TEXT NOT NULL CHECK (grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D','F')),
  confidence     NUMERIC(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  model_version  TEXT NOT NULL DEFAULT 'opportunity-scorer-v1.1',
  calculated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_asset ON opportunity_scores(asset_id);
CREATE INDEX IF NOT EXISTS idx_scores_final ON opportunity_scores(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_grade ON opportunity_scores(grade);

-- ── Investment Decisions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investment_decisions (
  decision_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id             UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  opportunity_score_id UUID REFERENCES opportunity_scores(score_id) ON DELETE SET NULL,
  opportunity_score    NUMERIC(5,2),
  confidence_score     NUMERIC(5,2),
  investment_profile   TEXT NOT NULL CHECK (investment_profile IN ('value_investment', 'cash_flow', 'appreciation', 'flip_opportunity', 'long_term_hold', 'high_risk_opportunity', 'speculative')),
  recommended_action   TEXT NOT NULL CHECK (recommended_action IN ('BUY_NOW', 'WATCH_HIGH_PRIORITY', 'NEGOTIATE', 'RESEARCH_MORE', 'AVOID', 'MANUAL_REVIEW_REQUIRED')),
  thesis_text          TEXT NOT NULL,
  urgency_level        INTEGER NOT NULL CHECK (urgency_level >= 1 AND urgency_level <= 5),
  capital_recommendation JSONB,
  risk_factors         JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_asset ON investment_decisions(asset_id);
CREATE INDEX IF NOT EXISTS idx_decisions_action ON investment_decisions(recommended_action);
CREATE INDEX IF NOT EXISTS idx_decisions_profile ON investment_decisions(investment_profile);

-- ── Pipeline Runs (execution logs) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_runs (
  run_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status              TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  assets_scraped      INTEGER DEFAULT 0,
  assets_normalized   INTEGER DEFAULT 0,
  assets_scored       INTEGER DEFAULT 0,
  decisions_generated INTEGER DEFAULT 0,
  assets_inserted     INTEGER DEFAULT 0,
  assets_updated      INTEGER DEFAULT 0,
  errors_count        INTEGER DEFAULT 0,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at         TIMESTAMPTZ,
  duration_ms         INTEGER,
  error_log           JSONB
);

-- ── Dashboard Cache (pre-computed metrics) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  metric_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_key   TEXT NOT NULL UNIQUE,
  metric_value JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Functions ───────────────────────────────────────────────────────────────

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate estimated value from comparables
CREATE OR REPLACE FUNCTION calculate_estimated_value(p_asset_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_estimated NUMERIC;
BEGIN
  SELECT AVG(c.price * c.quality_score) INTO v_estimated
  FROM comparisons c
  WHERE c.asset_id = p_asset_id AND c.price IS NOT NULL AND c.quality_score IS NOT NULL;

  RETURN COALESCE(v_estimated, 0);
END;
$$ LANGUAGE plpgsql;

-- Get market summary for a district
CREATE OR REPLACE FUNCTION get_district_summary(p_district TEXT)
RETURNS TABLE(
  total_assets    BIGINT,
  avg_price       NUMERIC,
  min_price       NUMERIC,
  max_price       NUMERIC,
  buy_now_count   BIGINT,
  watch_count     BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT a.asset_id)::BIGINT,
    AVG(a.price_amount)::NUMERIC,
    MIN(a.price_amount)::NUMERIC,
    MAX(a.price_amount)::NUMERIC,
    COUNT(DISTINCT d.asset_id) FILTER (WHERE d.recommended_action = 'BUY_NOW')::BIGINT,
    COUNT(DISTINCT d.asset_id) FILTER (WHERE d.recommended_action = 'WATCH_HIGH_PRIORITY')::BIGINT
  FROM assets a
  LEFT JOIN investment_decisions d ON a.asset_id = d.asset_id
  WHERE a.location->>'district' = p_district
    AND a.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ── Views ───────────────────────────────────────────────────────────────────

-- Active assets with their latest score and decision
CREATE OR REPLACE VIEW v_asset_pipeline AS
SELECT
  a.asset_id,
  a.source_id,
  s.display_name AS source_name,
  a.source_listing_url,
  a.vertical,
  a.title,
  a.description,
  a.price_amount,
  a.price_currency,
  a.location,
  a.raw_data,
  a.seller_type,
  a.status,
  os.final_score,
  os.grade,
  os.confidence,
  os.components,
  id.recommended_action,
  id.investment_profile,
  id.thesis_text,
  id.urgency_level,
  a.first_seen_at,
  a.last_seen_at,
  os.calculated_at AS scored_at,
  id.created_at AS decision_at
FROM assets a
LEFT JOIN sources s ON a.source_id = s.source_id
LEFT JOIN opportunity_scores os ON a.asset_id = os.asset_id
  AND os.score_id = (SELECT score_id FROM opportunity_scores WHERE asset_id = a.asset_id ORDER BY calculated_at DESC LIMIT 1)
LEFT JOIN investment_decisions id ON a.asset_id = id.asset_id
  AND id.decision_id = (SELECT decision_id FROM investment_decisions WHERE asset_id = a.asset_id ORDER BY created_at DESC LIMIT 1)
WHERE a.status = 'active';

-- Dashboard summary view
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  COUNT(*)::INTEGER AS total_active_assets,
  COUNT(*) FILTER (WHERE recommended_action = 'BUY_NOW')::INTEGER AS buy_now_count,
  COUNT(*) FILTER (WHERE recommended_action = 'WATCH_HIGH_PRIORITY')::INTEGER AS watch_count,
  COUNT(*) FILTER (WHERE recommended_action = 'NEGOTIATE')::INTEGER AS negotiate_count,
  COUNT(*) FILTER (WHERE recommended_action = 'AVOID')::INTEGER AS avoid_count,
  ROUND(AVG(final_score)::NUMERIC, 1) AS avg_score,
  ROUND(AVG(confidence)::NUMERIC, 1) AS avg_confidence,
  ROUND(AVG(price_amount)::NUMERIC, 0) AS avg_price,
  SUM(price_amount)::NUMERIC AS total_portfolio_value
FROM v_asset_pipeline;

-- ── Triggers ────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ─────────────────────────────────────────────────────
-- Note: RLS policies should be configured per-user after connecting to Supabase.
-- This enables RLS but with a default allow-all for the initial setup.
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Default policy: allow all authenticated operations (tighten in production)
CREATE POLICY IF NOT EXISTS "Allow all" ON sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON comparisons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON opportunity_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON investment_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON pipeline_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON dashboard_metrics FOR ALL USING (true) WITH CHECK (true);
