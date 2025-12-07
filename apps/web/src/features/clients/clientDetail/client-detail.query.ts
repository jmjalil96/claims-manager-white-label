import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClientDetail, updateClient } from './client-detail.api'
import { clientsKeys } from '../query-keys'
import type { UpdateClientRequestDto } from './client-detail.api'

export function useClientDetail(id: string) {
  return useQuery({
    queryKey: clientsKeys.detail(id),
    queryFn: () => fetchClientDetail(id),
  })
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateClientRequestDto) => updateClient(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: clientsKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to update client:', error)
    },
  })
}
