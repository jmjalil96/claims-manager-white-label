import { apiClient } from '@/lib/api-client'
import type { KanbanClaimsResponse } from '@claims/shared'
import type { KanbanQueryParams } from './kanban-claims.types'

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
