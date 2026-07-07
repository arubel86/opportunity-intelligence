-- =============================================================================
-- Hermes Migration 006: Add 'inactive' status to assets CHECK constraint
-- Bug fix: persistence-stage.mjs uses status='inactive' for soft-delete,
-- but the CHECK constraint in 001_initial_schema.sql only allows:
--   ('active','sold','removed','expired','duplicated','investigating')
-- This caused UPDATE statements to silently affect 0 rows (Supabase JS doesn't
-- surface CHECK violations on UPDATE — PostgREST returns empty data, no error).
-- Result: soft-delete was broken; assets removed from source stayed 'active'.
-- =============================================================================

ALTER TABLE IF EXISTS assets
  DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE IF EXISTS assets
  ADD CONSTRAINT assets_status_check
  CHECK (status IN (
    'active',
    'inactive',    -- ← new: used by pipeline soft-delete (removed from source)
    'sold',
    'removed',
    'expired',
    'duplicated',
    'investigating'
  ));