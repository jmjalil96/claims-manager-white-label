import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createPolicy, fetchAvailableInsurers, fetchAvailableClients } from './create-policy.api'
import { policiesKeys } from '../query-keys'
import type { CreatePolicyRequest } from './create-policy.types'

export function useAvailableInsurers() {
  return useQuery({
    queryKey: policiesKeys.insurers(),
    queryFn: fetchAvailableInsurers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAvailableClients() {
  return useQuery({
    queryKey: policiesKeys.clients(),
    queryFn: fetchAvailableClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreatePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePolicyRequest) => createPolicy(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: policiesKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: policiesKeys.kanban() })
    },
  })
}
