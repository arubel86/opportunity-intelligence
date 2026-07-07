-- =============================================================================
-- Hermes Migration 003: Restrictive RLS Policies
-- Replaces "Allow all" policies with role-based access control:
--   - anon:         SELECT only (read-only for dashboard)
--   - authenticated: SELECT only (prepared for future escalation)
--   - service_role:  ALL (pipeline, migrations)
-- =============================================================================

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 1: Drop permissive "Allow all" policies
-- ═════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Allow all" ON sources;
DROP POLICY IF EXISTS "Allow all" ON assets;
DROP POLICY IF EXISTS "Allow all" ON comparisons;
DROP POLICY IF EXISTS "Allow all" ON opportunity_scores;
DROP POLICY IF EXISTS "Allow all" ON investment_decisions;
DROP POLICY IF EXISTS "Allow all" ON pipeline_runs;
DROP POLICY IF EXISTS "Allow all" ON dashboard_metrics;
DROP POLICY IF EXISTS "Allow all" ON asset_versions;
DROP POLICY IF EXISTS "Allow all" ON asset_events;

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 2: Create restrictive policies per table
-- ═════════════════════════════════════════════════════════════════════════════

-- ── sources ──────────────────────────────────────────────────────────────────

CREATE POLICY "anon_select_sources" ON sources
  FOR SELECT USING (true);

CREATE POLICY "service_all_sources" ON sources
  FOR ALL USING (auth.role() = 'service_role');

-- ── assets ───────────────────────────────────────────────────────────────────

CREATE POLICY "anon_select_assets" ON assets
  FOR SELECT USING (true);

CREATE POLICY "service_all_assets" ON assets
  FOR ALL USING (auth.role() = 'service_role');

-- ── comparisons ──────────────────────────────────────────────────────────────

CREATE POLICY "anon_select_comparisons" ON comparisons
  FOR SELECT USING (true);

CREATE POLICY "service_all_comparisons" ON comparisons
  FOR ALL USING (auth.role() = 'service_role');

-- ── opportunity_scores ───────────────────────────────────────────────────────

CREATE POLICY "anon_select_opportunity_scores" ON opportunity_scores
  FOR SELECT USING (true);

CREATE POLICY "service_all_opportunity_scores" ON opportunity_scores
  FOR ALL USING (auth.role() = 'service_role');

-- ── investment_decisions ─────────────────────────────────────────────────────

CREATE POLICY "anon_select_investment_decisions" ON investment_decisions
  FOR SELECT USING (true);

CREATE POLICY "service_all_investment_decisions" ON investment_decisions
  FOR ALL USING (auth.role() = 'service_role');

-- ── pipeline_runs ────────────────────────────────────────────────────────────

CREATE POLICY "anon_select_pipeline_runs" ON pipeline_runs
  FOR SELECT USING (true);

CREATE POLICY "service_all_pipeline_runs" ON pipeline_runs
  FOR ALL USING (auth.role() = 'service_role');

-- ── dashboard_metrics ────────────────────────────────────────────────────────

CREATE POLICY "anon_select_dashboard_metrics" ON dashboard_metrics
  FOR SELECT USING (true);

CREATE POLICY "service_all_dashboard_metrics" ON dashboard_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- ── asset_versions ───────────────────────────────────────────────────────────

CREATE POLICY "anon_select_asset_versions" ON asset_versions
  FOR SELECT USING (true);

CREATE POLICY "service_all_asset_versions" ON asset_versions
  FOR ALL USING (auth.role() = 'service_role');

-- ── asset_events ─────────────────────────────────────────────────────────────

CREATE POLICY "anon_select_asset_events" ON asset_events
  FOR SELECT USING (true);

CREATE POLICY "service_all_asset_events" ON asset_events
  FOR ALL USING (auth.role() = 'service_role');

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 3: Revoke direct table access from anon (belt-and-suspenders)
-- ═════════════════════════════════════════════════════════════════════════════
-- Note: Supabase auto-grants anon access. These REVOKE statements act as
-- a second layer of defense alongside RLS.
-- Only revoke INSERT/UPDATE/DELETE; SELECT must remain granted for RLS to work.

REVOKE INSERT ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE UPDATE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- ═════════════════════════════════════════════════════════════════════════════
-- Phase 4: Verification queries (run manually to confirm)
-- ═════════════════════════════════════════════════════════════════════════════
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('sources','assets','comparisons','opportunity_scores',
--                      'investment_decisions','pipeline_runs','dashboard_metrics',
--                      'asset_versions','asset_events')
-- ORDER BY tablename, policyname;
