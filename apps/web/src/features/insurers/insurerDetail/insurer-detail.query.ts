import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchInsurerDetail, updateInsurer } from './insurer-detail.api'
import { insurersKeys } from '../query-keys'
import type { UpdateInsurerRequestDto } from './insurer-detail.api'

export function useInsurerDetail(id: string) {
  return useQuery({
    queryKey: insurersKeys.detail(id),
    queryFn: () => fetchInsurerDetail(id),
  })
}

export function useUpdateInsurer(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateInsurerRequestDto) => updateInsurer(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: insurersKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: insurersKeys.lists() })
    },
    onError: (error) => {
      console.error('Failed to update insurer:', error)
    },
  })
}
