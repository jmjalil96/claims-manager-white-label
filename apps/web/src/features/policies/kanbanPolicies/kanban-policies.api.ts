import { apiClient } from '@/lib/api-client'
import type { KanbanPoliciesResponse } from '@claims/shared'
import type { KanbanPoliciesQueryParams } from './kanban-policies.types'

export async function fetchKanbanPolicies(params: KanbanPoliciesQueryParams): Promise<KanbanPoliciesResponse> {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return apiClient<KanbanPoliciesResponse>(`/policies/kanban${query ? `?${query}` : ''}`)
}
