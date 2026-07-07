import { supabase } from './supabaseClient'
import type { Database } from '../types/database'

type AssetPipelineRow = Database['public']['Views']['v_asset_pipeline']['Row']
type DashboardSummary = Database['public']['Views']['v_dashboard_summary']['Row']

// ── Dashboard Summary (KPIs) ──────────────────────────────────────────────
export async function fetchSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase
    .from('v_dashboard_summary' as any)
    .select('*')
    .single()

  if (error) throw error
  return data as unknown as DashboardSummary
}

// ── Assets for Map + Table ─────────────────────────────────────────────────
export async function fetchAssets(limit = 500): Promise<AssetPipelineRow[]> {
  const { data, error } = await supabase
    .from('v_asset_pipeline' as any)
    .select('*')
    .order('final_score', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as unknown as AssetPipelineRow[]
}

// ── Comparables for Detail Panel ───────────────────────────────────────────
export async function fetchComparables(assetId: string) {
  const { data, error } = await supabase
    .from('comparisons')
    .select(`
      *,
      comp_asset:assets!comparisons_comp_asset_id_fkey (
        asset_id, title, price_amount, raw_data, source_listing_url
      )
    `)
    .eq('asset_id', assetId)
    .order('quality_score', { ascending: false })

  if (error) throw error
  return data || []
}

// ── Pipeline Runs for Admin ────────────────────────────────────────────────
export async function fetchPipelineRuns(limit = 50) {
  const { data, error } = await supabase
    .from('pipeline_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// ── Sources for Layer Toggles ──────────────────────────────────────────────
export async function fetchSources() {
  const { data, error } = await supabase
    .from('sources')
    .select('source_id, name, display_name, vertical, is_active')
    .eq('is_active', true)

  if (error) throw error
  return data || []
}
