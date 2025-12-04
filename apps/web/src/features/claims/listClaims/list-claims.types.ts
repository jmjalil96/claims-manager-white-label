import type { ClaimsSortBy } from '@claims/shared'

export type { ClaimsSortBy }

export interface ClaimsQueryParams {
  // Search
  search?: string

  // ID filters
  clientId?: string
  affiliateId?: string
  patientId?: string
  policyId?: string
  createdById?: string

  // Enum filters (comma-separated for multi-select)
  status?: string
  careType?: string

  // Date filters
  incidentDateFrom?: string
  incidentDateTo?: string
  submittedDateFrom?: string
  submittedDateTo?: string
  settlementDateFrom?: string
  settlementDateTo?: string
  createdAtFrom?: string
  createdAtTo?: string

  // Pagination & sorting
  page?: number
  limit?: number
  sortBy?: ClaimsSortBy
  sortOrder?: 'asc' | 'desc'
}
