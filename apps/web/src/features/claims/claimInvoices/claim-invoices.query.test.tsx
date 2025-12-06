import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useClaimInvoices, useCreateInvoice, useDeleteInvoice } from './claim-invoices.query'
import { server } from '@/test/server'
import { http, HttpResponse } from 'msw'
import type { InvoiceDto } from '@claims/shared'

// =============================================================================
// TEST SETUP
// =============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    )
  }
}

const TEST_CLAIM_ID = 'cl000000000000000000001'

const mockInvoice: InvoiceDto = {
  id: 'clinvoice001',
  claimId: TEST_CLAIM_ID,
  invoiceNumber: 'INV-001',
  providerName: 'Hospital General',
  amountSubmitted: 1500,
  createdAt: new Date().toISOString(),
  createdById: 'usr000000000000000000001',
}

// =============================================================================
// useClaimInvoices TESTS
// =============================================================================

describe('useClaimInvoices', () => {
  it('fetches invoices successfully', async () => {
    const { result } = renderHook(() => useClaimInvoices(TEST_CLAIM_ID), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.invoices).toBeDefined()
  })

  it('returns invoices array from response', async () => {
    // Setup handler with mock invoices
    server.use(
      http.get('*/api/claims/:id/invoices', () => {
        return HttpResponse.json({
          invoices: [mockInvoice],
        })
      })
    )

    const { result } = renderHook(() => useClaimInvoices(TEST_CLAIM_ID), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.invoices).toHaveLength(1)
    expect(result.current.data?.invoices[0]?.invoiceNumber).toBe('INV-001')
  })
})

// =============================================================================
// useCreateInvoice TESTS
// =============================================================================

describe('useCreateInvoice', () => {
  it('creates invoice successfully', async () => {
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateInvoice(TEST_CLAIM_ID), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        invoiceNumber: 'INV-002',
        providerName: 'Clinic ABC',
        amountSubmitted: 500,
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.invoice).toBeDefined()
  })

  it('invalidates invoices query on success', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateInvoice(TEST_CLAIM_ID), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        invoiceNumber: 'INV-003',
        providerName: 'Test Provider',
        amountSubmitted: 250,
      })
    })

    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('returns created invoice data', async () => {
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateInvoice(TEST_CLAIM_ID), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        invoiceNumber: 'INV-NEW',
        providerName: 'New Provider',
        amountSubmitted: 1000,
      })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.invoice.invoiceNumber).toBe('INV-NEW')
    expect(result.current.data?.invoice.providerName).toBe('New Provider')
    expect(result.current.data?.invoice.amountSubmitted).toBe(1000)
  })
})

// =============================================================================
// useDeleteInvoice TESTS
// =============================================================================

describe('useDeleteInvoice', () => {
  it('deletes invoice successfully', async () => {
    const queryClient = createTestQueryClient()

    // Setup delete handler
    server.use(
      http.delete('*/api/claims/:claimId/invoices/:invoiceId', () => {
        return HttpResponse.json({ success: true })
      })
    )

    const { result } = renderHook(() => useDeleteInvoice(TEST_CLAIM_ID), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('invoice-to-delete')
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('invalidates invoices query after deletion', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    server.use(
      http.delete('*/api/claims/:claimId/invoices/:invoiceId', () => {
        return HttpResponse.json({ success: true })
      })
    )

    const { result } = renderHook(() => useDeleteInvoice(TEST_CLAIM_ID), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync('invoice-id')
    })

    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('handles error when deletion fails', async () => {
    const queryClient = createTestQueryClient()

    server.use(
      http.delete('*/api/claims/:claimId/invoices/:invoiceId', () => {
        return new HttpResponse(null, { status: 404 })
      })
    )

    const { result } = renderHook(() => useDeleteInvoice(TEST_CLAIM_ID), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync('nonexistent-invoice')
      } catch {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
