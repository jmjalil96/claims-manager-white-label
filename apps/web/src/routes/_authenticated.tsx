import { useCallback } from 'react'
import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'
import { PageLoader } from '@/components/ui/page-loader'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarWordmark,
  SidebarCollapseButton,
  SidebarContent,
  SidebarNav,
  SidebarNavItem,
  SidebarFooter,
  SidebarMobileHeader,
  SidebarMobileTrigger,
  SidebarMobileDrawer,
  SidebarUserMenu,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Folder,
  Users,
  Stethoscope,
  PieChart,
  Settings,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { data: session, isPending } = useSession()

  const handleSignOut = useCallback(() => {
    void signOut()
  }, [])

  if (isPending) {
    return <PageLoader />
  }

  if (!session) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} />
  }

  const navItems = (
    <>
      <SidebarNavItem to="/dashboard" icon={LayoutDashboard} exact>
        Dashboard
      </SidebarNavItem>
      <SidebarNavItem to="/claims" icon={Folder}>
        Claims
      </SidebarNavItem>
      <SidebarNavItem to="/patients" icon={Users}>
        Patients
      </SidebarNavItem>
      <SidebarNavItem to="/providers" icon={Stethoscope}>
        Providers
      </SidebarNavItem>
      <SidebarNavItem to="/reports" icon={PieChart}>
        Reports
      </SidebarNavItem>
      <SidebarNavItem to="/settings" icon={Settings}>
        Settings
      </SidebarNavItem>
    </>
  )

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {/* Mobile Header */}
        <SidebarMobileHeader>
          <SidebarWordmark />
          <SidebarMobileTrigger />
        </SidebarMobileHeader>

        {/* Desktop Sidebar */}
        <Sidebar>
          <SidebarHeader className="mb-10">
            <SidebarWordmark />
          </SidebarHeader>

          <SidebarContent>
            <SidebarNav>{navItems}</SidebarNav>
          </SidebarContent>

          <SidebarFooter>
            <SidebarUserMenu email={session.user.email} onSignOut={handleSignOut} />
          </SidebarFooter>

          <SidebarCollapseButton />
        </Sidebar>

        {/* Mobile Drawer */}
        <SidebarMobileDrawer>
          <SidebarNav className="mb-8">{navItems}</SidebarNav>
          <SidebarUserMenu email={session.user.email} onSignOut={handleSignOut} />
        </SidebarMobileDrawer>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pt-14 lg:pt-0">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
