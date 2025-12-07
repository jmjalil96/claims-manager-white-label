import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAffiliate } from './create-affiliate.api'
import { affiliatesKeys } from '../query-keys'
import type { CreateAffiliateRequest } from './create-affiliate.types'

export function useCreateAffiliate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAffiliateRequest) => createAffiliate(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: affiliatesKeys.lists() })
    },
  })
}
