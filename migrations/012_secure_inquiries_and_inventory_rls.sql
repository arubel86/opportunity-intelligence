-- =============================================================================
-- Migration 012: Blindaje de Políticas RLS para Prospectos e Inventario
-- Corrige la vulnerabilidad SEC-004: Evita que cualquier usuario registrado
-- con rol 'authenticated' pueda leer datos personales (PII) o alterar inventario.
-- =============================================================================

-- 1. Eliminar políticas excesivamente permisivas
DROP POLICY IF EXISTS "service_all_inquiries" ON inquiries;
DROP POLICY IF EXISTS "service_all_properties" ON properties;
DROP POLICY IF EXISTS "service_all_vehicles" ON vehicles;

-- 2. Asegurar que RLS esté activo en todas las tablas sensibles e inventario
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_assets ENABLE ROW LEVEL SECURITY;

-- 3. Tabla inquiries (Prospectos y Cotizaciones de Clientes):
-- El público solo puede insertar su solicitud (formulario de contacto).
-- Nadie sin rol de servicio o credencial administrativa verificada puede leer ni modificar.
DROP POLICY IF EXISTS "admin_and_service_manage_inquiries" ON inquiries;
CREATE POLICY "admin_and_service_manage_inquiries" ON inquiries
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR (
      auth.role() = 'authenticated' AND (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
        OR auth.jwt() ->> 'email' LIKE '%@aizprua.com'
      )
    )
  );

-- 4. Tablas properties y vehicles (Inventario Comercial):
-- La lectura pública se mantiene (anon_select_*).
-- Solo administradores autenticados con claim verificado o service_role pueden crear/editar/eliminar.
DROP POLICY IF EXISTS "admin_and_service_manage_properties" ON properties;
CREATE POLICY "admin_and_service_manage_properties" ON properties
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR (
      auth.role() = 'authenticated' AND (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
        OR auth.jwt() ->> 'email' LIKE '%@aizprua.com'
      )
    )
  );

DROP POLICY IF EXISTS "admin_and_service_manage_vehicles" ON vehicles;
CREATE POLICY "admin_and_service_manage_vehicles" ON vehicles
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR (
      auth.role() = 'authenticated' AND (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
        OR auth.jwt() ->> 'email' LIKE '%@aizprua.com'
      )
    )
  );

-- 5. Tabla catalog_assets (Inventario de catálogo):
-- Lectura pública para visitantes anónimos.
-- Escritura, edición y eliminación restringidas exclusivamente a service_role y administradores.
DROP POLICY IF EXISTS "anon_select_catalog_assets" ON catalog_assets;
CREATE POLICY "anon_select_catalog_assets" ON catalog_assets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_all_catalog_assets" ON catalog_assets;
CREATE POLICY "service_all_catalog_assets" ON catalog_assets
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR (
      auth.role() = 'authenticated' AND (
        coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false) = true
        OR coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
        OR auth.jwt() ->> 'email' LIKE '%@aizprua.com'
      )
    )
  );
