/**
 * Advanced Filter Configuration Types
 *
 * Config-driven filter system for declarative filter definitions.
 * Each module defines its filters via configuration, and the
 * AdvancedFiltersSheet renders them automatically.
 */

/* -----------------------------------------------------------------------------
 * Base Types
 * -------------------------------------------------------------------------- */

/**
 * Supported filter types
 */
export type FilterType = 'search' | 'multiSelect' | 'dateRange'

/**
 * Filter placement in the UI
 */
export type FilterPlacement = 'quick' | 'advanced'

/**
 * Base configuration shared by all filter types
 */
interface BaseFilterConfig {
  /** Unique key used for URL params and state */
  key: string
  /** Display label (Spanish) */
  label: string
  /** Where the filter appears: quick bar or advanced panel */
  placement: FilterPlacement
}

/* -----------------------------------------------------------------------------
 * Search Filter
 * -------------------------------------------------------------------------- */

export interface SearchFilterConfig extends BaseFilterConfig {
  type: 'search'
  /** Placeholder text */
  placeholder?: string
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
}

/* -----------------------------------------------------------------------------
 * Multi-Select Filter
 * -------------------------------------------------------------------------- */

export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectFilterConfig extends BaseFilterConfig {
  type: 'multiSelect'
  /** Static options array */
  options: MultiSelectOption[]
}

/* -----------------------------------------------------------------------------
 * Date Range Filter
 * -------------------------------------------------------------------------- */

export interface DateRangeFilterConfig extends BaseFilterConfig {
  type: 'dateRange'
  /** URL param key for "from" date */
  fromKey: string
  /** URL param key for "to" date */
  toKey: string
}

/* -----------------------------------------------------------------------------
 * Filter Config Union
 * -------------------------------------------------------------------------- */

export type FilterConfig =
  | SearchFilterConfig
  | MultiSelectFilterConfig
  | DateRangeFilterConfig

/* -----------------------------------------------------------------------------
 * Filter Panel Configuration
 * -------------------------------------------------------------------------- */

/**
 * Section grouping for advanced filters
 */
export interface FilterSection {
  /** Section title (Spanish) */
  title: string
  /** Optional section description */
  description?: string
  /** Filter keys that belong to this section */
  keys: string[]
}

/**
 * Complete filter panel configuration for a module
 */
export interface FilterPanelConfig {
  /** All filter definitions */
  filters: FilterConfig[]
  /** Optional section grouping for advanced filters panel */
  sections?: FilterSection[]
  /** Custom labels (optional overrides) */
  labels?: {
    moreFilters?: string
    clearAll?: string
    apply?: string
    cancel?: string
  }
}

/* -----------------------------------------------------------------------------
 * Filter Values Type
 * -------------------------------------------------------------------------- */

/**
 * Generic filter values record
 * Keys are filter keys, values are the filter state
 * Allows string, number, or undefined to support URL search params with pagination
 */
export type FilterValues = Record<string, string | number | undefined>

/* -----------------------------------------------------------------------------
 * Helper Types
 * -------------------------------------------------------------------------- */

/**
 * Extract filter keys from a config
 */
export type FilterKeys<T extends FilterPanelConfig> = T['filters'][number]['key']

/**
 * Get filters by placement
 */
export function getFiltersByPlacement(
  filters: FilterConfig[],
  placement: FilterPlacement
): FilterConfig[] {
  return filters.filter((f) => f.placement === placement)
}

/**
 * Get a filter config by key
 */
export function getFilterByKey(
  filters: FilterConfig[],
  key: string
): FilterConfig | undefined {
  return filters.find((f) => f.key === key)
}

/**
 * Count active advanced filters from values
 */
export function countActiveAdvancedFilters(
  filters: FilterConfig[],
  values: FilterValues
): number {
  const advancedFilters = getFiltersByPlacement(filters, 'advanced')
  let count = 0

  for (const filter of advancedFilters) {
    switch (filter.type) {
      case 'search':
      case 'multiSelect':
        if (values[filter.key]) {
          count++
        }
        break
      case 'dateRange':
        if (values[filter.fromKey] || values[filter.toKey]) {
          count++
        }
        break
    }
  }

  return count
}

/**
 * Check if any advanced filters are active
 */
export function hasActiveAdvancedFilters(
  filters: FilterConfig[],
  values: FilterValues
): boolean {
  return countActiveAdvancedFilters(filters, values) > 0
}

/**
 * Get only advanced filter values from a full values object
 */
export function getAdvancedFilterValues(
  filters: FilterConfig[],
  values: FilterValues
): FilterValues {
  const advancedFilters = getFiltersByPlacement(filters, 'advanced')
  const result: FilterValues = {}

  for (const filter of advancedFilters) {
    switch (filter.type) {
      case 'search':
      case 'multiSelect':
        if (values[filter.key] !== undefined) {
          result[filter.key] = values[filter.key]
        }
        break
      case 'dateRange':
        if (values[filter.fromKey] !== undefined) {
          result[filter.fromKey] = values[filter.fromKey]
        }
        if (values[filter.toKey] !== undefined) {
          result[filter.toKey] = values[filter.toKey]
        }
        break
    }
  }

  return result
}

/**
 * Create empty values for advanced filters (for clearing)
 */
export function createEmptyAdvancedFilterValues(
  filters: FilterConfig[]
): FilterValues {
  const advancedFilters = getFiltersByPlacement(filters, 'advanced')
  const result: FilterValues = {}

  for (const filter of advancedFilters) {
    switch (filter.type) {
      case 'search':
      case 'multiSelect':
        result[filter.key] = undefined
        break
      case 'dateRange':
        result[filter.fromKey] = undefined
        result[filter.toKey] = undefined
        break
    }
  }

  return result
}

/**
 * Get all filters (both quick and advanced) - useful for mobile mode
 */
export function getAllFilters(filters: FilterConfig[]): FilterConfig[] {
  return filters
}

/**
 * Create empty values for all filters (quick + advanced) - for mobile mode clearing
 */
export function createEmptyAllFilterValues(
  filters: FilterConfig[]
): FilterValues {
  const result: FilterValues = {}

  for (const filter of filters) {
    switch (filter.type) {
      case 'search':
      case 'multiSelect':
        result[filter.key] = undefined
        break
      case 'dateRange':
        result[filter.fromKey] = undefined
        result[filter.toKey] = undefined
        break
    }
  }

  return result
}

/**
 * Check if any filters (quick or advanced) are active
 */
export function hasActiveFilters(
  filters: FilterConfig[],
  values: FilterValues
): boolean {
  for (const filter of filters) {
    switch (filter.type) {
      case 'search':
      case 'multiSelect':
        if (values[filter.key]) {
          return true
        }
        break
      case 'dateRange':
        if (values[filter.fromKey] || values[filter.toKey]) {
          return true
        }
        break
    }
  }
  return false
}
