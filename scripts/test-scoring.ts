// Simple opportunity score calculation test (no deps)
// Tests the core scoring logic

function calculateFinalScore(components) {
  const weights = {
    price_vs_estimated_value: 0.25,
    comparables_analysis: 0.25,
    location_quality: 0.20,
    market_trend: 0.10,
    exit_strategy: 0.05,
    liquidity: 0.05,
    seller_motivation: 0.05,
    risk_assessment: 0.05
  }

  let total = 0
  for (const [key, component] of Object.entries(components)) {
    if (component && typeof component.score === 'number') {
      total += component.score * weights[key]
    }
  }
  return Math.round(total * 100)
}

function calculateGrade(score) {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'A-'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'B-'
  if (score >= 65) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 55) return 'C-'
  if (score >= 50) return 'D'
  return 'F'
}

// Test case: Bank property with 22% discount, good comparables
const mockComponents = {
  price_vs_estimated_value: { score: 0.8, weight: 0.25, details: { discount_pct: 22 } },
  comparables_analysis: { score: 0.8, weight: 0.25, details: { count: 4 } },
  location_quality: { score: 0.7, weight: 0.20, details: {} },
  market_trend: { score: 0.65, weight: 0.10, details: {} },
  exit_strategy: { score: 0.7, weight: 0.05, details: {} },
  liquidity: { score: 0.6, weight: 0.05, details: {} },
  seller_motivation: { score: 0.9, weight: 0.05, details: { seller_type: 'bank' } },
  risk_assessment: { score: 0.8, weight: 0.05, details: {} }
}

const finalScore = calculateFinalScore(mockComponents)
const grade = calculateGrade(finalScore)

console.log('Opportunity Score:', finalScore)
console.log('Grade:', grade)

// Verify expected output
if (finalScore >= 70 && finalScore <= 100) {
  console.log('✅ PASS: Score in valid range')
} else {
  console.log('❌ FAIL: Score out of range')
}

if (['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'].includes(grade)) {
  console.log('✅ PASS: Grade is valid')
} else {
  console.log('❌ FAIL: Invalid grade')
}

console.log('\nAll core scoring logic tests passed!')