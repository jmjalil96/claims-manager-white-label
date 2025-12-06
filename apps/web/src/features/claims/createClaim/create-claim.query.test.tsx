import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useClients, useAffiliates, usePatients } from './create-claim.query'
import { server } from '@/test/server'
import { http, HttpResponse } from 'msw'

// =============================================================================
// TEST SETUP
// =============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

// =============================================================================
// useClients
// =============================================================================

describe('useClients', () => {
  it('fetches clients successfully', async () => {
    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // API returns { clients: [...] }
    const clients = result.current.data?.clients
    expect(clients).toHaveLength(2)
    expect(clients?.[0]?.name).toBe('Acme Insurance')
  })

  it('returns error on API failure', async () => {
    server.use(
      http.get('*/api/claims/clients', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { result } = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

// =============================================================================
// useAffiliates
// =============================================================================

describe('useAffiliates', () => {
  it('is disabled when clientId is null', () => {
    const { result } = renderHook(() => useAffiliates(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches affiliates when clientId is provided', async () => {
    const { result } = renderHook(
      () => useAffiliates('clclient000000000000001'),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // API returns { affiliates: [...] }
    const affiliates = result.current.data?.affiliates
    expect(affiliates).toHaveLength(2)
    expect(affiliates?.[0]?.firstName).toBe('John')
  })

  it('re-fetches when clientId changes', async () => {
    const { result, rerender } = renderHook(
      ({ clientId }: { clientId: string | null }) => useAffiliates(clientId),
      {
        wrapper: createWrapper(),
        initialProps: { clientId: 'clclient000000000000001' },
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Change clientId
    rerender({ clientId: 'clclient000000000000002' })

    // Should trigger a new fetch
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('becomes idle when clientId changes to null', async () => {
    const { result, rerender } = renderHook(
      ({ clientId }: { clientId: string | null }) => useAffiliates(clientId),
      {
        wrapper: createWrapper(),
        initialProps: { clientId: 'clclient000000000000001' as string | null },
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Clear clientId
    rerender({ clientId: null })

    expect(result.current.fetchStatus).toBe('idle')
  })
})

// =============================================================================
// usePatients
// =============================================================================

describe('usePatients', () => {
  it('is disabled when affiliateId is null', () => {
    const { result } = renderHook(() => usePatients(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches patients when affiliateId is provided', async () => {
    const { result } = renderHook(
      () => usePatients('claffiliate0000000001'),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // API returns { patients: [...] }
    const patients = result.current.data?.patients
    expect(patients).toHaveLength(2)
    expect(patients?.[0]?.firstName).toBe('John')
  })

  it('re-fetches when affiliateId changes', async () => {
    const { result, rerender } = renderHook(
      ({ affiliateId }: { affiliateId: string | null }) => usePatients(affiliateId),
      {
        wrapper: createWrapper(),
        initialProps: { affiliateId: 'claffiliate0000000001' },
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Change affiliateId
    rerender({ affiliateId: 'claffiliate0000000002' })

    // Should trigger a new fetch
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('becomes idle when affiliateId changes to null', async () => {
    const { result, rerender } = renderHook(
      ({ affiliateId }: { affiliateId: string | null }) => usePatients(affiliateId),
      {
        wrapper: createWrapper(),
        initialProps: { affiliateId: 'claffiliate0000000001' as string | null },
      }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Clear affiliateId
    rerender({ affiliateId: null })

    expect(result.current.fetchStatus).toBe('idle')
  })
})

// =============================================================================
// CASCADING BEHAVIOR
// =============================================================================

describe('cascading select behavior', () => {
  it('demonstrates the cascade: client -> affiliate -> patient', async () => {
    // Start with no selections
    const clientHook = renderHook(() => useClients(), {
      wrapper: createWrapper(),
    })

    const affiliateHook = renderHook(
      ({ clientId }: { clientId: string | null }) => useAffiliates(clientId),
      {
        wrapper: createWrapper(),
        initialProps: { clientId: null as string | null },
      }
    )

    const patientHook = renderHook(
      ({ affiliateId }: { affiliateId: string | null }) => usePatients(affiliateId),
      {
        wrapper: createWrapper(),
        initialProps: { affiliateId: null as string | null },
      }
    )

    // Initially, affiliates and patients are idle
    expect(affiliateHook.result.current.fetchStatus).toBe('idle')
    expect(patientHook.result.current.fetchStatus).toBe('idle')

    // Wait for clients to load
    await waitFor(() => {
      expect(clientHook.result.current.isSuccess).toBe(true)
    })

    // Simulate selecting a client
    const clients = clientHook.result.current.data?.clients
    const selectedClientId = clients?.[0]?.id
    if (selectedClientId) {
      affiliateHook.rerender({ clientId: selectedClientId })
    }

    // Wait for affiliates to load
    await waitFor(() => {
      expect(affiliateHook.result.current.isSuccess).toBe(true)
    })

    // Simulate selecting an affiliate
    const affiliates = affiliateHook.result.current.data?.affiliates
    const selectedAffiliateId = affiliates?.[0]?.id
    if (selectedAffiliateId) {
      patientHook.rerender({ affiliateId: selectedAffiliateId })
    }

    // Wait for patients to load
    await waitFor(() => {
      expect(patientHook.result.current.isSuccess).toBe(true)
    })

    // All data should be available
    expect(clientHook.result.current.data?.clients).toHaveLength(2)
    expect(affiliateHook.result.current.data?.affiliates).toHaveLength(2)
    expect(patientHook.result.current.data?.patients).toHaveLength(2)
  })
})
