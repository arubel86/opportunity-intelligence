export interface Database {
  public: {
    Views: {
      v_asset_pipeline: {
        Row: {
          asset_id: string
          source_id: string
          source_name: string
          vertical: string
          title: string | null
          description: string | null
          price_amount: number | null
          price_currency: string
          location: {
            province?: string
            district?: string
            corregimiento?: string
            neighborhood?: string
            coordinates?: { lat: number; lng: number }
          } | null
          seller_type: string | null
          status: string
          final_score: number | null
          grade: string | null
          confidence: number | null
          components: Record<string, any> | null
          recommended_action: string | null
          investment_profile: string | null
          thesis_text: string | null
          urgency_level: number | null
          first_seen_at: string
          last_seen_at: string
          scored_at: string | null
          decision_at: string | null
          raw_data: Record<string, any> | null
          risk_factors: Record<string, any> | null
          capital_recommendation: Record<string, any> | null
          owner_name: string | null
        }
      }
      v_dashboard_summary: {
        Row: {
          total_active_assets: number
          buy_now_count: number
          watch_count: number
          negotiate_count: number
          avoid_count: number
          avg_score: number | null
          avg_confidence: number | null
          avg_price: number | null
          total_portfolio_value: number | null
        }
      }
    }
    Tables: {
      sources: {
        Row: {
          source_id: string
          name: string
          display_name: string
          vertical: string
          priority: string
          quality_score: number
          is_active: boolean
          base_url: string
        }
      }
      comparisons: {
        Row: {
          comparison_id: string
          asset_id: string
          comp_asset_id: string | null
          price: number | null
          distance_km: number | null
          age_days: number | null
          quality_score: number | null
          match_reason: string | null
        }
      }
      opportunity_scores: {
        Row: {
          score_id: string
          asset_id: string
          version: number
          components: Record<string, any> | null
          final_score: number
          grade: string
          confidence: number
          model_version: string
          calculated_at: string
        }
      }
      investment_decisions: {
        Row: {
          decision_id: string
          asset_id: string
          opportunity_score_id: string | null
          opportunity_score: number | null
          confidence_score: number | null
          investment_profile: string
          recommended_action: string
          thesis_text: string
          urgency_level: number
          capital_recommendation: Record<string, any> | null
          risk_factors: Record<string, any> | null
          created_at: string
        }
      }
      pipeline_runs: {
        Row: {
          run_id: string
          status: string
          assets_scraped: number | null
          assets_normalized: number | null
          assets_scored: number | null
          decisions_generated: number | null
          assets_inserted: number | null
          assets_updated: number | null
          errors_count: number | null
          started_at: string
          finished_at: string | null
          duration_ms: number | null
          error_log: Record<string, any> | null
        }
      }
      dashboard_metrics: {
        Row: {
          metric_id: string
          metric_key: string
          metric_value: Record<string, any>
          updated_at: string
        }
      }
    }
  }
}
