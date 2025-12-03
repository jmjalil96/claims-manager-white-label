import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) return null
  if (session) return <Navigate to="/dashboard" />

  return <Outlet />
}
