-- Migration 007: Update v_dashboard_summary view to include WATCH and RESEARCH_MORE actions
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  COUNT(*)::INTEGER AS total_active_assets,
  COUNT(*) FILTER (WHERE recommended_action = 'BUY_NOW')::INTEGER AS buy_now_count,
  COUNT(*) FILTER (WHERE recommended_action IN ('WATCH_HIGH_PRIORITY', 'WATCH', 'RESEARCH_MORE'))::INTEGER AS watch_count,
  COUNT(*) FILTER (WHERE recommended_action = 'NEGOTIATE')::INTEGER AS negotiate_count,
  COUNT(*) FILTER (WHERE recommended_action = 'AVOID')::INTEGER AS avoid_count,
  ROUND(AVG(final_score)::NUMERIC, 1) AS avg_score,
  ROUND(AVG(confidence)::NUMERIC, 1) AS avg_confidence,
  ROUND(AVG(price_amount)::NUMERIC, 0) AS avg_price,
  SUM(price_amount)::NUMERIC AS total_portfolio_value
FROM v_asset_pipeline;
