import type { InsurersQueryParams } from './listInsurers'

export const insurersKeys = {
  all: ['insurers'] as const,
  lists: () => [...insurersKeys.all, 'list'] as const,
  list: (params: InsurersQueryParams) => [...insurersKeys.lists(), params] as const,
  details: () => [...insurersKeys.all, 'detail'] as const,
  detail: (id: string) => [...insurersKeys.details(), id] as const,
}
