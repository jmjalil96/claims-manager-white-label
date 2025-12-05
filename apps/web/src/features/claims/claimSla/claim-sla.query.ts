import { useQuery } from '@tanstack/react-query'
import { claimsKeys } from '../query-keys'
import { fetchClaimSla } from './claim-sla.api'

export function useClaimSla(claimId: string) {
  return useQuery({
    queryKey: claimsKeys.sla(claimId),
    queryFn: () => fetchClaimSla(claimId),
  })
}
