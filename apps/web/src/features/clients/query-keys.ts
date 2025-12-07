import type { ClientsQueryParams } from './listClients'

export const clientsKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsKeys.all, 'list'] as const,
  list: (params: ClientsQueryParams) => [...clientsKeys.lists(), params] as const,
  details: () => [...clientsKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientsKeys.details(), id] as const,
}
