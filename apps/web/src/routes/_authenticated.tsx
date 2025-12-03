import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/page-loader'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <PageLoader />
  }

  if (!session) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} />
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="p-6">
          <h1 className="text-xl font-bold">Claims Manager</h1>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/claims">Claims</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="border-t p-4">
          <p className="mb-2 truncate text-sm text-muted-foreground">{session.user.email}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
      activeProps={{ className: 'active' }}
    >
      {children}
    </Link>
  )
}
