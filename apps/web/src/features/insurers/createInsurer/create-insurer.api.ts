import { apiClient } from '@/lib/api-client'
import type { CreateInsurerResponse } from '@claims/shared'
import type { CreateInsurerRequest } from './create-insurer.types'

export async function createInsurer(data: CreateInsurerRequest): Promise<CreateInsurerResponse> {
  return apiClient<CreateInsurerResponse>('/insurers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
