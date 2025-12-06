import { apiClient } from '@/lib/api-client'
import type { ListPoliciesResponse } from '@claims/shared'
import type { PoliciesQueryParams } from './list-policies.types'

export async function fetchPolicies(params: PoliciesQueryParams): Promise<ListPoliciesResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<ListPoliciesResponse>(`/policies${query ? `?${query}` : ''}`)
}
