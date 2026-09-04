import { getDbClient } from '../lib/db.mjs'
import './config.mjs'

async function test() {
  console.log('Testing InsForge Database connection through getDbClient()...\n')
  const db = await getDbClient()
  if (!db) {
    throw new Error('Database client could not be initialized!')
  }

  // 1. Query sources
  const { data: sources, error: sErr } = await db
    .from('sources')
    .select('source_id, name, display_name, vertical, priority, is_active')
    .limit(5)

  if (sErr) throw sErr
  console.log(`✅ Successfully queried sources (${sources.length} sample records):`)
  for (const s of sources) {
    console.log(`   - [${s.vertical}] ${s.display_name} (${s.name}) | priority: ${s.priority}`)
  }

  // 2. Insert test asset
  const testSourceId = sources[0].source_id
  const testListingId = `test-${Date.now()}`
  const testAsset = {
    source_id: testSourceId,
    source_listing_id: testListingId,
    source_listing_url: 'https://insforge.aizprua.com/test-listing',
    vertical: 'real_estate',
    status: 'active',
    title: 'Propiedad de Prueba Conexión InsForge',
    description: 'Verificación de inserción y lectura desde Opportunity Intelligence',
    price_amount: 125000,
    price_currency: 'USD',
    location: { province: 'Panamá', district: 'Panamá', corregimiento: 'San Francisco' },
    content_hash: 'test-hash-12345',
  }

  console.log(`\nInserting test asset into 'assets' table...`)
  const { data: inserted, error: iErr } = await db
    .from('assets')
    .upsert(testAsset, { onConflict: 'source_id,source_listing_id' })
    .select('asset_id, title, price_amount, status')
    .maybeSingle()

  if (iErr) throw iErr
  console.log(`✅ Asset inserted successfully:`, inserted)

  // 3. Query view
  console.log(`\nQuerying view 'v_asset_pipeline'...`)
  const { data: viewData, error: vErr } = await db
    .from('v_asset_pipeline')
    .select('asset_id, title, source_name, price_amount, status')
    .eq('asset_id', inserted.asset_id)
    .maybeSingle()

  if (vErr) throw vErr
  console.log(`✅ View query succeeded:`, viewData)

  // 4. Clean up test asset
  console.log(`\nCleaning up test asset...`)
  const { error: dErr } = await db
    .from('assets')
    .delete()
    .eq('asset_id', inserted.asset_id)

  if (dErr) throw dErr
  console.log(`✅ Cleanup completed successfully!`)

  console.log(`\n🎉 ALL CHECKS PASSED: InsForge is 100% integrated and operational with Opportunity Intelligence!`)
}

test().catch(err => {
  console.error('❌ Connection test failed:', err)
  process.exit(1)
})
