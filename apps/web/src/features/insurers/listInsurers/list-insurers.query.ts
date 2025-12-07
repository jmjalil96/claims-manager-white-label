import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchInsurers } from './list-insurers.api'
import { insurersKeys } from '../query-keys'
import type { InsurersQueryParams } from './list-insurers.types'

export function useInsurers(params: InsurersQueryParams) {
  return useQuery({
    queryKey: insurersKeys.list(params),
    queryFn: () => fetchInsurers(params),
    placeholderData: keepPreviousData,
  })
}
