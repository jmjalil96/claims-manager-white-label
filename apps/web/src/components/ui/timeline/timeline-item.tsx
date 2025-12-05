import * as React from 'react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export type TimelineVariant = 'default' | 'primary' | 'muted' | 'destructive'

interface VariantConfig {
  dot: string
  icon: string
}

const variantStyles: Record<TimelineVariant, VariantConfig> = {
  default: {
    dot: 'bg-slate-100 border-slate-200',
    icon: 'text-slate-500',
  },
  primary: {
    dot: 'bg-teal-50 border-teal-200',
    icon: 'text-teal-600',
  },
  muted: {
    dot: 'bg-slate-50 border-slate-200',
    icon: 'text-slate-400',
  },
  destructive: {
    dot: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
  },
}

/* -----------------------------------------------------------------------------
 * TimelineItem (Enterprise CRM Style - minimal, no cards)
 * -------------------------------------------------------------------------- */

interface TimelineItemProps {
  /** Icon to display in the dot (renders inside, should be small ~12px) */
  icon?: React.ReactNode
  /** Color variant for the dot */
  variant?: TimelineVariant
  /** Whether this is the last item (hides connecting line) */
  isLast?: boolean
  /** Content to render */
  children: React.ReactNode
  /** Additional className for the container */
  className?: string
}

function TimelineItem({
  icon,
  variant = 'default',
  isLast = false,
  children,
  className,
}: TimelineItemProps) {
  const styles = variantStyles[variant]

  return (
    <div className={cn('relative flex gap-3', !isLast && 'pb-5', className)}>
      {/* Timeline track (dot + line) */}
      <div className="flex flex-col items-center">
        {/* Smaller dot */}
        <div
          className={cn(
            'relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border',
            styles.dot
          )}
        >
          {icon ? (
            <span className={cn('flex items-center justify-center', styles.icon)}>{icon}</span>
          ) : (
            <div className="size-1.5 rounded-full bg-current opacity-50" />
          )}
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div className="mt-1 w-px flex-1 bg-slate-200" />
        )}
      </div>

      {/* Content - no card wrapper, just content */}
      <div className="flex-1 min-w-0 -mt-0.5">
        {children}
      </div>
    </div>
  )
}

TimelineItem.displayName = 'TimelineItem'

export { TimelineItem }
export type { TimelineItemProps }
