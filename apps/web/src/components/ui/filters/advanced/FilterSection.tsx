import * as React from 'react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * FilterSection
 * -------------------------------------------------------------------------- */

interface FilterSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title: string
  /** Optional description */
  description?: string
  children: React.ReactNode
}

const FilterSection = React.forwardRef<HTMLDivElement, FilterSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        <div>
          <h3 className="text-sm font-medium text-slate-900">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    )
  }
)
FilterSection.displayName = 'FilterSection'

export { FilterSection }
export type { FilterSectionProps }
