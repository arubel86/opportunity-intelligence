-- =============================================================================
-- Hermes Migration 004: Performance Indexes
-- Adds composite indexes identified in DATABASE_REVIEW.md as critical
-- for scaling to 100K+ assets.
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 1: Composite indexes for view v_asset_pipeline optimization
-- ═════════════════════════════════════════════════════════════════════════════

-- Index for subquery: SELECT score_id FROM opportunity_scores
--                    WHERE asset_id = a.asset_id ORDER BY calculated_at DESC LIMIT 1
-- Used by: v_asset_pipeline, dashboard queries
CREATE INDEX IF NOT EXISTS idx_scores_asset_calculated
  ON opportunity_scores(asset_id, calculated_at DESC);

-- Index for subquery: SELECT decision_id FROM investment_decisions
--                    WHERE asset_id = a.asset_id ORDER BY created_at DESC LIMIT 1
-- Used by: v_asset_pipeline, dashboard queries
CREATE INDEX IF NOT EXISTS idx_decisions_asset_created
  ON investment_decisions(asset_id, created_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 2: Pipeline run monitoring indexes
-- ═════════════════════════════════════════════════════════════════════════════

-- Index for dashboard queries: "SELECT * FROM pipeline_runs ORDER BY started_at DESC"
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started
  ON pipeline_runs(started_at DESC);

-- Index for filtering by status (active pipelines)
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status
  ON pipeline_runs(status);

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 3: Audit/event query indexes
-- ═════════════════════════════════════════════════════════════════════════════

-- Index for temporal queries on asset_events
CREATE INDEX IF NOT EXISTS idx_asset_events_created
  ON asset_events(created_at DESC);

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 4: Seller type filter index (used in scoring)
-- ═════════════════════════════════════════════════════════════════════════════

-- Used by scorer to filter/influence seller motivation scoring
CREATE INDEX IF NOT EXISTS idx_assets_seller_type
  ON assets(seller_type);

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 5: Dashboard metrics upsert index
-- ═════════════════════════════════════════════════════════════════════════════

-- The table already has UNIQUE on metric_key, but this helps with ordered scans
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_key
  ON dashboard_metrics(metric_key);

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 6: Source + vertical filter index
-- ═════════════════════════════════════════════════════════════════════════════

-- Used when filtering assets by source and active status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_assets_source_active
  ON assets(source_id, status)
  WHERE status = 'active';
