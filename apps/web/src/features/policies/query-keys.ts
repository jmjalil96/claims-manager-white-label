import type { PoliciesQueryParams } from './listPolicies'
import type { KanbanPoliciesQueryParams } from './kanbanPolicies'

export const policiesKeys = {
  all: ['policies'] as const,
  lists: () => [...policiesKeys.all, 'list'] as const,
  list: (params: PoliciesQueryParams) => [...policiesKeys.lists(), params] as const,
  details: () => [...policiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...policiesKeys.details(), id] as const,
  kanban: () => [...policiesKeys.all, 'kanban'] as const,
  kanbanWithParams: (params: KanbanPoliciesQueryParams) => [...policiesKeys.kanban(), params] as const,
  insurers: () => [...policiesKeys.all, 'insurers'] as const,
  clients: () => [...policiesKeys.all, 'clients'] as const,
  files: (policyId: string) => [...policiesKeys.detail(policyId), 'files'] as const,
  audit: (policyId: string, page?: number) =>
    page !== undefined
      ? ([...policiesKeys.all, 'audit', policyId, page] as const)
      : ([...policiesKeys.all, 'audit', policyId] as const),
}
