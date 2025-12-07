import type { InsurersSortBy } from '@claims/shared'

export type { InsurersSortBy }

export interface InsurersQueryParams {
  // Search
  search?: string

  // Boolean filter
  isActive?: boolean

  // Pagination & sorting
  page?: number
  limit?: number
  sortBy?: (typeof InsurersSortBy)[keyof typeof InsurersSortBy]
  sortOrder?: 'asc' | 'desc'
}
