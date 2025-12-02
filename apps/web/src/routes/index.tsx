import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useSession } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { data: session, isPending } = useSession()

  if (isPending) return null

  return <Navigate to={session ? '/dashboard' : '/login'} />
}
