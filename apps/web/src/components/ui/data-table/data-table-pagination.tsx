import type { Table } from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pageSizeOptions?: number[]
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100],
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()
  const totalRows = table.getRowCount() ?? table.getFilteredRowModel().rows.length

  // Calculate showing range
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalRows)

  // Generate page numbers with ellipsis
  const pageNumbers = getPageNumbers(pageIndex + 1, pageCount)

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
      {/* Left: Info + Page Size */}
      <div className="flex items-center gap-6">
        <p className="text-sm text-slate-600">
          Showing <span className="font-medium text-slate-900">{from}</span>
          {' '}-{' '}
          <span className="font-medium text-slate-900">{to}</span>
          {' '}of{' '}
          <span className="font-medium text-slate-900">{totalRows}</span>
        </p>

        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className={cn(
              'h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent',
              'cursor-pointer appearance-none'
            )}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Right: Navigation */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <NavButton
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </NavButton>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, idx) =>
            page === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center h-9 w-9 text-slate-400 text-sm"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <PageButton
                key={page}
                page={page}
                isActive={page === pageIndex + 1}
                onClick={() => table.setPageIndex(page - 1)}
              />
            )
          )}
        </div>

        {/* Mobile: Page indicator */}
        <span className="sm:hidden px-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{pageIndex + 1}</span>
          {' / '}
          <span className="font-medium text-slate-900">{pageCount || 1}</span>
        </span>

        {/* Next */}
        <NavButton
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </NavButton>
      </div>
    </div>
  )
}

/** Navigation button (prev/next) */
function NavButton({
  children,
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode
  disabled: boolean
  onClick: () => void
  'aria-label': string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center h-9 w-9 rounded-lg',
        'border border-slate-200 bg-white text-slate-600',
        'hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200',
        'transition-colors'
      )}
    >
      {children}
    </button>
  )
}

/** Page number button */
function PageButton({
  page,
  isActive,
  onClick,
}: {
  page: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-lg text-sm font-medium',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1',
        'transition-colors',
        isActive
          ? 'bg-teal-600 text-white hover:bg-teal-700'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
      )}
    >
      {page}
    </button>
  )
}

/**
 * Generate page numbers with ellipsis
 * - Total ≤ 7: Show all
 * - Current near start: [1][2][3][4][5]...[last]
 * - Current near end: [1]...[n-4][n-3][n-2][n-1][n]
 * - Current in middle: [1]...[c-1][c][c+1]...[last]
 */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  // Always show first page
  pages.push(1)

  if (current <= 4) {
    // Near start: 1 2 3 4 5 ... last
    pages.push(2, 3, 4, 5)
    pages.push('ellipsis')
    pages.push(total)
  } else if (current >= total - 3) {
    // Near end: 1 ... n-4 n-3 n-2 n-1 n
    pages.push('ellipsis')
    pages.push(total - 4, total - 3, total - 2, total - 1, total)
  } else {
    // Middle: 1 ... c-1 c c+1 ... last
    pages.push('ellipsis')
    pages.push(current - 1, current, current + 1)
    pages.push('ellipsis')
    pages.push(total)
  }

  return pages
}
