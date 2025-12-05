import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * TimelineSkeleton
 * -------------------------------------------------------------------------- */

interface TimelineSkeletonProps {
  /** Number of skeleton items to show */
  count?: number
  /** Additional className */
  className?: string
}

function TimelineSkeletonItem({ isLast }: { isLast: boolean }) {
  return (
    <div className={cn('relative flex gap-4', !isLast && 'pb-6')}>
      {/* Timeline track */}
      <div className="flex flex-col items-center">
        {/* Dot skeleton */}
        <div className="size-6 shrink-0 rounded-full bg-slate-200 animate-pulse" />
        {/* Line skeleton */}
        {!isLast && <div className="mt-1 w-0.5 flex-1 bg-slate-200" />}
      </div>

      {/* Content skeleton */}
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
      </div>
    </div>
  )
}

function TimelineSkeleton({ count = 5, className }: TimelineSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <TimelineSkeletonItem key={index} isLast={index === count - 1} />
      ))}
    </div>
  )
}

TimelineSkeleton.displayName = 'TimelineSkeleton'

export { TimelineSkeleton }
export type { TimelineSkeletonProps }
