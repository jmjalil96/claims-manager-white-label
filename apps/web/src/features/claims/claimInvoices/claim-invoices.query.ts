import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { claimsKeys } from '../query-keys'
import {
  fetchInvoices,
  createInvoice,
  editInvoice,
  deleteInvoice,
  type CreateInvoiceRequest,
  type EditInvoiceRequest,
} from './claim-invoices.api'

export function useClaimInvoices(claimId: string) {
  return useQuery({
    queryKey: claimsKeys.invoices(claimId),
    queryFn: () => fetchInvoices(claimId),
  })
}

export function useCreateInvoice(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => createInvoice(claimId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimsKeys.invoices(claimId) })
    },
  })
}

export function useEditInvoice(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: EditInvoiceRequest }) =>
      editInvoice(claimId, invoiceId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimsKeys.invoices(claimId) })
    },
  })
}

export function useDeleteInvoice(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(claimId, invoiceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: claimsKeys.invoices(claimId) })
    },
  })
}
