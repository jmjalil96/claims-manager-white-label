import { apiClient } from '@/lib/api-client'
import type { GetPolicyResponse, UpdatePolicyResponse, PolicyStatus, PolicyType } from '@claims/shared'

export interface UpdatePolicyRequestDto {
  // Status transition
  status?: PolicyStatus

  // Required fields (only editable in PENDING)
  policyNumber?: string
  startDate?: string
  endDate?: string

  // Optional fields (always editable)
  type?: PolicyType | null
  ambCopay?: number | null
  hospCopay?: number | null
  maternity?: number | null
  tPremium?: number | null
  tplus1Premium?: number | null
  tplusfPremium?: number | null
  benefitsCost?: number | null

  // Transition-specific fields
  cancellationReason?: string
  expirationReason?: string
}

export async function fetchPolicyDetail(id: string): Promise<GetPolicyResponse> {
  return apiClient<GetPolicyResponse>(`/policies/${id}`)
}

export async function updatePolicyField(
  id: string,
  data: UpdatePolicyRequestDto
): Promise<UpdatePolicyResponse> {
  return apiClient<UpdatePolicyResponse>(`/policies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
