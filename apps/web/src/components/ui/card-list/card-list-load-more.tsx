import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

/* -----------------------------------------------------------------------------
 * CardListLoadMore
 * -------------------------------------------------------------------------- */

interface CardListLoadMoreProps {
  /** Handler when "Load More" is clicked */
  onLoadMore: () => void
  /** Loading state */
  isLoading?: boolean
  /** Whether there are more items to load */
  hasMore: boolean
  /** Current number of items displayed */
  currentCount: number
  /** Total number of items available */
  totalCount: number
  /** Additional className */
  className?: string
}

function CardListLoadMore({
  onLoadMore,
  isLoading = false,
  hasMore,
  currentCount,
  totalCount,
  className,
}: CardListLoadMoreProps) {
  // Don't render if no items or no more to load
  if (totalCount === 0 || !hasMore) {
    return null
  }

  return (
    <div
      className={cn(
        'mt-4 flex flex-col items-center gap-2 py-4',
        className
      )}
    >
      {/* Count indicator */}
      <p className="text-sm text-slate-500">
        Mostrando{' '}
        <span className="font-medium text-slate-700">{currentCount}</span>
        {' '}de{' '}
        <span className="font-medium text-slate-700">{totalCount}</span>
      </p>

      {/* Load more button */}
      <Button
        variant="outline"
        size="md"
        onClick={onLoadMore}
        disabled={isLoading}
        className="min-w-[140px]"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Cargando...
          </>
        ) : (
          'Cargar más'
        )}
      </Button>
    </div>
  )
}

CardListLoadMore.displayName = 'CardListLoadMore'

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CardListLoadMore }
export type { CardListLoadMoreProps }
