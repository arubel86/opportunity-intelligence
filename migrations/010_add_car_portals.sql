-- =============================================================================
-- Migration 010: Add car portals
-- Registra Clasificar.com, CarroCarros y SuperAutosPanama en el sistema
-- =============================================================================

INSERT INTO sources (name, display_name, vertical, source_type, base_url, priority, quality_score, technical_difficulty, legal_status, rate_limits, tags) VALUES
  ('clasificar-pa',     'Clasificar.com',       'vehicles', 'portal', 'https://www.clasificar.com/pa/',                  'medium', 0.80, 'medium', 'clear', '{"requests_per_minute": 20, "requests_per_hour": 300}', ARRAY['portal', 'vehicles']),
  ('carrocarros-pa',    'CarroCarros Panamá',   'vehicles', 'portal', 'https://panama.carrocarros.com/es',             'medium', 0.75, 'medium', 'clear', '{"requests_per_minute": 20, "requests_per_hour": 300}', ARRAY['portal', 'vehicles']),
  ('superautos-pa',     'SuperAutosPanama',     'vehicles', 'portal', 'https://superautospanama.com/',                 'medium', 0.80, 'medium', 'clear', '{"requests_per_minute": 20, "requests_per_hour": 300}', ARRAY['portal', 'vehicles'])
ON CONFLICT (name) DO NOTHING;
