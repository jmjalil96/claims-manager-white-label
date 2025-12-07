import { apiClient } from '@/lib/api-client'
import type { DeleteInsurerResponse } from '@claims/shared'

export async function deleteInsurer(id: string): Promise<DeleteInsurerResponse> {
  return apiClient<DeleteInsurerResponse>(`/insurers/${id}`, {
    method: 'DELETE',
  })
}
