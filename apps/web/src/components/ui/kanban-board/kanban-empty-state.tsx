import * as React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * KanbanEmptyState - Empty column placeholder
 * -------------------------------------------------------------------------- */

export interface KanbanEmptyStateProps {
  icon?: React.ReactNode
  message?: string
  className?: string
}

export function KanbanEmptyState({
  icon,
  message = 'No items',
  className,
}: KanbanEmptyStateProps) {
  return (
    <div
      className={cn(
        'h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50',
        className
      )}
    >
      {icon ?? <Inbox size={24} className="opacity-50" />}
      <span className="text-xs font-medium">{message}</span>
    </div>
  )
}
