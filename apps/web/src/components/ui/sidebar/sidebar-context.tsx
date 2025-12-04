import * as React from 'react'

const STORAGE_KEY = 'sidebar-collapsed'

interface SidebarContextValue {
  collapsed: boolean
  mobileOpen: boolean
  setCollapsed: (collapsed: boolean) => void
  setMobileOpen: (open: boolean) => void
  toggle: () => void
  toggleMobile: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

interface SidebarProviderProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [collapsed, setCollapsedState] = React.useState(() => {
    if (typeof window === 'undefined') return defaultCollapsed
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null ? stored === 'true' : defaultCollapsed
  })
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const setCollapsed = React.useCallback((value: boolean) => {
    setCollapsedState(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  const toggle = React.useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  const toggleMobile = React.useCallback(() => {
    setMobileOpen((prev) => !prev)
  }, [])

  const value = React.useMemo(
    () => ({
      collapsed,
      mobileOpen,
      setCollapsed,
      setMobileOpen,
      toggle,
      toggleMobile,
    }),
    [collapsed, mobileOpen, setCollapsed, toggle, toggleMobile]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { SidebarProvider, useSidebar }
export type { SidebarContextValue, SidebarProviderProps }
