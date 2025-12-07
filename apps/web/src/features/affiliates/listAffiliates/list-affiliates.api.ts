import { apiClient } from '@/lib/api-client'
import type { ListAffiliatesResponse, ListAffiliatesFamiliesResponse } from '@claims/shared'
import type { AffiliatesQueryParams } from './list-affiliates.types'

export async function fetchAffiliates(params: AffiliatesQueryParams): Promise<ListAffiliatesResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<ListAffiliatesResponse>(`/affiliates${query ? `?${query}` : ''}`)
}

export async function fetchAffiliateFamilies(params: AffiliatesQueryParams): Promise<ListAffiliatesFamiliesResponse> {
  const searchParams = new URLSearchParams()
  searchParams.set('groupBy', 'family')

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<ListAffiliatesFamiliesResponse>(`/affiliates?${query}`)
}
