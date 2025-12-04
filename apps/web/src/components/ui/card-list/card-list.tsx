import * as React from 'react'
import { cn } from '@/lib/utils'
import { CardListSkeleton } from './card-list-skeleton'
import { CardListEmpty } from './card-list-empty'

/* -----------------------------------------------------------------------------
 * CardList Container
 * -------------------------------------------------------------------------- */

interface CardListProps<TData> {
  /** Data array to render */
  data: TData[]
  /** Render function for each item */
  renderItem: (item: TData, index: number) => React.ReactNode
  /** Key extractor function */
  keyExtractor?: (item: TData, index: number) => string | number
  /** Loading state */
  isLoading?: boolean
  /** Number of skeleton items to show when loading */
  loadingCount?: number
  /** Custom empty state */
  emptyState?: React.ReactNode
  /** Additional className */
  className?: string
}

function CardList<TData>({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  loadingCount = 5,
  emptyState,
  className,
}: CardListProps<TData>) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <CardListSkeleton count={loadingCount} />
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return emptyState ?? <CardListEmpty />
  }

  // Render items
  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor?.(item, index) ?? index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </div>
  )
}

CardList.displayName = 'CardList'

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CardList }
export type { CardListProps }
