import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/primitives'

/* -----------------------------------------------------------------------------
 * KanbanLoadMore - Load more button for columns
 * -------------------------------------------------------------------------- */

export interface KanbanLoadMoreProps {
  remaining: number
  onClick: () => void
  label: (remaining: number) => string
  isLoading?: boolean
}

export function KanbanLoadMore({
  remaining,
  onClick,
  label,
  isLoading = false,
}: KanbanLoadMoreProps) {
  return (
    <div className="pt-2 pb-1">
      <Button
        variant="outline"
        className="w-full text-xs text-slate-500 h-9 border-dashed border-slate-300 hover:border-slate-400 hover:bg-white"
        onClick={onClick}
        disabled={isLoading}
      >
        <RefreshCw size={12} className={cn('mr-2', isLoading && 'animate-spin')} />
        {label(remaining)}
      </Button>
    </div>
  )
}
