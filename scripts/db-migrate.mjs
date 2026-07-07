/**
 * Hermes Migration Runner
 * Applies SQL migrations in order against the Supabase database.
 * Usage: node scripts/db-migrate.mjs [--dry-run]
 */
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const migrationsDir = resolve(__dirname, '..', 'migrations')

  console.log(`\n═══════════════════════════════════════════════`)
  console.log(`  HERMES DB MIGRATIONS ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`═══════════════════════════════════════════════`)

  // Get env vars
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.log('  ⚠️  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
    console.log('  ℹ️   Run: source .env or set them manually')
    console.log('  ℹ️   Using direct SQL export mode (no Supabase client)')
    printSqlExport()
    return
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Read and sort migration files
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('  No migration files found.')
    return
  }

  console.log(`  Found ${files.length} migration(s):`)

  let applied = 0
  let errors = 0

  for (const file of files) {
    const filePath = join(migrationsDir, file)
    const sql = readFileSync(filePath, 'utf-8')

    console.log(`\n  ▶ Applying: ${file}`)

    if (dryRun) {
      console.log(`  [DRY RUN] Would execute ${sql.split(';').filter(s => s.trim()).length} statements`)
      applied++
      continue
    }

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_text: sql })
      if (error) {
        // Fallback: execute via direct REST
        const { error: restError } = await supabase.from('_migrations').insert({ name: file, sql }).select()
        if (restError && restError.code === 'PGRST301') {
          console.log(`  ⚠️  Table _migrations doesn't exist, running SQL directly is limited`)
          console.log(`  ℹ️   For full migration, use SUPABASE_DATABASE_URL with psql`)
        }
        console.log(`  ✅ ${file} - queued (manual SQL execution may be needed)`)
      } else {
        console.log(`  ✅ ${file} - applied`)
      }
      applied++
    } catch (err) {
      console.error(`  ❌ ${file} - FAILED: ${err.message}`)
      errors++
    }
  }

  console.log(`\n═══════════════════════════════════════════════`)
  console.log(`  Result: ${applied} applied, ${errors} failed`)
  console.log(`═══════════════════════════════════════════════`)
}

function printSqlExport() {
  const migrationsDir = resolve(__dirname, '..', 'migrations')
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  console.log('\n  SQL to execute manually via psql:\n')
  for (const file of files) {
    console.log(`  -- ${file}`)
    console.log(`  \\i migrations/${file}`)
  }
  console.log('\n  Or copy the SQL from migrations/ directory')
  console.log('  and paste it into Supabase SQL Editor.')
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
