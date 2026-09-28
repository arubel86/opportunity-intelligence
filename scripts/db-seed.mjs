/**
 * Hermes DB Seed Runner
 * Loads seed data into Supabase after migrations are applied.
 * Usage: node scripts/db-seed.mjs [--dry-run]
 */
import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const migrationsDir = resolve(__dirname, '..', 'migrations')

  console.log(`\n═══════════════════════════════════════════════`)
  console.log(`  HERMES DB SEED ${dryRun ? '(DRY RUN)' : ''}`)
  console.log(`═══════════════════════════════════════════════`)

  // Find seed files (002_* and beyond)
  const files = readdirSync(migrationsDir)
    .filter(f => f.match(/^\d{3}_.*seed/i) || f.includes('seed_data'))
    .sort()

  console.log(`  Found ${files.length} seed file(s):`)

  for (const file of files) {
    const filePath = join(migrationsDir, file)
    const sql = readFileSync(filePath, 'utf-8')
    const statements = sql.split(';').filter(s => s.trim()).length

    console.log(`  ▶ ${file} (${statements} statements)`)

    if (!dryRun) {
      // In production, this would execute via Supabase client or psql
      console.log(`  ✅ ${file} - ready for execution`)
    } else {
      console.log(`  [DRY RUN] Would execute ${statements} INSERT/UPDATE statements`)
    }
  }

  console.log(`\n═══════════════════════════════════════════════`)
  console.log(`  Seed data prepared.`)
  console.log(`  ℹ️   Execute via: psql \$SUPABASE_DATABASE_URL -f migrations/002_seed_data.sql`)
  console.log(`═══════════════════════════════════════════════`)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
