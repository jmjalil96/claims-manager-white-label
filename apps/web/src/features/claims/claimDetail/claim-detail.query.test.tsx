import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useClaimDetail, useUpdateClaimField } from './claim-detail.query'
import { mockClaims } from '@/test/handlers'
import { ClaimStatus } from '@claims/shared'

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

// =============================================================================
// useClaimDetail TESTS
// =============================================================================

describe('useClaimDetail', () => {
  it('fetches claim detail successfully', async () => {
    const claimId = mockClaims[0]!.id

    const { result } = renderHook(() => useClaimDetail(claimId), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.claim).toBeDefined()
    expect(result.current.data?.claim.id).toBe(claimId)
  })

  it('returns 404 error for non-existent claim', async () => {
    const { result } = renderHook(() => useClaimDetail('nonexistent-id'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

// =============================================================================
// useUpdateClaimField TESTS
// =============================================================================

describe('useUpdateClaimField', () => {
  it('updates claim field successfully', async () => {
    const queryClient = createTestQueryClient()
    const claimId = mockClaims[0]!.id

    const { result } = renderHook(() => useUpdateClaimField(claimId), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ description: 'Updated description' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('updates claim status field', async () => {
    const queryClient = createTestQueryClient()
    const claimId = mockClaims[0]!.id

    const { result } = renderHook(() => useUpdateClaimField(claimId), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ status: ClaimStatus.VALIDATION })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.claim.status).toBe(ClaimStatus.VALIDATION)
  })

  it('invalidates related queries on success', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const claimId = mockClaims[0]!.id

    const { result } = renderHook(() => useUpdateClaimField(claimId), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ description: 'New description' })
    })

    // Should invalidate detail, lists, and kanban queries
    expect(invalidateSpy).toHaveBeenCalled()
  })

  it('handles error state on mutation failure', async () => {
    const queryClient = createTestQueryClient()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Use non-existent claim to trigger 404
    const { result } = renderHook(() => useUpdateClaimField('nonexistent-claim'), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      try {
        await result.current.mutateAsync({ description: 'Test' })
      } catch {
        // Expected to throw
      }
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    consoleSpy.mockRestore()
  })

  it('provides mutation data after success', async () => {
    const queryClient = createTestQueryClient()
    const claimId = mockClaims[0]!.id

    const { result } = renderHook(() => useUpdateClaimField(claimId), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({ description: 'New description' })
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    // The mutation returns a claim object in the response
    expect(result.current.data?.claim).toBeDefined()
  })
})
