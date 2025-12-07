import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { deleteAffiliate } from './delete-affiliate.api'
import { affiliatesKeys } from '../query-keys'

export function useDeleteAffiliate(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => deleteAffiliate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliatesKeys.lists() })
      void queryClient.removeQueries({ queryKey: affiliatesKeys.detail(id) })
      void navigate({ to: '/affiliates' })
    },
    onError: (error) => {
      console.error('Failed to delete affiliate:', error)
    },
  })
}
