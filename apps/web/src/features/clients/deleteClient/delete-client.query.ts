import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { deleteClient } from './delete-client.api'
import { clientsKeys } from '../query-keys'

export function useDeleteClient(id: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => deleteClient(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.lists() })
      void queryClient.removeQueries({ queryKey: clientsKeys.detail(id) })
      void navigate({ to: '/clients' })
    },
    onError: (error) => {
      console.error('Failed to delete client:', error)
    },
  })
}
