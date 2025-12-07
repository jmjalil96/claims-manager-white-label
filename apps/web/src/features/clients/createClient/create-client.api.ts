import { apiClient } from '@/lib/api-client'
import type { CreateClientResponse } from '@claims/shared'
import type { CreateClientRequest } from './create-client.types'

export async function createClient(data: CreateClientRequest): Promise<CreateClientResponse> {
  return apiClient<CreateClientResponse>('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
