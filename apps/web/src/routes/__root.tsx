import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { FileQuestion, Home } from 'lucide-react'
import { queryClient } from '@/lib/query-client'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/error-boundary'
import { Button } from '@/components/ui/button'

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toaster />
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-left" />}
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </QueryClientProvider>
  )
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100">
          <FileQuestion className="size-8 text-slate-400" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Página no encontrada
          </h1>
          <p className="text-base text-slate-500">
            La página que buscas no existe o fue movida.
          </p>
        </div>

        {/* Action */}
        <Link to="/">
          <Button className="w-full">
            <Home size={18} />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
