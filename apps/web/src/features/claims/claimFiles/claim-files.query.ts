import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { claimsKeys } from '../query-keys'
import {
  fetchClaimFiles,
  getFileUploadUrl,
  uploadFileToStorage,
  createClaimFile,
  deleteClaimFile,
} from './claim-files.api'
import type { CreateClaimFileRequest, GetUploadUrlRequest, ClaimFileCategory } from '@claims/shared'

export function useClaimFiles(claimId: string) {
  return useQuery({
    queryKey: claimsKeys.files(claimId),
    queryFn: () => fetchClaimFiles(claimId),
  })
}

export function useUploadClaimFile(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      category,
      description,
    }: {
      file: File
      category?: ClaimFileCategory
      description?: string
    }) => {
      // 1. Get presigned URL
      const uploadData: GetUploadUrlRequest = {
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }
      const { storageKey, uploadUrl } = await getFileUploadUrl(claimId, uploadData)

      // 2. Upload to storage
      await uploadFileToStorage(uploadUrl, file)

      // 3. Create file record
      const createData: CreateClaimFileRequest = {
        storageKey,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        category,
        description,
      }
      return createClaimFile(claimId, createData)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimsKeys.files(claimId) })
    },
  })
}

export function useDeleteClaimFile(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => deleteClaimFile(claimId, fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimsKeys.files(claimId) })
    },
  })
}
