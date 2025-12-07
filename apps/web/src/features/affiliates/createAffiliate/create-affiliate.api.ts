import { apiClient } from '@/lib/api-client'
import type { CreateAffiliateResponse } from '@claims/shared'
import type { CreateAffiliateRequest } from './create-affiliate.types'

export async function createAffiliate(data: CreateAffiliateRequest): Promise<CreateAffiliateResponse> {
  return apiClient<CreateAffiliateResponse>('/affiliates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
