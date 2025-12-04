import { apiClient } from '@/lib/api-client'
import type { ListClaimsResponse, ClaimsSortBy, KanbanClaimsResponse } from '@claims/shared'

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

export async function fetchClaims(params: ClaimsQueryParams): Promise<ListClaimsResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<ListClaimsResponse>(`/claims${query ? `?${query}` : ''}`)
}

// Kanban view params (same filters as list, minus status and pagination)
export interface KanbanQueryParams {
  // Search
  search?: string

  // ID filters
  clientId?: string
  affiliateId?: string
  patientId?: string
  policyId?: string
  createdById?: string

  // Enum filters (no status - kanban shows all)
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

  // Items per column (default: 10, max: 50)
  limitPerColumn?: number
}

export async function fetchKanbanClaims(params: KanbanQueryParams): Promise<KanbanClaimsResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<KanbanClaimsResponse>(`/claims/kanban${query ? `?${query}` : ''}`)
}
