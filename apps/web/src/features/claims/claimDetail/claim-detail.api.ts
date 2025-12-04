import { apiClient } from '@/lib/api-client'
import type { GetClaimResponse, UpdateClaimRequestDto, UpdateClaimResponse } from '@claims/shared'

export async function fetchClaimDetail(id: string): Promise<GetClaimResponse> {
  return apiClient<GetClaimResponse>(`/claims/${id}`)
}

export async function updateClaimField(
  id: string,
  data: UpdateClaimRequestDto
): Promise<UpdateClaimResponse> {
  return apiClient<UpdateClaimResponse>(`/claims/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
