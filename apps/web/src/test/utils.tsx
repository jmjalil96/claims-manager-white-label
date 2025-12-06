import type { ReactElement, ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createRouter,
  createRootRoute,
  createRoute,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import userEvent from '@testing-library/user-event'
import { expect, vi } from 'vitest'

// Mock auth-client for tests
vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({
    data: { user: { email: 'test@example.com', id: 'user123' } },
    isPending: false,
  }),
  signOut: vi.fn(),
}))

// Re-export everything from testing-library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'
export { userEvent }

// =============================================================================
// QUERY CLIENT FOR TESTS
// =============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// =============================================================================
// CUSTOM RENDER
// =============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options ?? {}

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    user: userEvent.setup(),
  }
}

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Wait for loading states to finish
 */
export async function waitForLoadingToFinish() {
  await waitFor(
    () => {
      const loaders = screen.queryAllByRole('status')
      const spinners = screen.queryAllByTestId('loading-spinner')
      expect([...loaders, ...spinners]).toHaveLength(0)
    },
    { timeout: 5000 }
  )
}

/**
 * Wait for element to be removed
 */
export async function waitForElementToBeRemoved(callback: () => HTMLElement | null) {
  await waitFor(() => {
    expect(callback()).not.toBeInTheDocument()
  })
}

/**
 * Create a deferred promise for controlled async testing
 */
export function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

// =============================================================================
// ROUTER UTILITIES FOR INTEGRATION TESTS
// =============================================================================

interface RenderWithRouterOptions extends CustomRenderOptions {
  initialPath?: string
  route?: {
    path: string
    component: () => ReactElement
  }
}

/**
 * Render a component with TanStack Router and React Query providers
 * Useful for testing route components in isolation
 */
export function renderWithRouter(
  component: () => ReactElement,
  options?: RenderWithRouterOptions
) {
  const {
    queryClient = createTestQueryClient(),
    initialPath = '/',
    ...renderOptions
  } = options ?? {}

  // Create a simple route tree for testing
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: initialPath,
    component,
  })

  const routeTree = rootRoute.addChildren([testRoute])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return {
    ...render(<RouterProvider router={router} />, renderOptions),
    queryClient,
    user: userEvent.setup(),
    router,
  }
}

/**
 * Create a test wrapper with router for hooks testing
 */
export function createRouterWrapper(initialPath = '/') {
  const queryClient = createTestQueryClient()

  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  })

  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: initialPath,
    component: () => null,
  })

  const routeTree = rootRoute.addChildren([testRoute])

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    queryClient,
    router,
  }
}
