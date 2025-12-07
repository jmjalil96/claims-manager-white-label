import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchClients } from './list-clients.api'
import { clientsKeys } from '../query-keys'
import type { ClientsQueryParams } from './list-clients.types'

export function useClients(params: ClientsQueryParams) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => fetchClients(params),
    placeholderData: keepPreviousData,
  })
}
