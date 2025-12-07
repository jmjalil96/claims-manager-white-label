import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAffiliateDetail, updateAffiliate } from './affiliate-detail.api'
import { affiliatesKeys } from '../query-keys'
import type { UpdateAffiliateRequestDto } from './affiliate-detail.api'

export function useAffiliateDetail(id: string) {
  return useQuery({
    queryKey: affiliatesKeys.detail(id),
    queryFn: () => fetchAffiliateDetail(id),
  })
}

export function useUpdateAffiliate(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAffiliateRequestDto) => updateAffiliate(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliatesKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: affiliatesKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to update affiliate:', error)
    },
  })
}
