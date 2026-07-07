import useSWR from 'swr'
import { fetchAssets } from '../services/supabaseService'

export function useAssets(limit = 500) {
  const { data, error, isLoading, mutate } = useSWR(
    ['v_asset_pipeline', limit],
    () => fetchAssets(limit),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      refreshInterval: 60000,
    }
  )
  return { assets: data || [], error, isLoading, mutate }
}
