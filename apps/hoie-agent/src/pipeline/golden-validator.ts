// Golden Dataset Validation Suite
// Tests engine output against manually validated expectations

import { GOLDEN_ASSETS } from '@hermes/types'
import { OpportunityScorer } from '../scorer/opportunity-scorer.js'
import { InvestmentDecisionEngine } from '../decision/investment-decision-engine.js'
import { AssetNormalizer } from './normalizer.js'

interface ValidationReport {
  timestamp: string
  total: number
  passed: number
  failed: number
  accuracy: number
  assetResults: AssetValidationResult[]
}

interface AssetValidationResult {
  assetId: string
  title: string
  decision: string
  expectedDecision: string
  score: number
  expectedScoreRange: [number, number]
  grade: string
  expectedGrade: string
  confidence: number
  expectedConfidenceRange: [number, number]
  scorePass: boolean
  gradePass: boolean
  confidencePass: boolean
  decisionPass: boolean
  overallPass: boolean
  errors: string[]
}

export class GoldenDatasetValidator {
  private scorer: OpportunityScorer
  private decisionEngine: InvestmentDecisionEngine
  private normalizer: AssetNormalizer

  constructor() {
    this.scorer = new OpportunityScorer()
    this.decisionEngine = new InvestmentDecisionEngine()
    this.normalizer = new AssetNormalizer()
  }

  async validateAll(): Promise<ValidationReport> {
    const assetResults: AssetValidationResult[] = []
    let passed = 0
    let failed = 0

    for (const golden of GOLDEN_ASSETS) {
      const result = await this.validateSingle(golden)
      assetResults.push(result)
      
      if (result.overallPass) {
        passed++
      } else {
        failed++
      }
    }

    return {
      timestamp: new Date().toISOString(),
      total: assetResults.length,
      passed,
      failed,
      accuracy: Math.round((passed / assetResults.length) * 100),
      assetResults
    }
  }

  private async validateSingle(golden: any): Promise<AssetValidationResult> {
    const errors: string[] = []

    // Prepare asset
    const asset = {
      source_id: golden.id,
      vertical: golden.vertical,
      status: 'active' as const,
      price_currency: 'USD',
      title: golden.title,
      price_amount: golden.price,
      location: {
        district: golden.district,
        neighborhood: golden.neighborhood || ''
      },
      seller_type: golden.seller
    }

    // Generate mock comparables (simulating real pipeline)
    const mockComparables = this.generateComparables(golden)
    
    // Run engine
    const opportunityScore = await this.scorer.calculate(asset, mockComparables)
    const investmentDecision = this.decisionEngine.generateDecision(opportunityScore, asset)

    // Validate
    const score = opportunityScore.final_score
    const grade = opportunityScore.grade
    const confidence = opportunityScore.confidence
    const decision = investmentDecision.recommended_action

    const [scoreMin, scoreMax] = golden.score || golden.expected_score_range
    const scorePass = score >= scoreMin && score <= scoreMax
    if (!scorePass) errors.push(`Score ${score} ∉ [${scoreMin}, ${scoreMax}]`)

    const gradePass = grade === (golden.expected_grade || golden.grade)
    if (!gradePass) errors.push(`Grade ${grade} ≠ expected ${golden.expected_grade || golden.grade}`)

    const [confMin, confMax] = golden.conf || golden.expected_confidence_range
    const confidencePass = confidence >= confMin && confidence <= confMax
    if (!confidencePass) errors.push(`Confidence ${confidence} ∉ [${confMin}, ${confMax}]`)

    const decisionPass = decision === (golden.decision || golden.expected_decision)
    if (!decisionPass) errors.push(`Decision ${decision} ≠ expected ${golden.decision || golden.expected_decision}`)

    return {
      assetId: golden.id,
      title: golden.title,
      decision,
      expectedDecision: golden.decision || golden.expected_decision,
      score,
      expectedScoreRange: [scoreMin, scoreMax],
      grade,
      expectedGrade: golden.expected_grade || golden.grade,
      confidence,
      expectedConfidenceRange: [confMin, confMax],
      scorePass,
      gradePass,
      confidencePass,
      decisionPass,
      overallPass: errors.length === 0,
      errors
    }
  }

  private generateComparables(golden: any): any[] {
    const estimatedValue = golden.estimated || golden.expected_estimated_value
    const compCount = golden.comps || golden.expected_comparables_count
    
    const comparables = []
    for (let i = 0; i < Math.min(compCount, 8); i++) {
      const variance = 0.85 + Math.random() * 0.25 // 85%-110% of estimated
      comparables.push({
        price: Math.round(estimatedValue * variance),
        distance_km: 0.5 + Math.random() * 4.5,
        age_days: 15 + Math.floor(Math.random() * 60),
        quality_score: 70 + Math.floor(Math.random() * 25)
      })
    }
    return comparables
  }
}

// CLI Runner
async function main() {
  console.log('╔═══════════════════════════════════════════╗')
  console.log('║  🔬 Golden Dataset Validation Suite      ║')
  console.log('║  Hermes Opportunity Engine v1.1          ║')
  console.log('╚═══════════════════════════════════════════╝\n')

  const validator = new GoldenDatasetValidator()
  const report = await validator.validateAll()

  console.log('Results:')
  console.log(`  Total Assets: ${report.total}`)
  console.log(`  ✅ Passed: ${report.passed}`)
  console.log(`  ❌ Failed: ${report.failed}`)
  console.log(`  Accuracy: ${report.accuracy}%\n`)

  if (report.failed > 0) {
    console.log('Failed Assets:')
    for (const result of report.assetResults) {
      if (!result.overallPass) {
        console.log(`  ❌ ${result.assetId} - ${result.title.slice(0, 40)}`)
        for (const error of result.errors) {
          console.log(`     - ${error}`)
        }
      }
    }
  }

  console.log('\nScore Distribution:')
  const scores = report.assetResults.map(r => r.score)
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  console.log(`  Average: ${avgScore}`)
  console.log(`  Max: ${maxScore}`)
  console.log(`  Min: ${minScore}\n`)

  console.log('Grade Distribution:')
  const grades: Record<string, number> = {}
  for (const r of report.assetResults) {
    grades[r.grade] = (grades[r.grade] || 0) + 1
  }
  for (const [grade, count] of Object.entries(grades).sort()) {
    console.log(`  ${grade}: ${count}`)
  }

  console.log('\nPass Rate Per Check:')
  const scorePass = report.assetResults.filter(r => r.scorePass).length
  const gradePass = report.assetResults.filter(r => r.gradePass).length
  const confPass = report.assetResults.filter(r => r.confidencePass).length
  const decPass = report.assetResults.filter(r => r.decisionPass).length
  console.log(`  Score: ${scorePass}/${report.total} (${Math.round(scorePass/report.total*100)}%)`)
  console.log(`  Grade: ${gradePass}/${report.total} (${Math.round(gradePass/report.total*100)}%)`)
  console.log(`  Confidence: ${confPass}/${report.total} (${Math.round(confPass/report.total*100)}%)`)
  console.log(`  Decision: ${decPass}/${report.total} (${Math.round(decPass/report.total*100)}%)`)

  console.log(`\n${report.accuracy >= 80 ? '✅' : '❌'} Overall Result: ${report.accuracy}% accuracy`)
}

main().catch(console.error)