import { apiClient } from '@/lib/api-client'
import type { DeleteClientResponse } from '@claims/shared'

export async function deleteClient(id: string): Promise<DeleteClientResponse> {
  return apiClient<DeleteClientResponse>(`/clients/${id}`, {
    method: 'DELETE',
  })
}
