import type { AffiliatesSortBy } from '@claims/shared'

export type { AffiliatesSortBy }

export interface AffiliatesQueryParams {
  // Search
  search?: string

  // Filters
  clientId?: string
  isActive?: boolean
  isOwner?: boolean

  // Pagination & sorting
  page?: number
  limit?: number
  sortBy?: (typeof AffiliatesSortBy)[keyof typeof AffiliatesSortBy]
  sortOrder?: 'asc' | 'desc'
}
