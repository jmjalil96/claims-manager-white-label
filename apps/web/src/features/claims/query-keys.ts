import type { ClaimsQueryParams } from './listClaims'
import type { KanbanQueryParams } from './kanbanClaims'

export const claimsKeys = {
  all: ['claims'] as const,
  lists: () => [...claimsKeys.all, 'list'] as const,
  list: (params: ClaimsQueryParams) => [...claimsKeys.lists(), params] as const,
  details: () => [...claimsKeys.all, 'detail'] as const,
  detail: (id: string) => [...claimsKeys.details(), id] as const,
  kanban: () => [...claimsKeys.all, 'kanban'] as const,
  kanbanWithParams: (params: KanbanQueryParams) => [...claimsKeys.kanban(), params] as const,
}
