import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchKanbanClaims } from './kanban-claims.api'
import { claimsKeys } from '../query-keys'
import type { KanbanQueryParams } from './kanban-claims.types'

export function useKanbanClaims(params: KanbanQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: claimsKeys.kanbanWithParams(params),
    queryFn: () => fetchKanbanClaims(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}
