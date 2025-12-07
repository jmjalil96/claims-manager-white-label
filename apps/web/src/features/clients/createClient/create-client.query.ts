import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from './create-client.api'
import { clientsKeys } from '../query-keys'
import type { CreateClientRequest } from './create-client.types'

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientRequest) => createClient(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.lists() })
    },
  })
}
