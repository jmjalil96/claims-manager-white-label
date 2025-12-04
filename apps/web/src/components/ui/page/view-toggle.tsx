import { List, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'kanban'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
}

/**
 * A segmented toggle for switching between list and kanban views.
 * Desktop-only component - should be hidden on mobile.
 */
export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn(
        'inline-flex rounded-lg border border-slate-200 bg-white p-1',
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'list'}
        aria-label="List view"
        onClick={() => onChange('list')}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
          value === 'list'
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <List size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === 'kanban'}
        aria-label="Kanban view"
        onClick={() => onChange('kanban')}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
          value === 'kanban'
            ? 'bg-slate-100 text-slate-900'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <LayoutGrid size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
