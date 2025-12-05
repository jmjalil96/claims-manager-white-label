import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClaimDetail, updateClaimField, fetchClaimPolicies } from './claim-detail.api'
import { claimsKeys, lookupKeys } from '../query-keys'
import type { UpdateClaimRequestDto } from '@claims/shared'

export function useClaimDetail(id: string) {
  return useQuery({
    queryKey: claimsKeys.detail(id),
    queryFn: () => fetchClaimDetail(id),
  })
}

export function useUpdateClaimField(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateClaimRequestDto) => updateClaimField(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimsKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: claimsKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: claimsKeys.kanban() })
    },
    onError: (error) => {
      console.error('Failed to update claim field:', error)
    },
  })
}

export function useClaimPolicies(claimId: string) {
  return useQuery({
    queryKey: lookupKeys.policies(claimId),
    queryFn: () => fetchClaimPolicies(claimId),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })
}
