import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useClaims } from './list-claims.query'
import { server } from '@/test/server'
import { http, HttpResponse } from 'msw'
import { ClaimStatus } from '@claims/shared'

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
// BASIC QUERY TESTS
// =============================================================================

describe('useClaims', () => {
  it('fetches claims list successfully', async () => {
    const { result } = renderHook(() => useClaims({}), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.claims).toBeDefined()
    expect(result.current.data?.meta).toBeDefined()
  })

  it('returns pagination metadata', async () => {
    const { result } = renderHook(() => useClaims({ page: 1, limit: 20 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const meta = result.current.data?.meta
    expect(meta?.page).toBe(1)
    expect(meta?.limit).toBe(20)
    expect(meta?.totalCount).toBeDefined()
    expect(meta?.hasNextPage).toBeDefined()
    expect(meta?.hasPrevPage).toBeDefined()
  })

  // =============================================================================
  // FILTER TESTS
  // =============================================================================

  describe('filtering', () => {
    it('filters by status', async () => {
      const { result } = renderHook(
        () => useClaims({ status: ClaimStatus.DRAFT }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should only return DRAFT claims
      const claims = result.current.data?.claims ?? []
      expect(claims.every((c) => c.status === ClaimStatus.DRAFT)).toBe(true)
    })

    it('supports multiple status filter', async () => {
      const { result } = renderHook(
        () => useClaims({ status: `${ClaimStatus.DRAFT},${ClaimStatus.VALIDATION}` }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const claims = result.current.data?.claims ?? []
      const validStatuses: string[] = [ClaimStatus.DRAFT, ClaimStatus.VALIDATION]
      expect(claims.every((c) => validStatuses.includes(c.status))).toBe(true)
    })
  })

  // =============================================================================
  // PAGINATION TESTS
  // =============================================================================

  describe('pagination', () => {
    it('respects page parameter', async () => {
      const { result } = renderHook(
        () => useClaims({ page: 1, limit: 2 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.meta.page).toBe(1)
    })

    it('respects limit parameter', async () => {
      const { result } = renderHook(
        () => useClaims({ page: 1, limit: 2 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should return at most 2 claims
      expect(result.current.data?.claims.length).toBeLessThanOrEqual(2)
    })
  })

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      server.use(
        http.get('*/api/claims', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      const { result } = renderHook(() => useClaims({}), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })
  })

  // =============================================================================
  // REFETCH BEHAVIOR TESTS
  // =============================================================================

  describe('refetch behavior', () => {
    it('refetches when params change', async () => {
      const { result, rerender } = renderHook(
        ({ params }) => useClaims(params),
        {
          wrapper: createWrapper(),
          initialProps: { params: { page: 1 } },
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Change params
      rerender({ params: { page: 2 } })

      // Should trigger refetch
      await waitFor(() => {
        expect(result.current.data?.meta.page).toBe(2)
      })
    })

    it('uses keepPreviousData for smooth transitions', async () => {
      const { result, rerender } = renderHook(
        ({ params }) => useClaims(params),
        {
          wrapper: createWrapper(),
          initialProps: { params: { page: 1 } },
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Change params - should keep previous data while loading
      rerender({ params: { page: 2 } })

      // placeholderData should preserve previous data during fetch
      // The isPlaceholderData flag indicates this
      if (result.current.isPlaceholderData) {
        expect(result.current.data).toBeDefined()
      }

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.isPlaceholderData).toBe(false)
      })
    })
  })
})
