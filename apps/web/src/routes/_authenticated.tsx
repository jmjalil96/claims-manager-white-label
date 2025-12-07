import { useCallback } from 'react'
import { createFileRoute, Outlet, Navigate } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'
import {
  PageLoader,
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarWordmark,
  SidebarCollapseButton,
  SidebarContent,
  SidebarNav,
  SidebarNavItem,
  SidebarNavItemAI,
  SidebarFooter,
  SidebarMobileHeader,
  SidebarMobileTrigger,
  SidebarMobileDrawer,
  SidebarUserMenu,
} from '@/components/ui'
import {
  LayoutDashboard,
  Folder,
  FilePlus,
  ScrollText,
  UserCheck,
  Building2,
  Library,
  Sparkles,
  Shield,
  MessageSquareMore,
  FileText,
  Briefcase,
  Handshake,
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
    return <Navigate to="/login" replace search={{ redirect: window.location.pathname }} />
  }

  const navItems = (
    <>
      <SidebarNavItem to="/dashboard" icon={LayoutDashboard} exact>
        Panel
      </SidebarNavItem>
      <SidebarNavItem to="/claims/new" icon={FilePlus} exact>
        Nuevo Reclamo
      </SidebarNavItem>
      <SidebarNavItem to="/claims" icon={Folder} excludePaths={['/claims/new']}>
        Reclamos
      </SidebarNavItem>
      <SidebarNavItem to="/policies" icon={ScrollText}>
        Pólizas
      </SidebarNavItem>
      <SidebarNavItem to="/affiliates" icon={UserCheck}>
        Afiliados
      </SidebarNavItem>
      <SidebarNavItem to="/clients" icon={Building2}>
        Clientes
      </SidebarNavItem>
      <SidebarNavItem to="/insurers" icon={Shield}>
        Aseguradoras
      </SidebarNavItem>
      <SidebarNavItem to="/invoices" icon={FileText}>
        Facturas
      </SidebarNavItem>
      <SidebarNavItem to="/tickets" icon={MessageSquareMore}>
        Centro de Resolución
      </SidebarNavItem>
      <SidebarNavItem to="/library" icon={Library}>
        Biblioteca
      </SidebarNavItem>
      <SidebarNavItemAI to="/capstone-ai" icon={Sparkles}>
        CapstoneAI
      </SidebarNavItemAI>
      <SidebarNavItem to="/employees" icon={Briefcase}>
        Empleados
      </SidebarNavItem>
      <SidebarNavItem to="/agents" icon={Handshake}>
        Agentes
      </SidebarNavItem>
    </>
  )

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
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
        <main className="flex-1 min-w-0 min-h-0 pt-14 lg:pt-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 p-8 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
