import type { AffiliatesQueryParams } from './listAffiliates'

export const affiliatesKeys = {
  all: ['affiliates'] as const,
  lists: () => [...affiliatesKeys.all, 'list'] as const,
  list: (params: AffiliatesQueryParams) => [...affiliatesKeys.lists(), params] as const,
  details: () => [...affiliatesKeys.all, 'detail'] as const,
  detail: (id: string) => [...affiliatesKeys.details(), id] as const,
}
