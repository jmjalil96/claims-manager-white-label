import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { deleteInsurer } from './delete-insurer.api'
import { insurersKeys } from '../query-keys'

export function useDeleteInsurer(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => deleteInsurer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: insurersKeys.lists() })
      void queryClient.removeQueries({ queryKey: insurersKeys.detail(id) })
      void navigate({ to: '/insurers' })
    },
    onError: (error) => {
      console.error('Failed to delete insurer:', error)
    },
  })
}
