import { useQuery } from '@tanstack/react-query'
import { policiesKeys } from '../query-keys'
import { fetchPolicyAudit, type PolicyAuditParams } from './policy-audit.api'

export function usePolicyAudit(policyId: string, params: PolicyAuditParams = {}) {
  const { page = 1, limit = 20 } = params

  return useQuery({
    queryKey: policiesKeys.audit(policyId, page),
    queryFn: () => fetchPolicyAudit(policyId, { page, limit }),
  })
}
