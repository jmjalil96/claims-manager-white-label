import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface RowAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

interface DataTableRowActionsProps {
  actions: RowAction[]
  label?: string
}

const menuItemStyles = cn(
  'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md outline-none cursor-pointer transition-colors',
  'text-slate-700 hover:bg-slate-100 focus:bg-slate-100',
  'data-[highlighted]:bg-slate-100',
  'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed'
)

const destructiveStyles = cn(
  'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md outline-none cursor-pointer transition-colors',
  'text-red-600 hover:bg-red-50 focus:bg-red-50',
  'data-[highlighted]:bg-red-50',
  'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed'
)

export function DataTableRowActions({ actions, label = 'Actions' }: DataTableRowActionsProps) {
  if (actions.length === 0) return null

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center h-8 w-8 rounded-md',
            'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2'
          )}
          aria-label={label}
        >
          <MoreVertical size={18} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className={cn(
            'z-50 min-w-[160px] bg-white border border-slate-200 rounded-lg p-1 shadow-lg',
            'animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2'
          )}
        >
          {actions.map((action, index) => (
            <DropdownMenu.Item
              key={index}
              onSelect={action.onClick}
              disabled={action.disabled}
              className={action.variant === 'destructive' ? destructiveStyles : menuItemStyles}
            >
              {action.icon && <span aria-hidden="true">{action.icon}</span>}
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
