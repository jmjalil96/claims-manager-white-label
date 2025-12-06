import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchPolicies } from './list-policies.api'
import { policiesKeys } from '../query-keys'
import type { PoliciesQueryParams } from './list-policies.types'

export function usePolicies(params: PoliciesQueryParams) {
  return useQuery({
    queryKey: policiesKeys.list(params),
    queryFn: () => fetchPolicies(params),
    placeholderData: keepPreviousData,
  })
}
