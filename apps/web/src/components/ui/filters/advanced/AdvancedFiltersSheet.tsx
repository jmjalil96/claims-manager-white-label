import * as React from 'react'
import { SlidersHorizontal, Filter } from 'lucide-react'
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MultiSelect } from '../MultiSelect'
import { DateRangePicker } from '../DateRangePicker'
import type {
  FilterPanelConfig,
  FilterConfig,
  FilterValues,
  MultiSelectFilterConfig,
  DateRangeFilterConfig,
} from './types'
import {
  getFiltersByPlacement,
  hasActiveAdvancedFilters,
  hasActiveFilters,
  createEmptyAdvancedFilterValues,
  createEmptyAllFilterValues,
} from './types'

/* -----------------------------------------------------------------------------
 * AdvancedFiltersSheet
 * -------------------------------------------------------------------------- */

interface AdvancedFiltersSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Filter panel configuration */
  config: FilterPanelConfig
  /** Current filter values (from URL) */
  values: FilterValues
  /** Callback when filters are applied */
  onApply: (values: FilterValues) => void
  /** Mode: desktop shows only advanced filters, mobile shows ALL filters */
  mode?: 'desktop' | 'mobile'
}

export function AdvancedFiltersSheet({
  open,
  onOpenChange,
  config,
  values,
  onApply,
  mode = 'desktop',
}: AdvancedFiltersSheetProps) {
  // Draft state - changes are only committed on Apply
  const [draft, setDraft] = React.useState<FilterValues>({})

  const isMobileMode = mode === 'mobile'

  // Get filters based on mode
  // Mobile: all filters (quick + advanced)
  // Desktop: only advanced filters
  const activeFilters = React.useMemo(
    () => isMobileMode ? config.filters : getFiltersByPlacement(config.filters, 'advanced'),
    [config.filters, isMobileMode]
  )

  // Initialize draft when sheet opens
  React.useEffect(() => {
    if (open) {
      // Copy current values to draft
      const draftValues: FilterValues = {}
      for (const filter of activeFilters) {
        switch (filter.type) {
          case 'multiSelect':
            draftValues[filter.key] = values[filter.key]
            break
          case 'dateRange':
            draftValues[filter.fromKey] = values[filter.fromKey]
            draftValues[filter.toKey] = values[filter.toKey]
            break
        }
      }
      setDraft(draftValues)
    }
  }, [open, values, activeFilters])

  // Check if draft has active filters
  const hasActiveDraftFilters = React.useMemo(
    () => isMobileMode
      ? hasActiveFilters(config.filters, draft)
      : hasActiveAdvancedFilters(config.filters, draft),
    [config.filters, draft, isMobileMode]
  )

  // Count changes for Apply button badge
  const changesCount = React.useMemo(() => {
    let count = 0
    Object.keys(draft).forEach(key => {
      if (draft[key] !== values[key]) count++
    })
    return count
  }, [draft, values])

  // Update draft value
  const updateDraft = React.useCallback((key: string, value: string | undefined) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Handle apply
  const handleApply = () => {
    onApply(draft)
    onOpenChange(false)
  }

  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false)
  }

  // Handle clear all
  const handleClear = () => {
    setDraft(
      isMobileMode
        ? createEmptyAllFilterValues(config.filters)
        : createEmptyAdvancedFilterValues(config.filters)
    )
  }

  // Get labels
  const labels = {
    apply: config.labels?.apply ?? 'Aplicar',
    cancel: config.labels?.cancel ?? 'Cancelar',
    clearAll: config.labels?.clearAll ?? 'Limpiar filtros',
  }

  // Title based on mode
  const title = isMobileMode ? 'Filtros' : 'Filtros Avanzados'
  const subtitle = isMobileMode
    ? 'Configura los criterios de búsqueda'
    : 'Opciones avanzadas de filtrado'
  const TitleIcon = isMobileMode ? Filter : SlidersHorizontal

  // Render individual filter based on type
  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'multiSelect':
        return renderMultiSelect(filter)
      case 'dateRange':
        return renderDateRange(filter)
      default:
        return null
    }
  }

  // Render MultiSelect filter
  const renderMultiSelect = (filter: MultiSelectFilterConfig) => {
    const currentValue = draft[filter.key]
    const valueStr = typeof currentValue === 'string' ? currentValue : undefined
    const selectedValues = valueStr?.split(',').filter(Boolean) ?? []

    return (
      <div key={filter.key} className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{filter.label}</label>
        <MultiSelect
          label={filter.label}
          options={filter.options}
          value={selectedValues}
          onChange={(values) =>
            updateDraft(filter.key, values.length > 0 ? values.join(',') : undefined)
          }
          className="w-full"
        />
      </div>
    )
  }

  // Render DateRange filter
  const renderDateRange = (filter: DateRangeFilterConfig) => {
    const fromValue = draft[filter.fromKey]
    const toValue = draft[filter.toKey]

    return (
      <div key={filter.key} className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{filter.label}</label>
        <DateRangePicker
          label={filter.label}
          fromValue={typeof fromValue === 'string' ? fromValue : undefined}
          toValue={typeof toValue === 'string' ? toValue : undefined}
          onChange={(from, to) => {
            updateDraft(filter.fromKey, from)
            updateDraft(filter.toKey, to)
          }}
          className="w-full"
        />
      </div>
    )
  }

  // Render section with uppercase header
  const renderSection = (sectionTitle: string, description: string | undefined, filters: FilterConfig[]) => {
    if (filters.length === 0) return null

    return (
      <div key={sectionTitle} className="p-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          {sectionTitle}
          {description && (
            <span className="text-[10px] font-normal normal-case bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              {description}
            </span>
          )}
        </h4>
        <div className="grid gap-5">
          {filters.map((filter) => renderFilter(filter))}
        </div>
      </div>
    )
  }

  // Group filters by section if sections are defined
  const renderFilters = () => {
    // Mobile mode: render all filters in groups
    if (isMobileMode) {
      const quickFilters = getFiltersByPlacement(config.filters, 'quick')
      const advancedFilters = getFiltersByPlacement(config.filters, 'advanced')

      return (
        <div className="flex flex-col divide-y divide-slate-100">
          {quickFilters.length > 0 && renderSection('Filtros Rápidos', undefined, quickFilters)}
          {advancedFilters.length > 0 && renderSection('Filtros Avanzados', undefined, advancedFilters)}
        </div>
      )
    }

    // Desktop mode: use sections if defined
    if (config.sections && config.sections.length > 0) {
      return (
        <div className="flex flex-col divide-y divide-slate-100">
          {config.sections.map((section) => {
            const sectionFilters = section.keys
              .map((key) => activeFilters.find((f) => f.key === key))
              .filter((f): f is FilterConfig => f !== undefined)

            return renderSection(section.title, section.description, sectionFilters)
          })}
        </div>
      )
    }

    // No sections defined - render all advanced filters in a single group
    return (
      <div className="p-6">
        <div className="grid gap-5">
          {activeFilters.map((filter) => renderFilter(filter))}
        </div>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} size="md">
      <SheetHeader className="bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-md border border-slate-200 shadow-sm">
            <TitleIcon size={18} className="text-teal-600" aria-hidden="true" />
          </div>
          <div>
            <SheetTitle>{title}</SheetTitle>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
      </SheetHeader>

      <SheetBody className="p-0">
        {renderFilters()}
      </SheetBody>

      <SheetFooter className="bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!hasActiveDraftFilters}
            className="text-slate-500 hover:text-red-600 hover:bg-red-50"
          >
            {labels.clearAll}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {labels.cancel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApply}
              className={cn(
                'min-w-[100px]',
                changesCount > 0 && 'ring-2 ring-teal-500/20 ring-offset-1'
              )}
            >
              {labels.apply}
              {changesCount > 0 && (
                <span className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {changesCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </SheetFooter>
    </Sheet>
  )
}
