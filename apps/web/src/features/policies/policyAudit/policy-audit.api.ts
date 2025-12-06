import { apiClient } from '@/lib/api-client'
import type { GetPolicyAuditResponse } from '@claims/shared'

export interface PolicyAuditParams {
  page?: number
  limit?: number
}

export async function fetchPolicyAudit(
  policyId: string,
  params: PolicyAuditParams = {}
): Promise<GetPolicyAuditResponse> {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  return apiClient<GetPolicyAuditResponse>(`/policies/${policyId}/audit${query ? `?${query}` : ''}`)
}
