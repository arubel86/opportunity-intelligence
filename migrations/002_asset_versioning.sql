-- =============================================================================
-- Hermes Migration 002: Asset Versioning & Auditing
-- Adds: content_hash, removed_at, pipeline_run_id, UNIQUE constraint
-- Creates: asset_versions, asset_events tables
-- =============================================================================

-- ── Phase 1: Assets table enhancements ──────────────────────────────────────

-- Add pipeline_run_id column (FK, nullable for backward compatibility)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS pipeline_run_id UUID REFERENCES pipeline_runs(run_id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

-- Create content_hash index
CREATE INDEX IF NOT EXISTS idx_assets_content_hash ON assets(content_hash);

-- Replace partial unique index with full UNIQUE constraint for UPSERT support
DROP INDEX IF EXISTS idx_assets_source_listing;
ALTER TABLE assets ADD CONSTRAINT assets_source_listing_unique UNIQUE (source_id, source_listing_id);
-- Note: PostgreSQL UNIQUE constraints allow multiple NULL rows, so existing
-- rows with NULL source_listing_id are preserved.

-- ── Phase 2: Asset Versions (history of changes) ───────────────────────────

CREATE TABLE IF NOT EXISTS asset_versions (
  version_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id        UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  snapshot_json   JSONB NOT NULL,
  changed_fields  TEXT[] NOT NULL DEFAULT '{}',
  change_reason   TEXT,
  pipeline_run_id UUID REFERENCES pipeline_runs(run_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_versions_asset ON asset_versions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_versions_pipeline ON asset_versions(pipeline_run_id);

-- ── Phase 3: Asset Events (audit trail) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_events (
  event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id        UUID NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN (
                    'ASSET_CREATED', 'ASSET_UPDATED', 'ASSET_UNCHANGED',
                    'ASSET_REJECTED', 'ASSET_DEACTIVATED', 'ASSET_REACTIVATED',
                    'ASSET_REMOVED'
                  )),
  pipeline_run_id UUID REFERENCES pipeline_runs(run_id) ON DELETE SET NULL,
  reason          TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_events_asset ON asset_events(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_events_type ON asset_events(event_type);
CREATE INDEX IF NOT EXISTS idx_asset_events_pipeline ON asset_events(pipeline_run_id);

-- ── Phase 4: Add pipeline_run_id to existing pipeline tables ────────────────

ALTER TABLE opportunity_scores ADD COLUMN IF NOT EXISTS pipeline_run_id UUID REFERENCES pipeline_runs(run_id) ON DELETE SET NULL;
ALTER TABLE investment_decisions ADD COLUMN IF NOT EXISTS pipeline_run_id UUID REFERENCES pipeline_runs(run_id) ON DELETE SET NULL;

-- ── Phase 5: Add new metrics columns to pipeline_runs ───────────────────────

ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS assets_unchanged  INTEGER DEFAULT 0;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS assets_deactivated INTEGER DEFAULT 0;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS avg_time_per_asset_ms NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS pipeline_version TEXT;

-- ── Phase 6: RLS policies for new tables ───────────────────────────────────

ALTER TABLE asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all" ON asset_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all" ON asset_events FOR ALL USING (true) WITH CHECK (true);
