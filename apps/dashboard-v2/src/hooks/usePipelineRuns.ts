import useSWR from 'swr'
import { fetchPipelineRuns } from '../services/supabaseService'

export function usePipelineRuns(limit = 50) {
  const { data, error, isLoading, mutate } = useSWR(
    ['pipeline_runs', limit],
    () => fetchPipelineRuns(limit),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      refreshInterval: 30000,
    }
  )
  return { runs: data || [], error, isLoading, mutate }
}
