-- =============================================================================
-- Hermes Migration 002: Add owner_name and pipeline_run_id columns
-- =============================================================================

-- Add owner_name to assets (used by dashboard and pipeline)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE assets ADD COLUMN owner_name TEXT;
    CREATE INDEX IF NOT EXISTS idx_assets_owner_name ON assets(owner_name);
  END IF;
END $$;

-- Add pipeline_run_id to assets (links assets to pipeline runs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'pipeline_run_id'
  ) THEN
    ALTER TABLE assets ADD COLUMN pipeline_run_id UUID REFERENCES pipeline_runs(run_id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_assets_pipeline_run ON assets(pipeline_run_id);
  END IF;
END $$;

-- Recreate the v_asset_pipeline view to include owner_name
CREATE OR REPLACE VIEW v_asset_pipeline AS
SELECT
  a.asset_id,
  a.source_id,
  s.display_name AS source_name,
  a.vertical,
  a.title,
  a.price_amount,
  a.price_currency,
  a.location,
  a.seller_type,
  a.status,
  a.owner_name,
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
