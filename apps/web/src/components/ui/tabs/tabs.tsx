import * as React from 'react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Tabs Context
 * -------------------------------------------------------------------------- */

type TabsVariant = 'pill' | 'line'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  variant: TabsVariant
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

/* -----------------------------------------------------------------------------
 * Tabs Root
 * -------------------------------------------------------------------------- */

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  variant?: TabsVariant
  className?: string
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onValueChange, children, variant = 'pill', className }, ref) => {
    return (
      <TabsContext.Provider value={{ value, onValueChange, variant }}>
        <div ref={ref} className={className}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

/* -----------------------------------------------------------------------------
 * TabsList
 * -------------------------------------------------------------------------- */

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className, ...props }, ref) => {
    const { variant } = useTabsContext()

    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          variant === 'pill'
            ? 'inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1'
            : 'flex items-center gap-6 border-b border-slate-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

/* -----------------------------------------------------------------------------
 * TabsTrigger
 * -------------------------------------------------------------------------- */

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
  icon?: React.ReactNode
  badge?: number | string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, className, disabled, icon, badge, ...props }, ref) => {
    const { value: selectedValue, onValueChange, variant } = useTabsContext()
    const isSelected = selectedValue === value

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isSelected}
        disabled={disabled}
        onClick={() => onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variant === 'pill'
            ? cn(
                'px-3 py-1.5 text-sm font-medium rounded-md',
                isSelected
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )
            : cn(
                'group py-3 text-sm font-medium border-b-2 -mb-px px-1',
                isSelected
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              ),
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className={cn(
                'size-4 shrink-0 flex items-center justify-center',
                isSelected
                  ? variant === 'line' ? 'text-teal-600' : 'text-slate-900'
                  : 'text-slate-400 group-hover:text-slate-500'
              )}
            >
              {icon}
            </span>
          )}
          <span className="truncate">{children}</span>
          {badge !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none min-w-[20px]',
                variant === 'pill'
                  ? isSelected ? 'bg-slate-200 text-slate-900' : 'bg-slate-200 text-slate-600'
                  : isSelected ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
              )}
            >
              {badge}
            </span>
          )}
        </div>
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

/* -----------------------------------------------------------------------------
 * TabsContent
 * -------------------------------------------------------------------------- */

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext()
    const isSelected = selectedValue === value

    if (!isSelected) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        className={cn('focus-visible:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = 'TabsContent'

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps }
