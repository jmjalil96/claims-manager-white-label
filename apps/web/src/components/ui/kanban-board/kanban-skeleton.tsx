/* -----------------------------------------------------------------------------
 * KanbanBoardSkeleton - Loading state for kanban board
 * -------------------------------------------------------------------------- */

export interface KanbanBoardSkeletonProps<TStatus extends string> {
  columns: TStatus[]
  columnWidth?: number
  skeletonCount?: number
}

export function KanbanBoardSkeleton<TStatus extends string>({
  columns,
  columnWidth = 340,
  skeletonCount = 3,
}: KanbanBoardSkeletonProps<TStatus>) {
  return (
    <div className="flex-1 min-h-0 overflow-x-auto pb-4">
      <div className="inline-flex gap-4 h-full px-1">
        {columns.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
            style={{ width: columnWidth }}
          >
            {/* Header skeleton */}
            <div className="px-4 py-3 bg-white border-b border-slate-100 border-t-4 border-t-slate-200">
              <div className="flex items-center justify-between animate-pulse">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-5 w-8 bg-slate-200 rounded-full" />
              </div>
            </div>
            {/* Cards skeleton */}
            <div className="flex-1 p-3 space-y-3">
              {Array.from({ length: skeletonCount }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-slate-200 h-32 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
