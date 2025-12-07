import { apiClient } from '@/lib/api-client'
import type { ListInsurersResponse } from '@claims/shared'
import type { InsurersQueryParams } from './list-insurers.types'

export async function fetchInsurers(params: InsurersQueryParams): Promise<ListInsurersResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<ListInsurersResponse>(`/insurers${query ? `?${query}` : ''}`)
}
