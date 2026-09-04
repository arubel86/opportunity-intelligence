/**
 * Hermes Config — loads all configuration from environment variables.
 * NEVER hardcode secrets. All values come from process.env.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Auto-load .env if present
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, '')
    }
  }
}

function req(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function opt(name, fallback) {
  return process.env[name] || fallback
}

export const config = {
  // InsForge (Primary)
  insforge: {
    url: opt('INSFORGE_URL', opt('API_BASE_URL', 'https://insforge.aizprua.com')),
    apiKey: opt('INSFORGE_API_KEY', opt('API_KEY', '')),
  },

  // Supabase (Fallback / Legacy)
  supabase: {
    url: opt('SUPABASE_URL', opt('INSFORGE_URL', opt('API_BASE_URL', 'https://insforge.aizprua.com'))),
    anonKey: opt('SUPABASE_ANON_KEY', opt('INSFORGE_API_KEY', '')),
    serviceRoleKey: opt('SUPABASE_SERVICE_ROLE_KEY', opt('INSFORGE_API_KEY', '')),
    databaseUrl: opt('SUPABASE_DATABASE_URL'),
  },

  // Redis
  redis: {
    url: opt('REDIS_URL', 'redis://localhost:6379'),
  },

  // Scraper
  scraper: {
    timeoutMs: parseInt(opt('SCRAPER_TIMEOUT_MS', '30000')),
    maxRetries: parseInt(opt('SCRAPER_MAX_RETRIES', '3')),
    rateLimitRPM: parseInt(opt('SCRAPER_RATE_LIMIT_RPM', '30')),
    playwrightHeadless: opt('PLAYWRIGHT_HEADLESS', 'true') === 'true',
  },

  // Opportunity Engine
  engine: {
    model: opt('OPPORTUNITY_SCORER_MODEL', 'opportunity-scorer-v1.1'),
    weights: {
      priceValue: parseFloat(opt('SCORE_WEIGHT_PRICE_VALUE', '0.30')),
      comparables: parseFloat(opt('SCORE_WEIGHT_COMPARABLES', '0.25')),
      location: parseFloat(opt('SCORE_WEIGHT_LOCATION', '0.20')),
      liquidity: parseFloat(opt('SCORE_WEIGHT_LIQUIDITY', '0.10')),
      sellerMotivation: parseFloat(opt('SCORE_WEIGHT_SELLER_MOTIVATION', '0.10')),
      risk: parseFloat(opt('SCORE_WEIGHT_RISK', '0.05')),
    },
  },

  // Dashboard
  dashboard: {
    port: parseInt(opt('DASHBOARD_PORT', '3000')),
    host: opt('DASHBOARD_HOST', '0.0.0.0'),
  },

  // Logging
  log: {
    level: opt('LOG_LEVEL', 'info'),
    format: opt('LOG_FORMAT', 'json'),
  },

  // Environment
  nodeEnv: opt('NODE_ENV', 'development'),
}

export default config
