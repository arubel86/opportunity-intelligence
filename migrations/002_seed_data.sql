-- =============================================================================
-- Hermes Seed Data
-- Initial data for development: sources, dashboard defaults
-- =============================================================================

-- ── Sources ──────────────────────────────────────────────────────────────────
INSERT INTO sources (name, display_name, vertical, source_type, base_url, priority, quality_score, technical_difficulty, legal_status, rate_limits, tags) VALUES
  ('encuentra24',       'Encuentra24',          'real_estate', 'portal', 'https://www.encuentra24.com/panama-es/bienes-raices-venta-de-propiedades', 'critical', 0.85, 'medium', 'clear', '{"requests_per_minute": 30, "requests_per_hour": 500}', ARRAY['portal', 'listings']),
  ('banco-nacional',    'Banco Nacional',       'real_estate', 'portal', 'https://www.banconacional.com.pa/subastas',                'critical', 0.95, 'easy',   'clear',     '{"requests_per_minute": 30, "requests_per_hour": 500}', ARRAY['bank', 'foreclosure', 'auction']),
  ('caja-ahorros',      'Caja de Ahorros',      'real_estate', 'portal', 'https://www.cajadeahorros.com.pa/bienes-adjudicados',     'high',     0.85, 'medium', 'clear',     '{"requests_per_minute": 20, "requests_per_hour": 300}', ARRAY['bank', 'foreclosure']),
  ('bac-panama',        'BAC Credomatic',       'real_estate', 'portal', 'https://www.bac.net/panama/propiedades',                   'high',     0.80, 'hard',   'clear',     '{"requests_per_minute": 15, "requests_per_hour": 200}', ARRAY['bank', 'listings']),
  ('banistmo',          'Banistmo',             'real_estate', 'portal', 'https://www.banistmo.com/propiedades',                      'medium',   0.75, 'hard',   'clear',     '{"requests_per_minute": 15, "requests_per_hour": 200}', ARRAY['bank', 'listings']),
  ('banco-general',     'Banco General',        'real_estate', 'portal', 'https://www.bgeneral.com/propiedades',                      'medium',   0.75, 'hard',   'review_needed', '{"requests_per_minute": 15, "requests_per_hour": 200}', ARRAY['bank', 'listings'])
ON CONFLICT (name) DO NOTHING;

-- ── Dashboard Default Metrics ───────────────────────────────────────────────
INSERT INTO dashboard_metrics (metric_key, metric_value) VALUES
  ('system_status', '{"database": "disconnected", "redis": "disconnected", "last_pipeline_run": null, "scrapers_active": 0, "uptime_days": 0}'),
  ('pipeline_summary', '{"total_runs": 0, "successful_runs": 0, "failed_runs": 0, "total_assets_processed": 0, "avg_duration_ms": 0}'),
  ('market_overview', '{"total_assets": 0, "buy_now_count": 0, "watch_count": 0, "negotiate_count": 0, "avoid_count": 0, "avg_score": 0, "avg_confidence": 0}')
ON CONFLICT (metric_key) DO NOTHING;
