import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchAffiliates, fetchAffiliateFamilies } from './list-affiliates.api'
import { affiliatesKeys } from '../query-keys'
import type { AffiliatesQueryParams } from './list-affiliates.types'

export function useAffiliates(params: AffiliatesQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: affiliatesKeys.list(params),
    queryFn: () => fetchAffiliates(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}

export function useAffiliateFamilies(params: AffiliatesQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...affiliatesKeys.list(params), 'families'],
    queryFn: () => fetchAffiliateFamilies(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}
