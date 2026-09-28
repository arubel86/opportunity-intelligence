// Hermes Metrics Dashboard Configuration
// Defines key metrics for monitoring system performance
// All queries reference tables from migration 001_initial_schema

export const METRICS = {
  // Intelligence Metrics
  intelligence: [
    {
      name: 'Opportunity Accuracy',
      description: 'Percentage of high-score opportunities that validate as real opportunities',
      query: "SELECT COUNT(*) FROM opportunity_scores WHERE final_score >= 80 AND grade IN ('A+', 'A', 'A-')",
      target: 0.70
    },
    {
      name: 'False Positives',
      description: 'Opportunities that were not actually opportunities',
      query: "SELECT COUNT(*) FROM opportunity_scores WHERE grade IN ('D', 'F') AND recommended_action = 'BUY_NOW'",
      target: '< 0.30'
    },
    {
      name: 'Precision',
      description: 'True opportunities / Total opportunities detected',
      query: "SELECT AVG(CASE WHEN grade IN ('A+', 'A', 'A-', 'B+', 'B') THEN 1 ELSE 0 END) FROM opportunity_scores",
      target: '> 0.80'
    },
    {
      name: 'Recall',
      description: 'Opportunities detected / Total real opportunities in market',
      query: 'SELECT COUNT(*) FROM opportunity_scores WHERE final_score >= 65',
      target: '> 0.60'
    }
  ],

  // Market Metrics
  market: [
    {
      name: 'Market Coverage',
      description: 'Number of active sources being monitored',
      query: "SELECT COUNT(*) FROM sources WHERE is_active = true",
      target: '> 3'
    },
    {
      name: 'Listings Processed',
      description: 'Total listings processed today',
      query: "SELECT COUNT(*) FROM assets WHERE created_at >= NOW() - INTERVAL '1 day'",
      target: '> 1000'
    },
    {
      name: 'Assets Analyzed',
      description: 'Assets with complete opportunity scores',
      query: "SELECT COUNT(*) FROM assets WHERE status = 'active'",
      target: '> 100'
    },
    {
      name: 'Opportunities Detected',
      description: 'Assets with score >= 65',
      query: 'SELECT COUNT(*) FROM opportunity_scores WHERE final_score >= 65',
      target: '> 5'
    }
  ],

  // Valuation Metrics
  valuation: [
    {
      name: 'Average Valuation Error',
      description: 'Difference between estimated and sold price (when available)',
      query: "SELECT AVG(ABS(estimated_value - price_amount) / NULLIF(estimated_value, 0) * 100) FROM comparisons WHERE estimated_value IS NOT NULL",
      target: '< 15%'
    },
    {
      name: 'Comparable Accuracy',
      description: 'Percentage of relevant comparable matches',
      query: 'SELECT AVG(CASE WHEN similarity_score > 0.7 THEN 1 ELSE 0 END) FROM comparisons',
      target: '> 0.85'
    },
    {
      name: 'Confidence Distribution',
      description: 'Distribution of confidence scores',
      query: "SELECT CASE WHEN confidence >= 80 THEN '80-100' WHEN confidence >= 60 THEN '60-79' WHEN confidence >= 40 THEN '40-59' ELSE '0-39' END AS confidence_bucket, COUNT(*) FROM opportunity_scores GROUP BY 1",
      target: '> 60% with confidence > 70'
    }
  ],

  // Scraping Metrics
  scraping: [
    {
      name: 'Source Health',
      description: 'Percentage of sources with healthy status',
      query: "SELECT COUNT(*) FILTER (WHERE is_active = true)::float / NULLIF(COUNT(*), 0) FROM sources",
      target: '> 0.90'
    },
    {
      name: 'Success Rate',
      description: 'Successful scraping attempts',
      query: "SELECT AVG(CASE WHEN status = 'success' THEN 1 ELSE 0 END) FROM pipeline_runs",
      target: '> 0.95'
    },
    {
      name: 'Avg Pipeline Time',
      description: 'Average time to run the pipeline',
      query: "SELECT AVG(duration_ms)/1000.0 FROM pipeline_runs WHERE duration_ms IS NOT NULL",
      target: '< 300 seconds'
    }
  ],

  // Business Metrics
  business: [
    {
      name: 'Average Opportunity Score',
      description: 'Mean opportunity score for detected opportunities',
      query: 'SELECT AVG(final_score) FROM opportunity_scores WHERE final_score >= 65',
      target: '> 75'
    },
    {
      name: 'Recommendation Accuracy',
      description: 'Percentage of recommendations validated',
      query: "SELECT AVG(CASE WHEN recommended_action IN ('BUY_NOW', 'WATCH_HIGH_PRIORITY') THEN 1 ELSE 0 END) FROM investment_decisions",
      target: '> 0.80'
    }
  ]
}

// Export for dashboard consumption
export type MetricCategory = 'intelligence' | 'market' | 'valuation' | 'scraping' | 'business'
export type Metric = typeof METRICS[keyof typeof METRICS][number]
