-- =============================================================================
-- Migration 009: Add vehicle sources
-- Registra las fuentes orientadas a la vertical de vehículos en el sistema
-- =============================================================================

INSERT INTO sources (name, display_name, vertical, source_type, base_url, priority, quality_score, technical_difficulty, legal_status, rate_limits, tags) VALUES
  ('e24-autos',             'Encuentra24 Autos',    'vehicles', 'portal', 'https://www.encuentra24.com/panama-es/autos-y-botes-autos', 'critical', 0.85, 'medium', 'clear', '{"requests_per_minute": 30, "requests_per_hour": 500}', ARRAY['portal', 'vehicles']),
  ('banco-nacional-autos',  'Banco Nacional Autos', 'vehicles', 'portal', 'https://www.banconal.com.pa/index.php/bienes-y-remates#autos',  'medium',   0.90, 'easy',   'clear', '{"requests_per_minute": 20, "requests_per_hour": 300}', ARRAY['bank', 'foreclosure', 'vehicles']),
  ('caja-ahorros-autos',    'Caja de Ahorros Autos','vehicles', 'portal', 'https://www.cajadeahorros.com.pa/bienes-adjudicados#autos', 'medium',   0.85, 'medium', 'clear', '{"requests_per_minute": 20, "requests_per_hour": 300}', ARRAY['bank', 'foreclosure', 'vehicles'])
ON CONFLICT (name) DO NOTHING;
