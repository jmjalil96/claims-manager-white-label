import { apiClient } from '@/lib/api-client'
import type { DeleteAffiliateResponse } from '@claims/shared'

export async function deleteAffiliate(id: string): Promise<DeleteAffiliateResponse> {
  return apiClient<DeleteAffiliateResponse>(`/affiliates/${id}`, {
    method: 'DELETE',
  })
}
