import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface ReadOnlyLinkProps {
  label: string
  value: string | null
  /** Optional href - if provided, value becomes a link */
  href?: string
  emptyText?: string
  className?: string
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export const ReadOnlyLink = React.forwardRef<HTMLDivElement, ReadOnlyLinkProps>(
  ({ label, value, href, emptyText = '—', className }, ref) => {
    const isEmpty = !value || value.trim() === ''

    return (
      <div ref={ref} className={cn('flex-1', className)}>
        {/* Label */}
        <span className="block text-xs text-slate-500 mb-1">{label}</span>

        {/* Value */}
        <div className="px-2 py-1.5 -mx-2">
          {isEmpty ? (
            <span className="text-sm text-slate-400">{emptyText}</span>
          ) : href ? (
            <Link
              to={href}
              className={cn(
                'text-sm font-medium text-teal-600',
                'hover:text-teal-700 hover:underline',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                'transition-colors'
              )}
            >
              {value}
            </Link>
          ) : (
            <span className="text-sm font-medium text-slate-900">{value}</span>
          )}
        </div>
      </div>
    )
  }
)

ReadOnlyLink.displayName = 'ReadOnlyLink'
