import useSWR from 'swr'
import { fetchSummary } from '../services/supabaseService'

export function useSummary() {
  const { data, error, isLoading, mutate } = useSWR(
    'v_dashboard_summary',
    fetchSummary,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      refreshInterval: 30000,
    }
  )
  return { summary: data || null, error, isLoading, mutate }
}
