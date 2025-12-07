import { apiClient } from '@/lib/api-client'
import type { GetAffiliateResponse, UpdateAffiliateResponse } from '@claims/shared'

export interface UpdateAffiliateRequestDto {
  firstName?: string
  lastName?: string
  documentType?: string | null
  documentNumber?: string | null
  email?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'DOMESTIC_PARTNER' | null
  relationship?: 'SPOUSE' | 'CHILD' | 'PARENT' | 'DOMESTIC_PARTNER' | 'SIBLING' | 'OTHER' | null
  isActive?: boolean
}

export async function fetchAffiliateDetail(id: string): Promise<GetAffiliateResponse> {
  return apiClient<GetAffiliateResponse>(`/affiliates/${id}`)
}

export async function updateAffiliate(
  id: string,
  data: UpdateAffiliateRequestDto
): Promise<UpdateAffiliateResponse> {
  return apiClient<UpdateAffiliateResponse>(`/affiliates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
