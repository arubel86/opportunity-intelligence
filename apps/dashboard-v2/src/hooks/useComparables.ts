import useSWR from 'swr'
import { fetchComparables } from '../services/supabaseService'

export function useComparables(assetId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    assetId ? ['comparisons', assetId] : null,
    () => fetchComparables(assetId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )
  return { comparables: data || [], error, isLoading, mutate }
}
