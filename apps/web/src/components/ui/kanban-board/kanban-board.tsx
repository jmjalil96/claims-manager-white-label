import * as React from 'react'
import { cn } from '@/lib/utils'
import { KanbanEmptyState } from './kanban-empty-state'
import { KanbanLoadMore } from './kanban-load-more'
import { KanbanBoardSkeleton } from './kanban-skeleton'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface KanbanColumn<TData> {
  count: number
  items: TData[]
  hasMore: boolean
}

export interface KanbanBoardProps<TData, TStatus extends string> {
  /** Ordered array of status keys to display as columns */
  columns: TStatus[]
  /** Data keyed by status */
  data: Record<TStatus, KanbanColumn<TData>>
  /** Render function for each card */
  renderCard: (item: TData) => React.ReactNode
  /** Get display label for column header */
  getColumnLabel: (status: TStatus) => string
  /** Get border color class for column (e.g., 'border-t-blue-500') */
  getColumnColor: (status: TStatus) => string
  /** Key extractor for items */
  keyExtractor: (item: TData) => string | number
  /** Called when "load more" is clicked */
  onLoadMore?: (status: TStatus) => void
  /** Loading state */
  isLoading?: boolean
  /** Custom empty state per column */
  emptyState?: React.ReactNode
  /** Custom skeleton count per column */
  skeletonCount?: number
  /** Column width (default: 340px) */
  columnWidth?: number
  /** Load more button text formatter */
  loadMoreLabel?: (remaining: number) => string
}

/* -----------------------------------------------------------------------------
 * KanbanBoard - Generic kanban board component
 * -------------------------------------------------------------------------- */

function KanbanBoardInner<TData, TStatus extends string>(
  {
    columns,
    data,
    renderCard,
    getColumnLabel,
    getColumnColor,
    keyExtractor,
    onLoadMore,
    isLoading = false,
    emptyState,
    skeletonCount = 3,
    columnWidth = 340,
    loadMoreLabel = (n) => `Load ${n} more`,
  }: KanbanBoardProps<TData, TStatus>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  if (isLoading) {
    return (
      <KanbanBoardSkeleton
        columns={columns}
        columnWidth={columnWidth}
        skeletonCount={skeletonCount}
      />
    )
  }

  return (
    <div ref={ref} className="flex-1 min-h-0 overflow-x-auto pb-4">
      <div className="inline-flex gap-4 h-full px-1">
        {columns.map((status) => {
          const column = data[status]
          return (
            <KanbanColumnComponent
              key={status}
              status={status}
              count={column?.count ?? 0}
              items={column?.items ?? []}
              hasMore={column?.hasMore ?? false}
              renderCard={renderCard}
              keyExtractor={keyExtractor}
              label={getColumnLabel(status)}
              borderColor={getColumnColor(status)}
              onLoadMore={onLoadMore}
              emptyState={emptyState}
              columnWidth={columnWidth}
              loadMoreLabel={loadMoreLabel}
            />
          )
        })}
      </div>
    </div>
  )
}

export const KanbanBoard = Object.assign(
  React.forwardRef(KanbanBoardInner) as <TData, TStatus extends string>(
    props: KanbanBoardProps<TData, TStatus> & { ref?: React.ForwardedRef<HTMLDivElement> }
  ) => React.ReactElement,
  { displayName: 'KanbanBoard' as const }
)

/* -----------------------------------------------------------------------------
 * KanbanColumnComponent - Single column in the kanban board
 * -------------------------------------------------------------------------- */

interface KanbanColumnComponentProps<TData, TStatus extends string> {
  status: TStatus
  count: number
  items: TData[]
  hasMore: boolean
  renderCard: (item: TData) => React.ReactNode
  keyExtractor: (item: TData) => string | number
  label: string
  borderColor: string
  onLoadMore?: (status: TStatus) => void
  emptyState?: React.ReactNode
  columnWidth: number
  loadMoreLabel: (remaining: number) => string
}

function KanbanColumnComponent<TData, TStatus extends string>({
  status,
  count,
  items,
  hasMore,
  renderCard,
  keyExtractor,
  label,
  borderColor,
  onLoadMore,
  emptyState,
  columnWidth,
  loadMoreLabel,
}: KanbanColumnComponentProps<TData, TStatus>) {
  return (
    <div
      className="flex-shrink-0 flex flex-col h-full bg-slate-50/50 rounded-xl border border-slate-200/60 overflow-hidden shadow-sm"
      style={{ width: columnWidth }}
    >
      {/* Column Header */}
      <div
        className={cn(
          'flex-shrink-0 bg-white px-4 py-3 border-b border-slate-100 border-t-4',
          borderColor
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 text-sm">{label}</h3>
          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full border border-slate-200">
            {count}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <div className="space-y-3">
          {items.length === 0 ? (
            emptyState ?? <KanbanEmptyState />
          ) : (
            <>
              {items.map((item) => (
                <React.Fragment key={keyExtractor(item)}>
                  {renderCard(item)}
                </React.Fragment>
              ))}
              {hasMore && (
                <KanbanLoadMore
                  remaining={count - items.length}
                  onClick={() => onLoadMore?.(status)}
                  label={loadMoreLabel}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
