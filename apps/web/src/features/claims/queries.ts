import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchClaims, fetchKanbanClaims, type ClaimsQueryParams, type KanbanQueryParams } from './api'

export const claimsKeys = {
  all: ['claims'] as const,
  lists: () => [...claimsKeys.all, 'list'] as const,
  list: (params: ClaimsQueryParams) => [...claimsKeys.lists(), params] as const,
  details: () => [...claimsKeys.all, 'detail'] as const,
  detail: (id: string) => [...claimsKeys.details(), id] as const,
  kanban: () => [...claimsKeys.all, 'kanban'] as const,
  kanbanWithParams: (params: KanbanQueryParams) => [...claimsKeys.kanban(), params] as const,
}

export function useClaims(params: ClaimsQueryParams) {
  return useQuery({
    queryKey: claimsKeys.list(params),
    queryFn: () => fetchClaims(params),
    placeholderData: keepPreviousData,
  })
}

export function useKanbanClaims(params: KanbanQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: claimsKeys.kanbanWithParams(params),
    queryFn: () => fetchKanbanClaims(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}
