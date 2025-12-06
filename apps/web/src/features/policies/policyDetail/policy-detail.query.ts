import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPolicyDetail, updatePolicyField } from './policy-detail.api'
import { policiesKeys } from '../query-keys'
import type { UpdatePolicyRequestDto } from './policy-detail.api'

export function usePolicyDetail(id: string) {
  return useQuery({
    queryKey: policiesKeys.detail(id),
    queryFn: () => fetchPolicyDetail(id),
  })
}

export function useUpdatePolicyField(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdatePolicyRequestDto) => updatePolicyField(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: policiesKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: policiesKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: policiesKeys.kanban() })
    },
    onError: (error) => {
      console.error('Failed to update policy field:', error)
    },
  })
}
