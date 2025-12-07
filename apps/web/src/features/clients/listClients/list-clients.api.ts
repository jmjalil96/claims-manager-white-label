import { apiClient } from '@/lib/api-client'
import type { ListClientsResponse } from '@claims/shared'
import type { ClientsQueryParams } from './list-clients.types'

export async function fetchClients(params: ClientsQueryParams): Promise<ListClientsResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<ListClientsResponse>(`/clients${query ? `?${query}` : ''}`)
}
