import { ClaimStatus, ClaimStatusLabel } from '@claims/shared'
import type { KanbanClaimsResponse } from '@claims/shared'
import { ClaimCard } from './ClaimCard'
import { cn } from '@/lib/utils'
import { Inbox, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* -----------------------------------------------------------------------------
 * KanbanBoard - Claims workflow visualization
 * -------------------------------------------------------------------------- */

interface KanbanBoardProps {
  data?: KanbanClaimsResponse
  isLoading: boolean
}

// Column order matching backend KANBAN_STATUS_ORDER
const COLUMN_ORDER: ClaimStatus[] = [
  ClaimStatus.DRAFT,
  ClaimStatus.VALIDATION,
  ClaimStatus.SUBMITTED,
  ClaimStatus.PENDING_INFO,
  ClaimStatus.RETURNED,
  ClaimStatus.SETTLED,
  ClaimStatus.CANCELLED,
]

// Status to top-border color mapping (matches ClaimCard logic)
const statusBorderColorMap: Record<ClaimStatus, string> = {
  DRAFT: 'border-t-slate-300',
  VALIDATION: 'border-t-blue-500',
  SUBMITTED: 'border-t-slate-400',
  PENDING_INFO: 'border-t-amber-500',
  RETURNED: 'border-t-red-500',
  SETTLED: 'border-t-green-500',
  CANCELLED: 'border-t-slate-300',
}

export function KanbanBoard({ data, isLoading }: KanbanBoardProps) {
  if (isLoading) {
    return <KanbanBoardSkeleton />
  }

  if (!data) {
    return null
  }

  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="inline-flex gap-4 h-full px-1">
        {COLUMN_ORDER.map((status) => {
          const column = data.columns[status]
          return (
            <KanbanColumn
              key={status}
              status={status}
              count={column?.count ?? 0}
              claims={column?.claims ?? []}
            />
          )
        })}
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * KanbanColumn - Single status column
 * -------------------------------------------------------------------------- */

interface KanbanColumnProps {
  status: ClaimStatus
  count: number
  claims: KanbanClaimsResponse['columns'][ClaimStatus]['claims']
}

function KanbanColumn({ status, count, claims }: KanbanColumnProps) {
  const borderColor = statusBorderColorMap[status]
  const hasMore = count > claims.length

  return (
    <div className="w-[340px] flex-shrink-0 flex flex-col h-full max-h-[calc(100vh-16rem)] bg-slate-50/50 rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
      {/* Column Header */}
      <div
        className={cn(
          'flex-shrink-0 bg-white px-4 py-3 border-b border-slate-100 border-t-4',
          borderColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-700 text-sm">
              {ClaimStatusLabel[status]}
            </h3>
          </div>
          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full border border-slate-200">
            {count}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <div className="space-y-3">
          {claims.length === 0 ? (
            <EmptyColumnState />
          ) : (
            <>
              {claims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
              {hasMore && (
                <div className="pt-2 pb-1">
                  <Button
                    variant="outline"
                    className="w-full text-xs text-slate-500 h-9 border-dashed border-slate-300 hover:border-slate-400 hover:bg-white"
                  >
                    <RefreshCw size={12} className="mr-2" />
                    Ver {count - claims.length} más
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * Empty State - Visual placeholder
 * -------------------------------------------------------------------------- */

function EmptyColumnState() {
  return (
    <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50/50">
      <Inbox size={24} className="opacity-50" />
      <span className="text-xs font-medium">Sin reclamos</span>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * KanbanBoardSkeleton - Loading state
 * -------------------------------------------------------------------------- */

function KanbanBoardSkeleton() {
  return (
    <div className="h-full overflow-x-auto pb-4">
      <div className="inline-flex gap-4 h-full px-1">
        {COLUMN_ORDER.map((status) => (
          <div
            key={status}
            className="w-[340px] flex-shrink-0 flex flex-col h-full max-h-[calc(100vh-16rem)] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
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
              {[1, 2, 3].map((i) => (
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

KanbanBoard.displayName = 'KanbanBoard'
