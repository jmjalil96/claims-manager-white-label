import type { ClientsSortBy } from '@claims/shared'

export type { ClientsSortBy }

export interface ClientsQueryParams {
  // Search
  search?: string

  // Boolean filter
  isActive?: boolean

  // Pagination & sorting
  page?: number
  limit?: number
  sortBy?: (typeof ClientsSortBy)[keyof typeof ClientsSortBy]
  sortOrder?: 'asc' | 'desc'
}
