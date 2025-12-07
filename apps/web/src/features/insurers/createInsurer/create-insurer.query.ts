import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createInsurer } from './create-insurer.api'
import { insurersKeys } from '../query-keys'
import type { CreateInsurerRequest } from './create-insurer.types'

export function useCreateInsurer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInsurerRequest) => createInsurer(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: insurersKeys.lists() })
    },
  })
}
