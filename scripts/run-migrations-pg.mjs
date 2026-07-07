#!/usr/bin/env node
/**
 * Run SQL migrations directly via pg (node-postgres)
 * Usage: node scripts/run-migrations-pg.mjs
 */
import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function getClient(dbUrl) {
  const hostMatch = dbUrl.match(/@([^:]+):/)
  if (!hostMatch) {
    return new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  }
  const hostname = hostMatch[1]
  try {
    const addresses = await dns.promises.resolve4(hostname)
    if (addresses.length > 0) {
      const ipv4Url = dbUrl.replace(hostname, addresses[0])
      console.log(`Resolved ${hostname} -> ${addresses[0]} (IPv4 forced)`)
      return new pg.Client({ connectionString: ipv4Url, ssl: { rejectUnauthorized: false } })
    }
  } catch (e) {
    console.log(`DNS A-record lookup failed (${e.message}), trying original URL`)
  }
  return new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
}

async function main() {
  const envPath = resolve(__dirname, '..', '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  const envVars = {}
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match) envVars[match[1]] = match[2]
  }

  const dbUrl = envVars.SUPABASE_DATABASE_URL
  if (!dbUrl) {
    console.error('SUPABASE_DATABASE_URL not found in .env')
    process.exit(1)
  }

  const client = await getClient(dbUrl)
  await client.connect()
  console.log('Connected to Supabase PostgreSQL\n')

  const migrationsDir = resolve(__dirname, '..', 'migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`Found ${files.length} migration(s):`)
  let applied = 0
  let failed = 0

  for (const file of files) {
    const filePath = resolve(migrationsDir, file)
    const sql = readFileSync(filePath, 'utf-8')
    console.log(`\n▶ ${file} (${sql.length} chars)`)

    try {
      await client.query(sql)
      console.log(`  ✅ ${file} applied successfully`)
      applied++
    } catch (err) {
      console.error(`  ⚠️  ${file} error: ${err.message.slice(0, 200)}`)
      // Try statement by statement
      const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'))
      console.log(`  ↪ Trying ${statements.length} individual statements...`)
      let stmtOk = 0
      let stmtFail = 0
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim()
        if (!stmt || stmt.startsWith('--')) continue
        try {
          await client.query(stmt + ';')
          stmtOk++
        } catch (e) {
          console.log(`    ❌ stmt ${i+1}: ${e.message.slice(0, 120)}`)
          stmtFail++
        }
      }
      console.log(`  Results: ${stmtOk} OK, ${stmtFail} failed`)
      if (stmtFail === 0) applied++
      else failed++
    }
  }

  await client.end()
  console.log(`\n═══════════════════════════════════════════════`)
  console.log(`  Result: ${applied} applied, ${failed} partial failures`)
  console.log(`═══════════════════════════════════════════════`)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
