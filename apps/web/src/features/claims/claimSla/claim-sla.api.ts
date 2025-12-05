import { apiClient } from '@/lib/api-client'
import type { GetClaimSlaResponse } from '@claims/shared'

export async function fetchClaimSla(claimId: string): Promise<GetClaimSlaResponse> {
  return apiClient<GetClaimSlaResponse>(`/claims/${claimId}/sla`)
}
