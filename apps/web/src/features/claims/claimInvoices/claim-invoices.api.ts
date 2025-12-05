import { apiClient } from '@/lib/api-client'
import type {
  ListInvoicesResponse,
  CreateInvoiceResponse,
  EditInvoiceResponse,
  DeleteInvoiceResponse,
} from '@claims/shared'

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface CreateInvoiceRequest {
  invoiceNumber: string
  providerName: string
  amountSubmitted: number
}

export interface EditInvoiceRequest {
  invoiceNumber?: string
  providerName?: string
  amountSubmitted?: number
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

export async function fetchInvoices(claimId: string): Promise<ListInvoicesResponse> {
  return apiClient<ListInvoicesResponse>(`/claims/${claimId}/invoices`)
}

export async function createInvoice(
  claimId: string,
  data: CreateInvoiceRequest
): Promise<CreateInvoiceResponse> {
  return apiClient<CreateInvoiceResponse>(`/claims/${claimId}/invoices`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function editInvoice(
  claimId: string,
  invoiceId: string,
  data: EditInvoiceRequest
): Promise<EditInvoiceResponse> {
  return apiClient<EditInvoiceResponse>(`/claims/${claimId}/invoices/${invoiceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteInvoice(
  claimId: string,
  invoiceId: string
): Promise<DeleteInvoiceResponse> {
  return apiClient<DeleteInvoiceResponse>(`/claims/${claimId}/invoices/${invoiceId}`, {
    method: 'DELETE',
  })
}
