-- Migration 005: Add WATCH action to investment_decisions + score_factors support
-- Part of Sprint 3.1 — Comparable Intelligence & Real Opportunity Detection

-- ── Add WATCH to the CHECK constraint ────────────────────────────────────
ALTER TABLE IF EXISTS investment_decisions
  DROP CONSTRAINT IF EXISTS investment_decisions_recommended_action_check;

ALTER TABLE IF EXISTS investment_decisions
  ADD CONSTRAINT investment_decisions_recommended_action_check
  CHECK (recommended_action IN (
    'BUY_NOW',
    'WATCH_HIGH_PRIORITY',
    'WATCH',
    'NEGOTIATE',
    'RESEARCH_MORE',
    'AVOID',
    'MANUAL_REVIEW_REQUIRED'
  ));

-- ── Ensure comparisons table has proper indexes ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_comparisons_comp_asset
  ON comparisons(comp_asset_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_asset_quality
  ON comparisons(asset_id, quality_score DESC);
