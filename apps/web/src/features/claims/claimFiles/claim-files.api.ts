import { apiClient } from '@/lib/api-client'
import type {
  ListClaimFilesResponse,
  CreateClaimFileRequest,
  CreateClaimFileResponse,
  DeleteClaimFileResponse,
  GetUploadUrlRequest,
  GetUploadUrlResponse,
} from '@claims/shared'

export async function fetchClaimFiles(claimId: string): Promise<ListClaimFilesResponse> {
  return apiClient<ListClaimFilesResponse>(`/claims/${claimId}/files`)
}

export async function getFileUploadUrl(
  claimId: string,
  data: GetUploadUrlRequest
): Promise<GetUploadUrlResponse> {
  return apiClient<GetUploadUrlResponse>(`/claims/${claimId}/files/upload-url`, {
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

export async function createClaimFile(
  claimId: string,
  data: CreateClaimFileRequest
): Promise<CreateClaimFileResponse> {
  return apiClient<CreateClaimFileResponse>(`/claims/${claimId}/files`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteClaimFile(
  claimId: string,
  fileId: string
): Promise<DeleteClaimFileResponse> {
  return apiClient<DeleteClaimFileResponse>(`/claims/${claimId}/files/${fileId}`, {
    method: 'DELETE',
  })
}
