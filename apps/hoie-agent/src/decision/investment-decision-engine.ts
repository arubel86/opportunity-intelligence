// Investment Decision Engine v1.0
// Transforms Opportunity Score into actionable investment decisions

import type { OpportunityScore, InvestmentDecision } from '@hermes/types'

export class InvestmentDecisionEngine {
  
  generateDecision(score: OpportunityScore, asset: any): InvestmentDecision {
    const profile = this.classifyProfile(score, asset)
    const action = this.recommendAction(score, profile)
    const thesis = this.generateThesis(score, asset, profile)
    const urgency = this.calculateUrgency(score, asset)
    const capital = this.estimateCapital(score, asset, profile)

    return {
      asset_id: score.asset_id,
      opportunity_score: score.final_score,
      confidence_score: score.confidence,
      investment_profile: profile,
      recommended_action: action,
      thesis_text: thesis,
      urgency_level: urgency,
      capital_recommendation: capital
    }
  }

  // RULE-D-002: Investment Profile Classification
  private classifyProfile(score: OpportunityScore, asset: any): InvestmentDecision['investment_profile'] {
    const components = score.components

    // High Risk Opportunity (RULE-D-002)
    if ((components?.risk_assessment?.score || 0) < 0.5 && score.final_score > 70) {
      return 'high_risk_opportunity'
    }

    // Value Investment (RULE-D-002)
    if ((components?.price_vs_estimated_value?.score || 0) >= 0.7 && 
        (components?.risk_assessment?.score || 0) >= 0.5) {
      return 'value_investment'
    }

    // Appreciation Investment (RULE-D-002)
    if ((components?.market_trend?.score || 0) >= 0.8 &&
        (components?.location_quality?.score || 0) >= 0.7) {
      return 'appreciation'
    }

    // Cash Flow (Real Estate only)
    if (asset.vertical === 'real_estate' && 
        (components?.rental_potential?.score || 0) >= 0.7) {
      return 'cash_flow'
    }

    // Flip Opportunity (RULE-D-002)
    if ((components?.seller_motivation?.score || 0) >= 0.7 &&
        (components?.risk_assessment?.score || 0) >= 0.6) {
      return 'flip_opportunity'
    }

    // Long Term Hold (RULE-D-002)
    if ((components?.market_trend?.score || 0) >= 0.6 &&
        (components?.price_vs_estimated_value?.score || 0) >= 0.5) {
      return 'long_term_hold'
    }

    return 'speculative'
  }

  // RULE-D-001: Decision Matrix
  private recommendAction(score: OpportunityScore, profile: string): InvestmentDecision['recommended_action'] {
    const { final_score, confidence } = score

    // RULE-D-001 thresholds
    if (final_score >= 80 && confidence >= 75) {
      return 'BUY_NOW'
    }
    
    if (final_score >= 65 && confidence >= 70) {
      return 'WATCH_HIGH_PRIORITY'
    }
    
    if (final_score >= 50 && confidence >= 65) {
      return 'NEGOTIATE'
    }
    
    if (confidence < 65) {
      return 'MANUAL_REVIEW_REQUIRED'
    }
    
    return 'AVOID'
  }

  private generateThesis(score: OpportunityScore, asset: any, profile: string): string {
    const components = score.components
    const priceDiscount = components?.price_vs_estimated_value?.details?.discount_pct || 0
    
    let thesis = `## Investment Thesis\n\n`
    thesis += `This is a **${profile.replace('_', ' ')}** opportunity with `
    thesis += `a **${Math.round(priceDiscount)}% discount** from market value. \n\n`
    
    thesis += `### Key Drivers:\n`
    thesis += `- Price Score: ${Math.round((components?.price_vs_estimated_value?.score || 0) * 10)}/10\n`
    thesis += `- Location Score: ${Math.round((components?.location_quality?.score || 0) * 10)}/10\n`
    thesis += `- Market Trend: ${(components?.market_trend?.score || 0) >= 0.7 ? 'Positive' : 'Stable'}\n`
    thesis += `- Seller: ${asset.seller_type || 'unknown'} (motivation: ${(components?.seller_motivation?.details?.motivation_index || 5)}/10)\n\n`
    
    thesis += `### Recommendation:\n`
    thesis += `**${this.recommendAction(score, profile)}** - Based on current market analysis.\n`
    
    return thesis
  }

  private calculateUrgency(score: OpportunityScore, asset: any): number {
    // RULE: Based on score and seller urgency
    let urgency = 3 // Default

    if (score.final_score >= 85) urgency = 5
    else if (score.final_score >= 75) urgency = 4
    else if (score.final_score >= 65) urgency = 3
    else if (score.final_score >= 50) urgency = 2

    // Bank sellers are urgent
    if (asset.seller_type === 'bank') urgency = Math.min(5, urgency + 1)

    return urgency
  }

  private estimateCapital(score: OpportunityScore, asset: any, profile: string) {
    // Rough estimates based on profile
    const price = score.components?.price_vs_estimated_value?.details?.estimated_value || 
                  score.components?.price_vs_estimated_value?.details?.listed_price || 0

    return {
      min_capital: Math.round(price * 0.8), // 80% of estimated value
      expected_roi_year1: this.getExpectedROI(profile),
      horizon_months: this.getHorizon(profile),
      investor_profile: this.getInvestorProfile(profile)
    }
  }

  private getExpectedROI(profile: string): number {
    const rois: Record<string, number> = {
      value_investment: 20,
      cash_flow: 8,
      appreciation: 15,
      flip_opportunity: 25,
      long_term_hold: 10,
      high_risk_opportunity: 30
    }
    return rois[profile] || 10
  }

  private getHorizon(profile: string): number {
    const horizons: Record<string, number> = {
      value_investment: 18,
      cash_flow: 24,
      appreciation: 24,
      flip_opportunity: 12,
      long_term_hold: 48,
      high_risk_opportunity: 18
    }
    return horizons[profile] || 24
  }

  private getInvestorProfile(profile: string): string {
    const profiles: Record<string, string> = {
      value_investment: 'Conservative',
      cash_flow: 'Income-focused',
      appreciation: 'Growth',
      flip_opportunity: 'Active/Hands-on',
      long_term_hold: 'Passive/Retirement',
      high_risk_opportunity: 'Accredited only'
    }
    return profiles[profile] || 'Moderate'
  }
}