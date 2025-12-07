import { apiClient } from '@/lib/api-client'
import type { GetClientResponse, UpdateClientResponse } from '@claims/shared'

export interface UpdateClientRequestDto {
  name?: string
  taxId?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  isActive?: boolean
}

export async function fetchClientDetail(id: string): Promise<GetClientResponse> {
  return apiClient<GetClientResponse>(`/clients/${id}`)
}

export async function updateClient(
  id: string,
  data: UpdateClientRequestDto
): Promise<UpdateClientResponse> {
  return apiClient<UpdateClientResponse>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
