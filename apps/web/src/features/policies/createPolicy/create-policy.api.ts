import { apiClient } from '@/lib/api-client'
import type {
  CreatePolicyResponse,
  GetAvailableInsurersResponse,
  GetAvailableClientsResponse,
} from '@claims/shared'
import type { CreatePolicyRequest } from './create-policy.types'

export async function createPolicy(data: CreatePolicyRequest): Promise<CreatePolicyResponse> {
  return apiClient<CreatePolicyResponse>('/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchAvailableInsurers(): Promise<GetAvailableInsurersResponse> {
  return apiClient<GetAvailableInsurersResponse>('/policies/insurers')
}

export async function fetchAvailableClients(): Promise<GetAvailableClientsResponse> {
  return apiClient<GetAvailableClientsResponse>('/policies/clients')
}
