import { apiClient } from '@/lib/api-client'
import type {
  ListPolicyFilesResponse,
  CreatePolicyFileRequest,
  CreatePolicyFileResponse,
  DeletePolicyFileResponse,
  GetPolicyUploadUrlRequest,
  GetPolicyUploadUrlResponse,
} from '@claims/shared'

export async function fetchPolicyFiles(policyId: string): Promise<ListPolicyFilesResponse> {
  return apiClient<ListPolicyFilesResponse>(`/policies/${policyId}/files`)
}

export async function getFileUploadUrl(
  policyId: string,
  data: GetPolicyUploadUrlRequest
): Promise<GetPolicyUploadUrlResponse> {
  return apiClient<GetPolicyUploadUrlResponse>(`/policies/${policyId}/files/upload-url`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function uploadFileToStorage(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }
}

export async function createPolicyFile(
  policyId: string,
  data: CreatePolicyFileRequest
): Promise<CreatePolicyFileResponse> {
  return apiClient<CreatePolicyFileResponse>(`/policies/${policyId}/files`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deletePolicyFile(
  policyId: string,
  fileId: string
): Promise<DeletePolicyFileResponse> {
  return apiClient<DeletePolicyFileResponse>(`/policies/${policyId}/files/${fileId}`, {
    method: 'DELETE',
  })
}
