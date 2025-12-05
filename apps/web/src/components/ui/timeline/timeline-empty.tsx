import { History } from 'lucide-react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * TimelineEmpty
 * -------------------------------------------------------------------------- */

interface TimelineEmptyProps {
  /** Icon to display */
  icon?: React.ReactNode
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** Additional className */
  className?: string
}

function TimelineEmpty({
  icon,
  title = 'Sin historial',
  description,
  className,
}: TimelineEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center',
        className
      )}
    >
      <div className="mb-3 text-slate-300">
        {icon ?? <History className="size-10" />}
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      )}
    </div>
  )
}

TimelineEmpty.displayName = 'TimelineEmpty'

export { TimelineEmpty }
export type { TimelineEmptyProps }
