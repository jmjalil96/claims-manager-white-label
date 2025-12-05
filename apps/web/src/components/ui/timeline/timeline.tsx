import * as React from 'react'
import { cn } from '@/lib/utils'
import { TimelineSkeleton } from './timeline-skeleton'
import { TimelineEmpty } from './timeline-empty'

/* -----------------------------------------------------------------------------
 * Timeline Container
 * -------------------------------------------------------------------------- */

interface TimelineProps {
  /** Timeline items (should be TimelineItem components) */
  children?: React.ReactNode
  /** Loading state */
  isLoading?: boolean
  /** Number of skeleton items to show when loading */
  loadingCount?: number
  /** Whether to show empty state when no children */
  isEmpty?: boolean
  /** Custom empty state */
  emptyState?: React.ReactNode
  /** Additional className */
  className?: string
}

function Timeline({
  children,
  isLoading = false,
  loadingCount = 5,
  isEmpty = false,
  emptyState,
  className,
}: TimelineProps) {
  // Loading state
  if (isLoading) {
    return <TimelineSkeleton count={loadingCount} className={className} />
  }

  // Empty state
  if (isEmpty || React.Children.count(children) === 0) {
    return <>{emptyState ?? <TimelineEmpty className={className} />}</>
  }

  // Render timeline
  return <div className={cn(className)}>{children}</div>
}

Timeline.displayName = 'Timeline'

export { Timeline }
export type { TimelineProps }
