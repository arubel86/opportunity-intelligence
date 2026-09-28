import { readFileSync } from 'fs'
import { resolve } from 'path'
import pg from 'pg'

// Usage: node scripts/run-migration.mjs <migration_filename.sql>
// Falls back to 005_watch_action.sql for backward compatibility
const migrationFile = process.argv[2] || '005_watch_action.sql'
const SQL = readFileSync(resolve('migrations', migrationFile), 'utf-8')

async function main() {
  const dbUrl = process.env.SUPABASE_DATABASE_URL
  if (!dbUrl) {
    console.error('Error: SUPABASE_DATABASE_URL env var not set')
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: dbUrl })
  const client = await pool.connect()

  try {
    const statements = SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    console.log(`Applying ${migrationFile} (${statements.length} statements)...`)

    for (const stmt of statements) {
      try {
        await client.query(stmt + ';')
        console.log(`  OK: ${stmt.slice(0, 70)}`)
      } catch (e) {
        if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
          console.log(`  SKIP: ${stmt.slice(0, 50)}`)
        } else {
          console.log(`  ERR: ${e.message?.slice(0, 100)}`)
        }
      }
    }
    console.log('\nMigration done!')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})