import { useQuery } from '@tanstack/react-query'
import { claimsKeys } from '../query-keys'
import { fetchClaimAudit, type ClaimAuditParams } from './claim-audit.api'

export function useClaimAudit(claimId: string, params: ClaimAuditParams = {}) {
  const { page = 1, limit = 20 } = params

  return useQuery({
    queryKey: claimsKeys.audit(claimId, page),
    queryFn: () => fetchClaimAudit(claimId, { page, limit }),
  })
}
