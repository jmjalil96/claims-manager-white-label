import type { PoliciesSortBy } from '@claims/shared'

export type { PoliciesSortBy }

export interface PoliciesQueryParams {
  // Search
  search?: string

  // ID filters
  clientId?: string
  insurerId?: string

  // Enum filters (comma-separated for multi-select)
  status?: string
  type?: string

  // Boolean filter
  isActive?: boolean

  // Date filters
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  createdAtFrom?: string
  createdAtTo?: string

  // Pagination & sorting
  page?: number
  limit?: number
  sortBy?: (typeof PoliciesSortBy)[keyof typeof PoliciesSortBy]
  sortOrder?: 'asc' | 'desc'
}
