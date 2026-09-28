-- =============================================================================
-- Migration 008: Add expansion sources
-- Registra Compreoalquile, Global Bank y Multibank en el sistema
-- =============================================================================

INSERT INTO sources (name, display_name, vertical, source_type, base_url, priority, quality_score, technical_difficulty, legal_status, rate_limits, tags) VALUES
  ('compreoalquile',    'Compreoalquile',       'real_estate', 'portal', 'https://www.compreoalquile.com/apartamentos-casas-venta.html', 'high',     0.85, 'hard',   'clear',     '{"requests_per_minute": 20, "requests_per_hour": 300}', ARRAY['portal', 'listings']),
  ('global-bank',       'Global Bank',          'real_estate', 'portal', 'https://www.globalbank.com.pa/es/bienes-reposeidos',     'medium',   0.80, 'medium', 'clear',     '{"requests_per_minute": 15, "requests_per_hour": 200}', ARRAY['bank', 'foreclosure']),
  ('multibank',         'Multibank',            'real_estate', 'portal', 'https://www.multibank.com.pa/es/bienes-reposeidos',       'medium',   0.80, 'medium', 'clear',     '{"requests_per_minute": 15, "requests_per_hour": 200}', ARRAY['bank', 'foreclosure'])
ON CONFLICT (name) DO NOTHING;
