import { apiClient } from '@/lib/api-client'
import type { ListClaimsResponse } from '@claims/shared'
import type { ClaimsQueryParams } from './list-claims.types'

export async function fetchClaims(params: ClaimsQueryParams): Promise<ListClaimsResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<ListClaimsResponse>(`/claims${query ? `?${query}` : ''}`)
}
