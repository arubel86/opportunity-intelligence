import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const INSFORGE_URL = process.env.INSFORGE_URL || 'https://insforge.aizprua.com';
const INSFORGE_API_KEY =
  process.env.INSFORGE_API_KEY ||
  'ik_2bed7411a0830c9985681c4a5ccf2dadc81df1c78a3f30b8e8710d64ecb2d13f';

async function executeSql(sql) {
  const res = await fetch(`${INSFORGE_URL}/api/database/advance/rawsql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': INSFORGE_API_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok || data.error) {
      throw new Error(data.message || data.error || text);
    }
    return data;
  } catch (e) {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return text;
  }
}

function splitSqlStatements(sql) {
  // Simple regex/scanner to split by semicolon outside quotes
  const statements = [];
  let current = '';
  let inString = false;
  let inDollarQuote = false;
  let dollarTag = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';

    // Check dollar quote like $$ or $tag$
    if (!inString && char === '$') {
      const match = sql.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/);
      if (match) {
        const tag = match[0];
        if (inDollarQuote && dollarTag === tag) {
          inDollarQuote = false;
          dollarTag = '';
        } else if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
        }
        current += tag;
        i += tag.length - 1;
        continue;
      }
    }

    if (!inDollarQuote && char === "'" && sql[i - 1] !== '\\') {
      inString = !inString;
    }

    if (!inString && !inDollarQuote && char === ';') {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const last = current.trim();
  if (last && !last.startsWith('--')) {
    statements.push(last);
  }

  return statements;
}

async function main() {
  console.log(`🚀 Starting migration to InsForge (${INSFORGE_URL})...\n`);

  // Verify connection first
  try {
    const check = await executeSql('SELECT current_database(), current_user, version();');
    console.log(`✅ Connected to InsForge Database:`, check.rows[0]);
  } catch (err) {
    console.error(`❌ Failed to connect to InsForge:`, err.message);
    process.exit(1);
  }

  const migrationsDir = resolve(__dirname, '..', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`\nFound ${files.length} migration files:`);

  let applied = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = resolve(migrationsDir, file);
    let sql = readFileSync(filePath, 'utf-8');

    // Fix postgres compatibility for CREATE POLICY IF NOT EXISTS
    sql = sql.replace(/CREATE\s+POLICY\s+IF\s+NOT\s+EXISTS/gi, 'CREATE POLICY');

    console.log(`\n▶ Migrating: ${file} (${sql.length} bytes)`);

    try {
      await executeSql(sql);
      console.log(`  ✅ Applied whole file successfully`);
      applied++;
    } catch (err) {
      console.log(`  ⚠️  Bulk execution notice: ${err.message.slice(0, 100)}`);
      console.log(`  ↪ Retrying statement by statement...`);

      const statements = splitSqlStatements(sql);
      let okCount = 0;
      let failCount = 0;

      for (const stmt of statements) {
        if (!stmt) continue;
        try {
          await executeSql(stmt + ';');
          okCount++;
        } catch (sErr) {
          // If already exists (e.g. extension, table, index, policy), treat as non-fatal
          const msg = sErr.message.toLowerCase();
          if (
            msg.includes('already exists') ||
            msg.includes('duplicate') ||
            msg.includes('multiple primary keys')
          ) {
            okCount++;
          } else {
            console.log(`    ❌ ${sErr.message.slice(0, 100)} (in: ${stmt.slice(0, 40)}...)`);
            failCount++;
          }
        }
      }

      console.log(`  Finished: ${okCount} OK, ${failCount} errors`);
      if (failCount === 0) applied++;
      else skipped++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  Migration Complete: ${applied} applied/verified, ${skipped} with notices`);
  console.log(`═══════════════════════════════════════════════\n`);
}

main().catch(console.error);
