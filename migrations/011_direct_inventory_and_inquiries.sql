-- =============================================================================
-- Migration 011: Direct Inventory and Inquiries
-- Tablas para inventario propio (propiedades y autos en venta) y captura de prospectos
-- =============================================================================

-- 1. Registrar la fuente para inventario propio
INSERT INTO sources (name, display_name, vertical, source_type, base_url, priority, quality_score, technical_difficulty, legal_status, rate_limits, tags)
VALUES
  ('oi-direct-properties', 'OI Inmuebles Propios', 'real_estate', 'api', 'https://opportunity.aizprua.com/propiedades', 'critical', 1.00, 'trivial', 'clear', '{"requests_per_minute": 120}', ARRAY['direct', 'inventory', 'real_estate']),
  ('oi-direct-vehicles',   'OI Autos Propios',     'vehicles',    'api', 'https://opportunity.aizprua.com/autos',       'critical', 1.00, 'trivial', 'clear', '{"requests_per_minute": 120}', ARRAY['direct', 'inventory', 'vehicles'])
ON CONFLICT (name) DO NOTHING;

-- 2. Tabla de Inmuebles en Venta / Alquiler
CREATE TABLE IF NOT EXISTS properties (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  description       TEXT,
  property_type     TEXT NOT NULL DEFAULT 'apartment' CHECK (property_type IN ('apartment', 'house', 'commercial', 'land', 'penthouse', 'office')),
  transaction_type  TEXT NOT NULL DEFAULT 'sale' CHECK (transaction_type IN ('sale', 'rent')),
  price             NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  area_sqm          NUMERIC(10,2),
  bedrooms          INT DEFAULT 1,
  bathrooms         NUMERIC(3,1) DEFAULT 1,
  parking_spots     INT DEFAULT 1,
  district          TEXT NOT NULL,
  address           TEXT,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  images            JSONB DEFAULT '[]'::jsonb,
  tour_3d_url       TEXT,
  status            TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  opportunity_badge TEXT,
  featured          BOOLEAN NOT NULL DEFAULT false,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);

-- 3. Tabla de Vehículos en Venta
CREATE TABLE IF NOT EXISTS vehicles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  brand             TEXT NOT NULL,
  model             TEXT NOT NULL,
  year              INT NOT NULL,
  price             NUMERIC(12,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  mileage_km        INT DEFAULT 0,
  transmission      TEXT NOT NULL DEFAULT 'automatic' CHECK (transmission IN ('automatic', 'manual')),
  fuel_type         TEXT NOT NULL DEFAULT 'gasoline' CHECK (fuel_type IN ('gasoline', 'diesel', 'hybrid', 'electric')),
  body_type         TEXT NOT NULL DEFAULT 'suv' CHECK (body_type IN ('suv', 'sedan', 'pickup', 'coupe', 'hatchback', 'commercial')),
  color             TEXT,
  description       TEXT,
  images            JSONB DEFAULT '[]'::jsonb,
  tour_3d_url       TEXT,
  status            TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  opportunity_badge TEXT,
  featured          BOOLEAN NOT NULL DEFAULT false,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_slug ON vehicles(slug);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);

-- 4. Tabla de Prospectos / Consultas de Clientes (Inquiries)
CREATE TABLE IF NOT EXISTS inquiries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_type   TEXT NOT NULL CHECK (listing_type IN ('property', 'vehicle', 'general')),
  listing_id     UUID,
  listing_title  TEXT,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT,
  message        TEXT,
  status         TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'closed', 'discarded')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_listing ON inquiries(listing_type, listing_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);

-- 5. Políticas RLS (Row Level Security)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Lectura pública para propiedades y autos disponibles
CREATE POLICY "anon_select_properties" ON properties
  FOR SELECT USING (true);

CREATE POLICY "anon_select_vehicles" ON vehicles
  FOR SELECT USING (true);

-- Solo administradores o service_role pueden crear, editar o eliminar inventario
CREATE POLICY "service_all_properties" ON properties
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "service_all_vehicles" ON vehicles
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Cualquier visitante puede enviar un formulario de contacto / inquiry
CREATE POLICY "anon_insert_inquiries" ON inquiries
  FOR INSERT WITH CHECK (true);

-- Solo usuarios autenticados / administradores pueden leer y gestionar los prospectos
CREATE POLICY "service_all_inquiries" ON inquiries
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
