import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchClaims } from './list-claims.api'
import { claimsKeys } from '../query-keys'
import type { ClaimsQueryParams } from './list-claims.types'

export function useClaims(params: ClaimsQueryParams) {
  return useQuery({
    queryKey: claimsKeys.list(params),
    queryFn: () => fetchClaims(params),
    placeholderData: keepPreviousData,
  })
}
