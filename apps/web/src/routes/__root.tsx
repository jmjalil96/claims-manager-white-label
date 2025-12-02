import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </QueryClientProvider>
  )
}
