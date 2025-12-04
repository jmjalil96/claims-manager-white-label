import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

/* -----------------------------------------------------------------------------
 * CardListEmpty
 * -------------------------------------------------------------------------- */

interface CardListEmptyProps {
  /** Icon to display */
  icon?: React.ReactNode
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** Action button or link */
  action?: React.ReactNode
  /** Additional className */
  className?: string
}

function CardListEmpty({
  icon,
  title = 'No hay resultados',
  description,
  action,
  className,
}: CardListEmptyProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-8 text-center',
        className
      )}
    >
      {/* Icon */}
      <div className="flex justify-center mb-3">
        {icon ?? (
          <Inbox
            size={40}
            className="text-slate-300"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-slate-900 mb-1">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-500 mb-4">{description}</p>
      )}

      {/* Action */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

CardListEmpty.displayName = 'CardListEmpty'

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CardListEmpty }
export type { CardListEmptyProps }
