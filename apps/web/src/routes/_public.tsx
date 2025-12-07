import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'
import { PageLoader } from '@/components/ui'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <PageLoader />
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
