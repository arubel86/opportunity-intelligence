// Normalizer Unit Tests
import { AssetNormalizer } from './normalizer.js'

const normalizer = new AssetNormalizer()

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
  } catch (e) {
    console.error(`  ❌ ${name}: ${(e as Error).message}`)
    failed++
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg)
}

// ── cleanString tests ──────────────────────────────────────────────────────

test('cleanString preserves single spaces', () => {
  const result = (normalizer as any).cleanString('Casa en Venta')
  assert(result === 'Casa en Venta', `Expected "Casa en Venta", got "${result}"`)
})

test('cleanString collapses multiple spaces', () => {
  const result = (normalizer as any).cleanString('Casa   en   Venta')
  assert(result === 'Casa en Venta', `Expected "Casa en Venta", got "${result}"`)
})

test('cleanString handles tabs and newlines', () => {
  const result = (normalizer as any).cleanString('Casa\t\n en Venta')
  assert(result === 'Casa en Venta', `Expected "Casa en Venta", got "${result}"`)
})

test('cleanString trims leading/trailing whitespace', () => {
  const result = (normalizer as any).cleanString('  Casa en Venta  ')
  assert(result === 'Casa en Venta', `Expected "Casa en Venta", got "${result}"`)
})

test('cleanString truncates at 500 chars', () => {
  const long = 'x'.repeat(600)
  const result = (normalizer as any).cleanString(long)
  assert(result?.length === 500, `Expected 500 chars, got ${result?.length}`)
})

test('cleanString returns undefined for empty input', () => {
  const result = (normalizer as any).cleanString(undefined)
  assert(result === undefined, 'Expected undefined')
})

test('cleanString returns undefined for empty string', () => {
  const result = (normalizer as any).cleanString('')
  assert(result === undefined, 'Expected undefined')
})

// ── parsePrice tests ───────────────────────────────────────────────────────

test('parsePrice handles numeric input', () => {
  const result = (normalizer as any).parsePrice(250000)
  assert(result === 250000, `Expected 250000, got ${result}`)
})

test('parsePrice handles formatted string "$250,000"', () => {
  const result = (normalizer as any).parsePrice('$250,000')
  assert(result === 250000, `Expected 250000, got ${result}`)
})

test('parsePrice handles "250000 USD"', () => {
  const result = (normalizer as any).parsePrice('250000 USD')
  assert(result === 250000, `Expected 250000, got ${result}`)
})

test('parsePrice handles "B/.250,000.00"', () => {
  const result = (normalizer as any).parsePrice('B/.250,000.00')
  assert(result === 250000.00, `Expected 250000, got ${result}`)
})

// ── parseLocation tests ────────────────────────────────────────────────────

test('parseLocation handles comma-separated string', () => {
  const result = (normalizer as any).parseLocation({ location: 'Panamá, Bella Vista, El Cangrejo' })
  assert(result.province === 'Panamá', `Expected Panamá, got ${result.province}`)
  assert(result.district === 'Bella Vista', `Expected Bella Vista, got ${result.district}`)
  assert(result.corregimiento === 'El Cangrejo', `Expected El Cangrejo, got ${result.corregimiento}`)
})

test('parseLocation handles individual fields', () => {
  const result = (normalizer as any).parseLocation({
    provincia: 'Panamá',
    distrito: 'San Francisco',
    barrio: 'Bethania'
  })
  assert(result.province === 'Panamá', `Expected Panamá, got ${result.province}`)
  assert(result.district === 'San Francisco', `Expected San Francisco, got ${result.district}`)
  assert(result.neighborhood === 'Bethania', `Expected Bethania, got ${result.neighborhood}`)
})

// ── normalize (integration) ────────────────────────────────────────────────

test('normalize produces canonical Asset from raw data', () => {
  const raw = {
    title: '  Casa en   Venta  ',
    price: '$250,000',
    location: 'Panamá, Bella Vista',
    url: 'https://example.com/listing'
  }
  const asset = normalizer.normalize(raw, 'test-source-id', 'real_estate')
  assert(asset.source_id === 'test-source-id', 'source_id mismatch')
  assert(asset.title === 'Casa en Venta', `Expected "Casa en Venta", got "${asset.title}"`)
  assert(asset.price_amount === 250000, `Expected 250000, got ${asset.price_amount}`)
  assert(asset.location?.province === 'Panamá', `Expected Panamá, got ${asset.location?.province}`)
  assert(asset.location?.district === 'Bella Vista', `Expected Bella Vista, got ${asset.location?.district}`)
})

// ── Report ─────────────────────────────────────────────────────────────────

console.log(`\n📊 Normalizer Tests: ${passed} passed, ${failed} failed out of ${passed + failed}\n`)
process.exit(failed > 0 ? 1 : 0)
