import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from './filter-bar'
import type { FilterChip } from './filter-chips'

// =============================================================================
// TEST HELPERS
// =============================================================================

function createMockChip(overrides: Partial<FilterChip> = {}): FilterChip {
  const key = overrides.key ?? 'test-key'
  return {
    key,
    label: 'Status',
    value: 'Draft',
    onRemove: vi.fn(),
    ...overrides,
  }
}

// =============================================================================
// RENDERING TESTS
// =============================================================================

describe('FilterBar', () => {
  describe('rendering', () => {
    it('renders nothing when chips array is empty', () => {
      render(<FilterBar chips={[]} />)

      // FilterChips returns null when empty, but FilterBar wrapper still renders
      expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument()
      expect(screen.queryByText('Limpiar todo')).not.toBeInTheDocument()
    })

    it('renders filter chips with label and value', () => {
      const chips = [
        createMockChip({ key: '1', label: 'Status', value: 'Draft' }),
        createMockChip({ key: '2', label: 'Client', value: 'Acme Corp' }),
      ]

      render(<FilterBar chips={chips} />)

      expect(screen.getByText('Status:')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Client:')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    it('renders search slot when provided', () => {
      render(
        <FilterBar
          chips={[]}
          search={<input data-testid="search-input" placeholder="Search..." />}
        />
      )

      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })

    it('renders quick filters slot when provided', () => {
      render(
        <FilterBar
          chips={[]}
          quickFilters={<button data-testid="quick-filter">Filter</button>}
        />
      )

      expect(screen.getByTestId('quick-filter')).toBeInTheDocument()
    })
  })

  // =============================================================================
  // INTERACTION TESTS
  // =============================================================================

  describe('interactions', () => {
    it('calls onRemove when chip remove button is clicked', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      const chips = [createMockChip({ onRemove })]

      render(<FilterBar chips={chips} />)

      const removeButton = screen.getByRole('button', { name: /remover filtro status/i })
      await user.click(removeButton)

      expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it('shows clear all button when onClearAll is provided', () => {
      const onClearAll = vi.fn()
      const chips = [createMockChip()]

      render(<FilterBar chips={chips} onClearAll={onClearAll} />)

      expect(screen.getByText('Limpiar todo')).toBeInTheDocument()
    })

    it('does not show clear all button when onClearAll is not provided', () => {
      const chips = [createMockChip()]

      render(<FilterBar chips={chips} />)

      expect(screen.queryByText('Limpiar todo')).not.toBeInTheDocument()
    })

    it('calls onClearAll when clear all button is clicked', async () => {
      const user = userEvent.setup()
      const onClearAll = vi.fn()
      const chips = [createMockChip()]

      render(<FilterBar chips={chips} onClearAll={onClearAll} />)

      await user.click(screen.getByText('Limpiar todo'))

      expect(onClearAll).toHaveBeenCalledTimes(1)
    })
  })

  // =============================================================================
  // MORE FILTERS BUTTON TESTS
  // =============================================================================

  describe('more filters button', () => {
    it('renders more filters button when onMoreFilters is provided', () => {
      const onMoreFilters = vi.fn()

      render(<FilterBar chips={[]} onMoreFilters={onMoreFilters} />)

      expect(screen.getByText('Más filtros')).toBeInTheDocument()
    })

    it('does not render more filters button when onMoreFilters is not provided', () => {
      render(<FilterBar chips={[]} />)

      expect(screen.queryByText('Más filtros')).not.toBeInTheDocument()
    })

    it('calls onMoreFilters when button is clicked', async () => {
      const user = userEvent.setup()
      const onMoreFilters = vi.fn()

      render(<FilterBar chips={[]} onMoreFilters={onMoreFilters} />)

      await user.click(screen.getByText('Más filtros'))

      expect(onMoreFilters).toHaveBeenCalledTimes(1)
    })

    it('shows more filters count badge when moreFiltersCount > 0', () => {
      const onMoreFilters = vi.fn()

      render(<FilterBar chips={[]} onMoreFilters={onMoreFilters} moreFiltersCount={3} />)

      expect(screen.getByText('+3')).toBeInTheDocument()
    })

    it('does not show badge when moreFiltersCount is 0', () => {
      const onMoreFilters = vi.fn()

      render(<FilterBar chips={[]} onMoreFilters={onMoreFilters} moreFiltersCount={0} />)

      expect(screen.queryByText('+0')).not.toBeInTheDocument()
    })
  })

  // =============================================================================
  // MOBILE BADGE TESTS
  // =============================================================================

  describe('mobile filter badge', () => {
    it('shows total filter count on mobile button when totalFilterCount is provided', () => {
      const onMoreFilters = vi.fn()

      render(
        <FilterBar
          chips={[createMockChip()]}
          onMoreFilters={onMoreFilters}
          totalFilterCount={5}
        />
      )

      // Mobile button should show the totalFilterCount (5), not chips length (1)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('uses chips length when totalFilterCount is not provided', () => {
      const onMoreFilters = vi.fn()
      const chips = [
        createMockChip({ key: '1' }),
        createMockChip({ key: '2' }),
      ]

      render(<FilterBar chips={chips} onMoreFilters={onMoreFilters} />)

      // Should show chips.length (2)
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})
