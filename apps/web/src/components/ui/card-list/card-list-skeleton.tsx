import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * CardListSkeleton
 * -------------------------------------------------------------------------- */

interface CardListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number
  /** Additional className */
  className?: string
}

function CardListSkeleton({ count = 5, className }: CardListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'rounded-lg border border-slate-200 bg-white p-4 animate-pulse',
            className
          )}
        >
          {/* Header row: badge + amount */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
            <div className="h-5 w-16 bg-slate-200 rounded" />
          </div>

          {/* Title row */}
          <div className="h-5 w-32 bg-slate-200 rounded mb-3" />

          {/* Divider */}
          <div className="h-px w-full bg-slate-100 my-3" />

          {/* Body rows */}
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="flex gap-2">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-20 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

CardListSkeleton.displayName = 'CardListSkeleton'

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CardListSkeleton }
export type { CardListSkeletonProps }
