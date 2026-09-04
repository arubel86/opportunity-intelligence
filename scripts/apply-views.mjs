const INSFORGE_URL = 'https://insforge.aizprua.com';
const INSFORGE_API_KEY = 'ik_2bed7411a0830c9985681c4a5ccf2dadc81df1c78a3f30b8e8710d64ecb2d13f';

const sql = `
  ALTER TABLE assets ADD COLUMN IF NOT EXISTS owner_name TEXT;
  CREATE INDEX IF NOT EXISTS idx_assets_owner_name ON assets(owner_name);
  ALTER TABLE assets ADD COLUMN IF NOT EXISTS pipeline_run_id UUID REFERENCES pipeline_runs(run_id) ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS idx_assets_pipeline_run ON assets(pipeline_run_id);
  DROP VIEW IF EXISTS v_dashboard_summary CASCADE;
  DROP VIEW IF EXISTS v_asset_pipeline CASCADE;

  CREATE OR REPLACE VIEW v_asset_pipeline AS
  SELECT
    a.asset_id, a.source_id, s.display_name AS source_name, a.source_listing_url,
    a.vertical, a.title, a.description, a.price_amount, a.price_currency, a.location,
    a.raw_data, a.seller_type, a.status, a.owner_name,
    os.final_score, os.grade, os.confidence, os.components,
    id.recommended_action, id.investment_profile, id.thesis_text, id.urgency_level,
    a.first_seen_at, a.last_seen_at, os.calculated_at AS scored_at, id.created_at AS decision_at
  FROM assets a
  LEFT JOIN sources s ON a.source_id = s.source_id
  LEFT JOIN opportunity_scores os ON a.asset_id = os.asset_id
    AND os.score_id = (SELECT score_id FROM opportunity_scores WHERE asset_id = a.asset_id ORDER BY calculated_at DESC LIMIT 1)
  LEFT JOIN investment_decisions id ON a.asset_id = id.asset_id
    AND id.decision_id = (SELECT decision_id FROM investment_decisions WHERE asset_id = a.asset_id ORDER BY created_at DESC LIMIT 1)
  WHERE a.status = 'active';

  CREATE OR REPLACE VIEW v_dashboard_summary AS
  SELECT
    COUNT(*)::INTEGER AS total_active_assets,
    COUNT(*) FILTER (WHERE recommended_action = 'BUY_NOW')::INTEGER AS buy_now_count,
    COUNT(*) FILTER (WHERE recommended_action IN ('WATCH_HIGH_PRIORITY', 'WATCH'))::INTEGER AS watch_count,
    COUNT(*) FILTER (WHERE recommended_action = 'NEGOTIATE')::INTEGER AS negotiate_count,
    COUNT(*) FILTER (WHERE recommended_action = 'AVOID')::INTEGER AS avoid_count,
    ROUND(AVG(final_score)::NUMERIC, 1) AS avg_score,
    ROUND(AVG(confidence)::NUMERIC, 1) AS avg_confidence,
    ROUND(AVG(price_amount)::NUMERIC, 0) AS avg_price,
    SUM(price_amount)::NUMERIC AS total_portfolio_value
  FROM v_asset_pipeline;
`;

async function run() {
  const res = await fetch(`${INSFORGE_URL}/api/database/advance/rawsql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': INSFORGE_API_KEY },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  console.log('Views updated successfully:', data);
}

run().catch(console.error);
