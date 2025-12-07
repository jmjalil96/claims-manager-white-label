import { apiClient } from '@/lib/api-client'
import type { GetInsurerResponse, UpdateInsurerResponse } from '@claims/shared'

export interface UpdateInsurerRequestDto {
  name?: string
  code?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  taxRate?: number | null
  isActive?: boolean
}

export async function fetchInsurerDetail(id: string): Promise<GetInsurerResponse> {
  return apiClient<GetInsurerResponse>(`/insurers/${id}`)
}

export async function updateInsurer(
  id: string,
  data: UpdateInsurerRequestDto
): Promise<UpdateInsurerResponse> {
  return apiClient<UpdateInsurerResponse>(`/insurers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
