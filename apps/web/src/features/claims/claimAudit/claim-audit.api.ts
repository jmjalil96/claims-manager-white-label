import { apiClient } from '@/lib/api-client'
import type { GetClaimAuditResponse } from '@claims/shared'

export interface ClaimAuditParams {
  page?: number
  limit?: number
}

export async function fetchClaimAudit(
  claimId: string,
  params: ClaimAuditParams = {}
): Promise<GetClaimAuditResponse> {
  const searchParams = new URLSearchParams()

  if (params.page !== undefined) {
    searchParams.set('page', String(params.page))
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  return apiClient<GetClaimAuditResponse>(`/claims/${claimId}/audit${query ? `?${query}` : ''}`)
}
