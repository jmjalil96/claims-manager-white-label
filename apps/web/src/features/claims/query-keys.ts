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
  files: (claimId: string) => [...claimsKeys.all, 'files', claimId] as const,
  audit: (claimId: string, page?: number) =>
    page !== undefined
      ? ([...claimsKeys.all, 'audit', claimId, page] as const)
      : ([...claimsKeys.all, 'audit', claimId] as const),
  sla: (claimId: string) => [...claimsKeys.all, 'sla', claimId] as const,
  invoices: (claimId: string) => [...claimsKeys.all, 'invoices', claimId] as const,
}

export const lookupKeys = {
  all: ['lookup'] as const,
  clients: () => [...lookupKeys.all, 'clients'] as const,
  affiliates: (clientId: string) => [...lookupKeys.all, 'affiliates', clientId] as const,
  patients: (affiliateId: string) => [...lookupKeys.all, 'patients', affiliateId] as const,
  policies: (claimId: string) => [...lookupKeys.all, 'policies', claimId] as const,
}
