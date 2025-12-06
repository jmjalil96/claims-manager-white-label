import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { policiesKeys } from '../query-keys'
import {
  fetchPolicyFiles,
  getFileUploadUrl,
  uploadFileToStorage,
  createPolicyFile,
  deletePolicyFile,
} from './policy-files.api'
import type { CreatePolicyFileRequest, GetPolicyUploadUrlRequest, PolicyFileCategory } from '@claims/shared'

export function usePolicyFiles(policyId: string) {
  return useQuery({
    queryKey: policiesKeys.files(policyId),
    queryFn: () => fetchPolicyFiles(policyId),
  })
}

export function useUploadPolicyFile(policyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      category,
      description,
    }: {
      file: File
      category?: PolicyFileCategory
      description?: string
    }) => {
      // 1. Get presigned URL
      const uploadData: GetPolicyUploadUrlRequest = {
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }
      const { storageKey, uploadUrl } = await getFileUploadUrl(policyId, uploadData)

      // 2. Upload to storage
      await uploadFileToStorage(uploadUrl, file)

      // 3. Create file record
      const createData: CreatePolicyFileRequest = {
        storageKey,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        category,
        description,
      }
      return createPolicyFile(policyId, createData)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: policiesKeys.files(policyId) })
    },
  })
}

export function useDeletePolicyFile(policyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => deletePolicyFile(policyId, fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: policiesKeys.files(policyId) })
    },
  })
}
