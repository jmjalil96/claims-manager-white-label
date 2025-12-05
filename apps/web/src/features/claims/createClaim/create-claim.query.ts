import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { claimsKeys, lookupKeys } from '../query-keys'
import {
  fetchClients,
  fetchAffiliates,
  fetchPatients,
  createClaim,
  type CreateClaimRequest,
} from './create-claim.api'

export function useClients() {
  return useQuery({
    queryKey: lookupKeys.clients(),
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAffiliates(clientId: string | null) {
  return useQuery({
    queryKey: clientId ? lookupKeys.affiliates(clientId) : [...lookupKeys.all, 'affiliates', '__disabled'],
    queryFn: () => fetchAffiliates(clientId!),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePatients(affiliateId: string | null) {
  return useQuery({
    queryKey: affiliateId ? lookupKeys.patients(affiliateId) : [...lookupKeys.all, 'patients', '__disabled'],
    queryFn: () => fetchPatients(affiliateId!),
    enabled: !!affiliateId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateClaim() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: CreateClaimRequest) => createClaim(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: claimsKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: claimsKeys.kanban() })
      void navigate({ to: '/claims/$claimId', params: { claimId: response.claim.id } })
    },
    onError: (error) => {
      console.error('Failed to create claim:', error)
    },
  })
}
