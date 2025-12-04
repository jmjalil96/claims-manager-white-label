import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import { FocusScope } from '@radix-ui/react-focus-scope'
import { cva, type VariantProps } from 'class-variance-authority'
import { ChevronLeft, ChevronRight, Menu, X, LogOut, User, Settings, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

/* -----------------------------------------------------------------------------
 * Sidebar (Root Container)
 * -------------------------------------------------------------------------- */

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ className, children, ...props }, ref) => {
    const { collapsed } = useSidebar()

    return (
      <aside
        ref={ref}
        className={cn(
          'relative hidden lg:flex h-screen flex-col justify-between border-r border-gray-800 bg-slate-900 p-4 transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-[72px]' : 'w-64',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    )
  }
)
Sidebar.displayName = 'Sidebar'

/* -----------------------------------------------------------------------------
 * SidebarHeader
 * -------------------------------------------------------------------------- */

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col gap-8', className)} {...props}>
        {children}
      </div>
    )
  }
)
SidebarHeader.displayName = 'SidebarHeader'

/* -----------------------------------------------------------------------------
 * SidebarBrand
 * -------------------------------------------------------------------------- */

interface SidebarBrandProps extends React.HTMLAttributes<HTMLDivElement> {
  logo: string
  title: string
  subtitle?: string
}

const SidebarBrand = React.forwardRef<HTMLDivElement, SidebarBrandProps>(
  ({ className, logo, title, subtitle, ...props }, ref) => {
    const { collapsed } = useSidebar()

    return (
      <div ref={ref} className={cn('flex gap-3 items-center px-2', className)} {...props}>
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
          style={{ backgroundImage: `url("${logo}")` }}
          aria-hidden="true"
        />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <h1 className="text-white text-base font-medium leading-normal truncate">{title}</h1>
            {subtitle && (
              <p className="text-gray-400 text-sm font-normal leading-normal truncate">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
SidebarBrand.displayName = 'SidebarBrand'

/* -----------------------------------------------------------------------------
 * SidebarWordmark
 * -------------------------------------------------------------------------- */

interface SidebarWordmarkProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string
}

const SidebarWordmark = React.forwardRef<HTMLDivElement, SidebarWordmarkProps>(
  ({ className, text = 'ClaimsManager', ...props }, ref) => {
    const { collapsed } = useSidebar()

    return (
      <div
        ref={ref}
        className={cn(
          'h-12 flex items-center transition-all duration-200',
          collapsed ? 'justify-center' : 'px-3',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'font-bold text-white tracking-tight',
            collapsed ? 'text-base' : 'text-xl'
          )}
        >
          {collapsed ? 'CM' : text}
        </span>
      </div>
    )
  }
)
SidebarWordmark.displayName = 'SidebarWordmark'

/* -----------------------------------------------------------------------------
 * SidebarContent
 * -------------------------------------------------------------------------- */

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex-1 overflow-y-auto', className)} {...props}>
        {children}
      </div>
    )
  }
)
SidebarContent.displayName = 'SidebarContent'

/* -----------------------------------------------------------------------------
 * SidebarFooter
 * -------------------------------------------------------------------------- */

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    )
  }
)
SidebarFooter.displayName = 'SidebarFooter'

/* -----------------------------------------------------------------------------
 * SidebarNav
 * -------------------------------------------------------------------------- */

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const SidebarNav = React.forwardRef<HTMLElement, SidebarNavProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Main navigation"
        className={cn('flex flex-col gap-1', className)}
        {...props}
      >
        {children}
      </nav>
    )
  }
)
SidebarNav.displayName = 'SidebarNav'

/* -----------------------------------------------------------------------------
 * SidebarNavItem
 * -------------------------------------------------------------------------- */

const sidebarNavItemVariants = cva(
  'relative flex items-center rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
  {
    variants: {
      active: {
        true: 'bg-teal-600/20 text-teal-500',
        false: 'text-gray-300 hover:bg-slate-800 hover:text-white',
      },
      collapsed: {
        true: 'justify-center py-3',
        false: 'gap-3 px-3 py-3',
      },
    },
    defaultVariants: {
      active: false,
      collapsed: false,
    },
  }
)

interface SidebarNavItemProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    VariantProps<typeof sidebarNavItemVariants> {
  to: string
  icon: LucideIcon
  children: React.ReactNode
  exact?: boolean
}

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ className, to, icon: Icon, children, exact = false, ...props }, ref) => {
    const { collapsed } = useSidebar()
    const location = useLocation()

    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)

    const link = (
      <Link
        ref={ref}
        to={to}
        className={cn(sidebarNavItemVariants({ active: isActive, collapsed }), className)}
        {...props}
      >
        {isActive && !collapsed && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-teal-500 rounded-r-full"
            aria-hidden="true"
          />
        )}
        <Icon
          size={collapsed ? 24 : 22}
          className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-teal-500' : 'text-gray-300'
          )}
          aria-hidden="true"
        />
        {!collapsed && (
          <span className={cn('text-sm leading-normal', isActive ? 'font-bold text-teal-500' : 'font-medium')}>
            {children}
          </span>
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                sideOffset={12}
                className="z-50 px-3 py-1.5 text-sm font-medium text-white bg-slate-800 border border-gray-700 rounded-md shadow-md"
              >
                {children}
                <Tooltip.Arrow className="fill-slate-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )
    }

    return link
  }
)
SidebarNavItem.displayName = 'SidebarNavItem'

/* -----------------------------------------------------------------------------
 * SidebarCollapseButton
 * -------------------------------------------------------------------------- */

type SidebarCollapseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const SidebarCollapseButton = React.forwardRef<HTMLButtonElement, SidebarCollapseButtonProps>(
  ({ className, ...props }, ref) => {
    const { collapsed, toggle } = useSidebar()

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute -right-3.5 top-[26px] z-50 hidden lg:flex items-center justify-center h-7 w-7 rounded-full bg-slate-800 border-2 border-teal-500 text-teal-500 hover:bg-teal-500 hover:text-white shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
          className
        )}
        {...props}
      >
        {collapsed ? (
          <ChevronRight size={16} aria-hidden="true" />
        ) : (
          <ChevronLeft size={16} aria-hidden="true" />
        )}
      </button>
    )
  }
)
SidebarCollapseButton.displayName = 'SidebarCollapseButton'

/* -----------------------------------------------------------------------------
 * SidebarMobileHeader
 * -------------------------------------------------------------------------- */

interface SidebarMobileHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

const SidebarMobileHeader = React.forwardRef<HTMLElement, SidebarMobileHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-slate-900 border-b border-gray-800',
          className
        )}
        {...props}
      >
        {children}
      </header>
    )
  }
)
SidebarMobileHeader.displayName = 'SidebarMobileHeader'

/* -----------------------------------------------------------------------------
 * SidebarMobileTrigger
 * -------------------------------------------------------------------------- */

type SidebarMobileTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const SidebarMobileTrigger = React.forwardRef<HTMLButtonElement, SidebarMobileTriggerProps>(
  ({ className, ...props }, ref) => {
    const { mobileOpen, toggleMobile } = useSidebar()

    return (
      <button
        ref={ref}
        type="button"
        onClick={toggleMobile}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        className={cn(
          'flex items-center justify-center h-10 w-10 rounded-md text-gray-300 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
          className
        )}
        {...props}
      >
        {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>
    )
  }
)
SidebarMobileTrigger.displayName = 'SidebarMobileTrigger'

/* -----------------------------------------------------------------------------
 * SidebarMobileDrawer
 * -------------------------------------------------------------------------- */

interface SidebarMobileDrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SidebarMobileDrawer = React.forwardRef<HTMLDivElement, SidebarMobileDrawerProps>(
  ({ className, children, ...props }, ref) => {
    const { mobileOpen, setMobileOpen } = useSidebar()
    const drawerRef = React.useRef<HTMLDivElement>(null)

    // Close drawer on route change (only if open)
    const location = useLocation()
    React.useEffect(() => {
      if (mobileOpen) {
        setMobileOpen(false)
      }
    }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

    // Prevent body scroll when open
    React.useEffect(() => {
      if (mobileOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [mobileOpen])

    // Close on Escape key
    React.useEffect(() => {
      if (!mobileOpen) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileOpen(false)
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [mobileOpen, setMobileOpen])

    // Focus first focusable element when opened
    React.useEffect(() => {
      if (mobileOpen && drawerRef.current) {
        const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
          'a, button, [tabindex]:not([tabindex="-1"])'
        )
        firstFocusable?.focus()
      }
    }, [mobileOpen])

    if (!mobileOpen) return null

    return (
      <>
        {/* Backdrop */}
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        {/* Drawer */}
        <FocusScope trapped loop>
          <div
            ref={(node) => {
              // Handle both refs
              (drawerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={cn(
              'lg:hidden fixed top-14 left-0 bottom-0 z-50 w-[280px] bg-slate-900 border-r border-gray-800 p-4 overflow-y-auto',
              className
            )}
            {...props}
          >
            {children}
          </div>
        </FocusScope>
      </>
    )
  }
)
SidebarMobileDrawer.displayName = 'SidebarMobileDrawer'

/* -----------------------------------------------------------------------------
 * SidebarUserSection
 * -------------------------------------------------------------------------- */

interface SidebarUserSectionProps {
  email: string
  onSignOut: () => void
}

function SidebarUserSection({ email, onSignOut }: SidebarUserSectionProps) {
  const { collapsed } = useSidebar()

  if (collapsed) return null

  return (
    <div className="border-t border-gray-800 pt-3">
      <p className="px-3 mb-2 truncate text-sm text-gray-400">{email}</p>
      <button
        type="button"
        onClick={onSignOut}
        className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-gray-300 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <LogOut size={22} aria-hidden="true" />
        <span className="text-sm font-medium">Sign out</span>
      </button>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * SidebarUserMenu
 * -------------------------------------------------------------------------- */

interface SidebarUserMenuProps {
  email: string
  onSignOut: () => void
}

const dropdownItemStyles =
  'flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 rounded-md outline-none cursor-pointer transition-colors hover:bg-slate-700 hover:text-white focus:bg-slate-700 focus:text-white data-[highlighted]:bg-slate-700 data-[highlighted]:text-white'

function SidebarUserMenu({ email, onSignOut }: SidebarUserMenuProps) {
  const { collapsed } = useSidebar()
  const initial = email ? email.charAt(0).toUpperCase() : 'U'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center rounded-lg transition-colors',
            'text-gray-300 hover:bg-slate-800 hover:text-white',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
            collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-3 w-full'
          )}
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-700 text-white text-sm font-medium shrink-0">
            {initial}
          </div>
          {!collapsed && (
            <span className="text-sm font-medium truncate">{email}</span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align={collapsed ? 'center' : 'start'}
          sideOffset={8}
          className="z-50 min-w-[180px] bg-slate-800 border border-gray-700 rounded-lg p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Item asChild>
            <Link to="/settings" className={dropdownItemStyles}>
              <User size={16} aria-hidden="true" />
              Profile
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link to="/settings" className={dropdownItemStyles}>
              <Settings size={16} aria-hidden="true" />
              Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-gray-700 my-1" />
          <DropdownMenu.Item
            onSelect={onSignOut}
            className={dropdownItemStyles}
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sidebar,
  SidebarHeader,
  SidebarBrand,
  SidebarWordmark,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  SidebarCollapseButton,
  SidebarMobileHeader,
  SidebarMobileTrigger,
  SidebarMobileDrawer,
  SidebarUserSection,
  SidebarUserMenu,
  // eslint-disable-next-line react-refresh/only-export-components
  sidebarNavItemVariants,
}

export type {
  SidebarProps,
  SidebarHeaderProps,
  SidebarBrandProps,
  SidebarWordmarkProps,
  SidebarContentProps,
  SidebarFooterProps,
  SidebarNavProps,
  SidebarNavItemProps,
  SidebarCollapseButtonProps,
  SidebarMobileHeaderProps,
  SidebarMobileTriggerProps,
  SidebarMobileDrawerProps,
  SidebarUserSectionProps,
  SidebarUserMenuProps,
}
