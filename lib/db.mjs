/**
 * Universal Database Client for Hermes Platform
 * Supports both InsForge (primary) and Supabase (fallback/legacy)
 */
import { createAdminClient } from '@insforge/sdk'

let cachedDb = null

export async function getDbClient() {
  if (cachedDb) return cachedDb

  const insforgeUrl =
    process.env.INSFORGE_URL ||
    process.env.API_BASE_URL ||
    'https://insforge.aizprua.com'
  const insforgeKey = process.env.INSFORGE_API_KEY || process.env.API_KEY

  if (insforgeKey) {
    const admin = createAdminClient({
      baseUrl: insforgeUrl,
      apiKey: insforgeKey,
    })
    cachedDb = admin.database
    return cachedDb
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import('@supabase/supabase-js')
    cachedDb = createClient(supabaseUrl, supabaseKey)
    return cachedDb
  }

  return null
}

export default getDbClient
