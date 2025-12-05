import { apiClient } from '@/lib/api-client'
import type {
  GetAvailableClientsResponse,
  GetAvailableAffiliatesResponse,
  GetAvailablePatientsResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
  CreateClaimResponse,
  CreateClaimFileInput,
} from '@claims/shared'

// =============================================================================
// LOOKUP ENDPOINTS
// =============================================================================

export async function fetchClients(): Promise<GetAvailableClientsResponse> {
  return apiClient<GetAvailableClientsResponse>('/claims/clients')
}

export async function fetchAffiliates(
  clientId: string
): Promise<GetAvailableAffiliatesResponse> {
  return apiClient<GetAvailableAffiliatesResponse>(
    `/claims/clients/${clientId}/affiliates`
  )
}

export async function fetchPatients(
  affiliateId: string
): Promise<GetAvailablePatientsResponse> {
  return apiClient<GetAvailablePatientsResponse>(
    `/claims/affiliates/${affiliateId}/patients`
  )
}

// =============================================================================
// FILE UPLOAD
// =============================================================================

export async function getUploadUrl(
  data: GetUploadUrlRequest
): Promise<GetUploadUrlResponse> {
  return apiClient<GetUploadUrlResponse>('/claims/upload-url', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function uploadFileToStorage(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }
}

// =============================================================================
// CREATE CLAIM
// =============================================================================

export interface CreateClaimRequest {
  clientId: string
  affiliateId: string
  patientId: string
  description: string
  files?: CreateClaimFileInput[]
}

export async function createClaim(
  data: CreateClaimRequest
): Promise<CreateClaimResponse> {
  return apiClient<CreateClaimResponse>('/claims', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
