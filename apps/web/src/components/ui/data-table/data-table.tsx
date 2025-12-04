import {
  flexRender,
  type Table as TanStackTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** TanStack Table's default column width when no explicit size is set */
const TANSTACK_DEFAULT_COLUMN_WIDTH = 150

interface DataTableProps<TData> {
  table: TanStackTable<TData>
  isLoading?: boolean
  /** Empty state: string for simple message, ReactNode for custom component */
  emptyState?: React.ReactNode
  /** Minimum table width for horizontal scroll (default: 800px) */
  minWidth?: number
  /** Render pagination inside the table container */
  pagination?: React.ReactNode
  /** Max height for scrollable container */
  maxHeight?: string
}

export function DataTable<TData>({
  table,
  isLoading = false,
  emptyState = 'No results found.',
  minWidth = 800,
  pagination,
  maxHeight,
}: DataTableProps<TData>) {
  const columnCount = table.getAllColumns().length
  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-slate-200 overflow-hidden bg-white',
        !maxHeight && 'flex-1 min-h-0'
      )}
      style={{ maxHeight }}
    >
      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto min-h-0">
        <table
          className="text-sm"
          style={{ minWidth: `${minWidth}px` }}
          role="grid"
          aria-busy={isLoading}
        >
          <thead className="bg-slate-800 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()

                    return (
                      <th
                        key={header.id}
                        scope="col"
                        style={{ width: header.getSize() !== TANSTACK_DEFAULT_COLUMN_WIDTH ? header.getSize() : undefined }}
                        className={cn(
                          'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-100 whitespace-nowrap',
                          canSort && 'cursor-pointer select-none'
                        )}
                        aria-sort={
                          sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : 'none'
                        }
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        onKeyDown={
                          canSort
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  header.column.getToggleSortingHandler()?.(e)
                                }
                              }
                            : undefined
                        }
                        tabIndex={canSort ? 0 : undefined}
                      >
                        <div className="flex items-center gap-1.5">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIcon direction={sorted} />}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <SkeletonRows columns={columnCount} />
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    className={typeof emptyState === 'string' ? 'py-12 text-center text-slate-500' : 'p-0'}
                  >
                    {typeof emptyState === 'string' ? (
                      emptyState
                    ) : (
                      <div className="py-12 flex justify-center">{emptyState}</div>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-teal-50/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{ width: cell.column.getSize() !== TANSTACK_DEFAULT_COLUMN_WIDTH ? cell.column.getSize() : undefined }}
                        className="px-4 py-3 text-slate-700 whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Pagination - fixed at bottom, doesn't scroll horizontally */}
      {pagination && (
        <div className="flex-shrink-0">
          {pagination}
        </div>
      )}
    </div>
  )
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') {
    return <ArrowUp size={14} className="text-teal-400 transition-colors" aria-hidden="true" />
  }
  if (direction === 'desc') {
    return <ArrowDown size={14} className="text-teal-400 transition-colors" aria-hidden="true" />
  }
  return <ArrowUpDown size={14} className="text-slate-400 transition-colors" aria-hidden="true" />
}

function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 rounded bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export type { SortingState }
