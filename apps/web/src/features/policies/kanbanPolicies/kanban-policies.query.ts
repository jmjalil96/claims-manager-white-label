import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { fetchKanbanPolicies } from './kanban-policies.api'
import { policiesKeys } from '../query-keys'
import type { KanbanPoliciesQueryParams } from './kanban-policies.types'

export function useKanbanPolicies(params: KanbanPoliciesQueryParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: policiesKeys.kanbanWithParams(params),
    queryFn: () => fetchKanbanPolicies(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}
