import { SlidersHorizontal, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterChips, type FilterChip } from './FilterChips'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  search?: React.ReactNode
  quickFilters?: React.ReactNode
  chips: FilterChip[]
  onClearAll?: () => void
  moreFiltersCount?: number
  /** Total filter count for mobile badge (quick + advanced) */
  totalFilterCount?: number
  onMoreFilters?: () => void
  className?: string
}

export function FilterBar({
  search,
  quickFilters,
  chips,
  onClearAll,
  moreFiltersCount = 0,
  totalFilterCount,
  onMoreFilters,
  className,
}: FilterBarProps) {
  const hasSearch = !!search
  const hasQuickFilters = !!quickFilters
  const showMoreButton = !!onMoreFilters

  // For mobile badge, use totalFilterCount if provided, otherwise fallback to chips length
  const mobileFilterCount = totalFilterCount ?? chips.length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Filter controls row */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        {/* Search slot - always visible */}
        {hasSearch && search}

        {/* Divider between search and filters - hidden on mobile */}
        {hasSearch && hasQuickFilters && (
          <div className="hidden md:block h-6 w-px bg-slate-200" aria-hidden="true" />
        )}

        {/* Quick filters slot - hidden on mobile */}
        {hasQuickFilters && (
          <div className="hidden md:flex items-center gap-2">{quickFilters}</div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mobile filter button - visible only on mobile */}
        {showMoreButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMoreFilters}
            className="md:hidden relative"
            aria-label="Filtros"
          >
            <Filter size={18} />
            {mobileFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-medium text-white">
                {mobileFilterCount}
              </span>
            )}
          </Button>
        )}

        {/* Desktop more filters button - hidden on mobile */}
        {showMoreButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMoreFilters}
            leftIcon={<SlidersHorizontal size={16} />}
            className="hidden md:inline-flex"
          >
            Más filtros
            {moreFiltersCount > 0 && (
              <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-700">
                +{moreFiltersCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Filter chips row - horizontal scroll on mobile */}
      <FilterChips chips={chips} onClearAll={onClearAll} />
    </div>
  )
}
