import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  PageHeader,
  Button,
  Alert,
  ViewToggle,
  type ViewMode,
  FilterBar,
  SearchInput,
  MultiSelect,
  DateRangePicker,
  AdvancedFiltersSheet,
  countActiveAdvancedFilters,
  type FilterChip,
  type FilterValues,
  KanbanBoard,
  KanbanEmptyState,
  type KanbanColumn,
} from '@/components/ui'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type SortingState,
  type PaginationState,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  DataTable,
  DataTablePagination,
  DataTableRowActions,
  createViewAction,
  CardList,
  CardListEmpty,
  CardListLoadMore,
} from '@/components/ui'
import {
  usePolicies,
  useKanbanPolicies,
  policiesFilterConfig,
  PolicyCard,
  PolicyFormSheet,
  POLICIES_KANBAN_COLUMNS,
  getPolicyStatusLabel,
  getPolicyStatusColor,
  type PoliciesQueryParams,
  type KanbanPoliciesQueryParams,
} from '@/features/policies'
import { PolicyStatus, PolicyStatusLabel, PolicyTypeLabel } from '@claims/shared'
import type { PolicyType } from '@claims/shared'
import type { PolicyListItemDto } from '@claims/shared'
import { StatusBadge, type BadgeVariant } from '@/components/ui'

// Hook to detect mobile breakpoint using useSyncExternalStore
function useIsMobile(breakpoint = 768) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
      mediaQuery.addEventListener('change', callback)
      return () => mediaQuery.removeEventListener('change', callback)
    },
    [breakpoint]
  )

  const getSnapshot = useCallback(() => {
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
  }, [breakpoint])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// Sortable columns - defined first so it can be used in schema
const SORTABLE_COLUMNS = [
  'policyNumber',
  'status',
  'startDate',
  'endDate',
  'createdAt',
] as const

// URL search params schema
const policiesSearchSchema = z.object({
  // View mode (desktop only)
  view: z.enum(['list', 'kanban']).optional().default('list'),
  // Quick filters
  search: z.string().optional(),
  status: z.string().optional(),
  startDateFrom: z.string().optional(),
  startDateTo: z.string().optional(),
  // Advanced filters
  type: z.string().optional(),
  endDateFrom: z.string().optional(),
  endDateTo: z.string().optional(),
  createdAtFrom: z.string().optional(),
  createdAtTo: z.string().optional(),
  // Pagination & sorting
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(SORTABLE_COLUMNS).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  // Kanban-specific (must match backend: min 1, max 50)
  limitPerColumn: z.coerce.number().int().min(1).max(50).optional().default(10),
  // Single-column expansion (kanban) - max 100 per backend
  expandStatus: z.string().optional(),
  expandLimit: z.coerce.number().int().min(1).max(100).optional(),
})

type PoliciesSearch = z.infer<typeof policiesSearchSchema>

export const Route = createFileRoute('/_authenticated/policies/')({
  validateSearch: policiesSearchSchema,
  component: PoliciesListPage,
})

// Column helper for type safety
const columnHelper = createColumnHelper<PolicyListItemDto>()

// Status options from shared enums
const STATUS_OPTIONS = Object.values(PolicyStatus).map((value) => ({
  value,
  label: PolicyStatusLabel[value],
}))

// Helper function to get variant for policy status
function getPolicyStatusVariant(status: PolicyStatus): BadgeVariant {
  const map: Record<PolicyStatus, BadgeVariant> = {
    ACTIVE: 'success',
    PENDING: 'warning',
    EXPIRED: 'secondary',
    CANCELLED: 'default',
  }
  return map[status]
}

function PoliciesListPage() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const isMobile = useIsMobile()

  // Advanced filters drawer state
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  // New policy form sheet state
  const [newPolicySheetOpen, setNewPolicySheetOpen] = useState(false)

  // URL update helpers
  const updateSearch = useCallback(
    (updates: Partial<PoliciesSearch>) => {
      void navigate({
        from: Route.fullPath,
        search: (prev: PoliciesSearch) => ({ ...prev, ...updates }),
      })
    },
    [navigate]
  )

  const updateFilter = useCallback(
    (updates: Partial<PoliciesSearch>) => {
      updateSearch({ ...updates, page: 1 })
    },
    [updateSearch]
  )

  // Derive TanStack Table state from URL
  const sorting: SortingState = [
    {
      id: searchParams.sortBy ?? 'createdAt',
      desc: (searchParams.sortOrder ?? 'desc') === 'desc',
    },
  ]

  const pagination: PaginationState = {
    pageIndex: (searchParams.page ?? 1) - 1,
    pageSize: searchParams.limit ?? 20,
  }

  // Parse status array from comma-separated string
  const statusFilter = useMemo(
    () => searchParams.status?.split(',').filter(Boolean) ?? [],
    [searchParams.status]
  )

  // Build query params from URL search params
  const queryParams: PoliciesQueryParams = useMemo(
    () => ({
      search: searchParams.search,
      status: searchParams.status,
      startDateFrom: searchParams.startDateFrom,
      startDateTo: searchParams.startDateTo,
      // Advanced filters
      type: searchParams.type,
      endDateFrom: searchParams.endDateFrom,
      endDateTo: searchParams.endDateTo,
      createdAtFrom: searchParams.createdAtFrom,
      createdAtTo: searchParams.createdAtTo,
      // Pagination & sorting
      page: searchParams.page,
      limit: searchParams.limit,
      sortBy: searchParams.sortBy,
      sortOrder: searchParams.sortOrder,
    }),
    [searchParams]
  )

  // Count active advanced filters for badge
  const advancedFilterCount = useMemo(
    () => countActiveAdvancedFilters(policiesFilterConfig.filters, searchParams as FilterValues),
    [searchParams]
  )

  // Kanban query params (same filters, no status/pagination)
  const kanbanQueryParams: KanbanPoliciesQueryParams = useMemo(
    () => ({
      search: searchParams.search,
      // Advanced filters
      type: searchParams.type,
      startDateFrom: searchParams.startDateFrom,
      startDateTo: searchParams.startDateTo,
      endDateFrom: searchParams.endDateFrom,
      endDateTo: searchParams.endDateTo,
      createdAtFrom: searchParams.createdAtFrom,
      createdAtTo: searchParams.createdAtTo,
      limitPerColumn: searchParams.limitPerColumn ?? 10,
      // Single-column expansion
      expandStatus: searchParams.expandStatus,
      expandLimit: searchParams.expandLimit,
    }),
    [searchParams]
  )

  // Determine if kanban should be active (desktop only)
  const isKanbanView = searchParams.view === 'kanban' && !isMobile

  // Fetch policies with server-side pagination (list view)
  const { data, isLoading, isError, refetch } = usePolicies(queryParams)

  // Fetch kanban data (only when kanban view is active)
  const {
    data: kanbanData,
    isLoading: isKanbanLoading,
    isError: isKanbanError,
    refetch: refetchKanban,
  } = useKanbanPolicies(kanbanQueryParams, { enabled: isKanbanView })

  // Transform kanban data to generic KanbanBoard format
  const kanbanBoardData = useMemo(() => {
    if (!kanbanData) return {} as Record<PolicyStatus, KanbanColumn<PolicyListItemDto>>

    return Object.fromEntries(
      Object.entries(kanbanData.columns).map(([status, col]) => [
        status,
        { count: col.count, items: col.policies, hasMore: col.hasMore },
      ])
    ) as Record<PolicyStatus, KanbanColumn<PolicyListItemDto>>
  }, [kanbanData])

  // Parse type array from comma-separated string
  const typeFilter = useMemo(
    () => searchParams.type?.split(',').filter(Boolean) ?? [],
    [searchParams.type]
  )

  // Build filter chips
  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = []

    // Quick filter chips
    if (searchParams.search) {
      chips.push({
        key: 'search',
        label: 'Buscar',
        value: searchParams.search,
        onRemove: () => updateFilter({ search: undefined }),
      })
    }

    statusFilter.forEach((status) => {
      chips.push({
        key: `status-${status}`,
        label: 'Estado',
        value: PolicyStatusLabel[status as PolicyStatus] || status,
        onRemove: () => {
          const newStatuses = statusFilter.filter((s) => s !== status)
          updateFilter({ status: newStatuses.length > 0 ? newStatuses.join(',') : undefined })
        },
      })
    })

    if (searchParams.startDateFrom || searchParams.startDateTo) {
      const value =
        searchParams.startDateFrom && searchParams.startDateTo
          ? `${searchParams.startDateFrom} - ${searchParams.startDateTo}`
          : searchParams.startDateFrom || searchParams.startDateTo || ''
      chips.push({
        key: 'startDate',
        label: 'Fecha Inicio',
        value,
        onRemove: () => updateFilter({ startDateFrom: undefined, startDateTo: undefined }),
      })
    }

    // Advanced filter chips
    typeFilter.forEach((policyType) => {
      chips.push({
        key: `type-${policyType}`,
        label: 'Tipo',
        value: PolicyTypeLabel[policyType as PolicyType] || policyType,
        onRemove: () => {
          const newTypes = typeFilter.filter((t) => t !== policyType)
          updateFilter({ type: newTypes.length > 0 ? newTypes.join(',') : undefined })
        },
      })
    })

    if (searchParams.endDateFrom || searchParams.endDateTo) {
      const value =
        searchParams.endDateFrom && searchParams.endDateTo
          ? `${searchParams.endDateFrom} - ${searchParams.endDateTo}`
          : searchParams.endDateFrom || searchParams.endDateTo || ''
      chips.push({
        key: 'endDate',
        label: 'Fecha Vencimiento',
        value,
        onRemove: () => updateFilter({ endDateFrom: undefined, endDateTo: undefined }),
      })
    }

    if (searchParams.createdAtFrom || searchParams.createdAtTo) {
      const value =
        searchParams.createdAtFrom && searchParams.createdAtTo
          ? `${searchParams.createdAtFrom} - ${searchParams.createdAtTo}`
          : searchParams.createdAtFrom || searchParams.createdAtTo || ''
      chips.push({
        key: 'createdAt',
        label: 'Fecha Creación',
        value,
        onRemove: () => updateFilter({ createdAtFrom: undefined, createdAtTo: undefined }),
      })
    }

    return chips
  }, [searchParams, statusFilter, typeFilter, updateFilter])

  const clearAllFilters = () => {
    void navigate({
      to: '/policies',
      search: { view: searchParams.view, page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
    })
  }

  // Define columns - ordered by importance
  const columns: ColumnDef<PolicyListItemDto, unknown>[] = useMemo(
    () => [
      // Primary Identification
      columnHelper.accessor('policyNumber', {
        header: 'N° Póliza',
        size: 140,
        cell: ({ getValue, row }) => (
          <button
            type="button"
            onClick={() => void navigate({ to: '/policies/$policyId', params: { policyId: row.original.id } })}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
          >
            {getValue()}
          </button>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        size: 140,
        cell: (info) => (
          <StatusBadge
            label={PolicyStatusLabel[info.getValue()]}
            variant={getPolicyStatusVariant(info.getValue())}
          />
        ),
        enableSorting: true,
      }),

      // Client & Insurer
      columnHelper.accessor('clientName', {
        header: 'Cliente',
        size: 200,
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor('insurerName', {
        header: 'Aseguradora',
        size: 200,
        cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
        enableSorting: false,
      }),

      // Type
      columnHelper.accessor('type', {
        header: 'Tipo',
        size: 120,
        cell: (info) => {
          const value = info.getValue()
          return value ? (
            <StatusBadge label={PolicyTypeLabel[value]} variant="info" />
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: false,
      }),

      // Dates
      columnHelper.accessor('startDate', {
        header: 'Fecha Inicio',
        size: 130,
        cell: (info) => formatDate(info.getValue()),
        enableSorting: true,
      }),
      columnHelper.accessor('endDate', {
        header: 'Fecha Vencimiento',
        size: 150,
        cell: (info) => formatDate(info.getValue()),
        enableSorting: true,
      }),

      // Audit (at end)
      columnHelper.accessor('createdAt', {
        header: 'Creado',
        size: 120,
        cell: (info) => formatDate(info.getValue()),
        enableSorting: true,
      }),

      // Actions
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <DataTableRowActions
            label={`Acciones para ${row.original.policyNumber}`}
            actions={[
              createViewAction(() => {
                void navigate({
                  to: '/policies/$policyId',
                  params: { policyId: row.original.id },
                })
              }),
            ]}
          />
        ),
      }),
    ],
    [navigate]
  )

  // Create table instance with server-side pagination
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table acknowledged
  const table = useReactTable({
    data: data?.policies ?? [],
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      if (newSorting[0]) {
        updateSearch({
          sortBy: newSorting[0].id as (typeof SORTABLE_COLUMNS)[number],
          sortOrder: newSorting[0].desc ? 'desc' : 'asc',
        })
      }
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      updateSearch({
        page: newPagination.pageIndex + 1,
        limit: newPagination.pageSize,
      })
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.meta.totalPages ?? 0,
    rowCount: data?.meta.totalCount,
  })

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Fixed header section */}
      <div className="flex-shrink-0 space-y-6 mb-6">
        <PageHeader
          title="Pólizas"
          subtitle="Gestiona las pólizas de tus clientes"
          breadcrumbs={[
            { label: 'Inicio', href: '/dashboard' },
            { label: 'Pólizas' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              {!isMobile && (
                <ViewToggle
                  value={(searchParams.view ?? 'list') as ViewMode}
                  onChange={(view) => updateSearch({ view })}
                />
              )}
              <Button onClick={() => setNewPolicySheetOpen(true)}>
                <Plus size={18} className="md:mr-2" />
                <span className="hidden md:inline">Nueva Póliza</span>
              </Button>
            </div>
          }
        />

        <FilterBar
          search={
            <SearchInput
              value={searchParams.search ?? ''}
              onChange={(value) => updateFilter({ search: value || undefined })}
              placeholder="Buscar por N° póliza, cliente, aseguradora..."
            />
          }
          quickFilters={
            <>
              <MultiSelect
                label="Estado"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(values) =>
                  updateFilter({ status: values.length > 0 ? values.join(',') : undefined })
                }
              />
              <DateRangePicker
                label="Fecha Inicio"
                fromValue={searchParams.startDateFrom}
                toValue={searchParams.startDateTo}
                onChange={(from, to) =>
                  updateFilter({
                    startDateFrom: from || undefined,
                    startDateTo: to || undefined,
                  })
                }
              />
            </>
          }
          chips={filterChips}
          onClearAll={filterChips.length > 0 ? clearAllFilters : undefined}
          moreFiltersCount={advancedFilterCount}
          totalFilterCount={filterChips.length}
          onMoreFilters={() => setAdvancedFiltersOpen(true)}
        />

        {(isError || isKanbanError) && (
          <Alert variant="error" title="Error al cargar pólizas">
            <p>No se pudieron cargar las pólizas. Por favor intente nuevamente.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void (isKanbanView ? refetchKanban() : refetch())}
              className="mt-2"
            >
              Reintentar
            </Button>
          </Alert>
        )}
      </div>

      <AdvancedFiltersSheet
        open={advancedFiltersOpen}
        onOpenChange={setAdvancedFiltersOpen}
        config={policiesFilterConfig}
        values={searchParams as FilterValues}
        onApply={(values) => {
          updateFilter(values as Partial<PoliciesSearch>)
        }}
        mode={isMobile ? 'mobile' : 'desktop'}
      />

      <PolicyFormSheet
        open={newPolicySheetOpen}
        onOpenChange={setNewPolicySheetOpen}
      />

      {/* Desktop: Table or Kanban view */}
      <div className="hidden md:flex flex-1 min-h-0">
        {isKanbanView ? (
          <KanbanBoard
            columns={POLICIES_KANBAN_COLUMNS}
            data={kanbanBoardData}
            renderCard={(policy) => <PolicyCard policy={policy} />}
            getColumnLabel={getPolicyStatusLabel}
            getColumnColor={getPolicyStatusColor}
            keyExtractor={(policy) => policy.id}
            isLoading={isKanbanLoading}
            onLoadMore={(status) => {
              const currentLimit =
                searchParams.expandStatus === status
                  ? (searchParams.expandLimit ?? searchParams.limitPerColumn ?? 10)
                  : (searchParams.limitPerColumn ?? 10)

              updateSearch({
                expandStatus: status,
                expandLimit: Math.min(currentLimit + 10, 100), // Cap at 100 per backend
              })
            }}
            loadMoreLabel={(n) => `Ver ${n} más`}
            emptyState={<KanbanEmptyState message="Sin pólizas" />}
          />
        ) : (
          <DataTable
            table={table}
            isLoading={isLoading}
            minWidth={1400}
            pagination={<DataTablePagination table={table} />}
          />
        )}
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden">
        <CardList
          data={data?.policies ?? []}
          renderItem={(policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          )}
          keyExtractor={(policy) => policy.id}
          isLoading={isLoading}
          emptyState={
            <CardListEmpty
              title="No hay pólizas"
              description="No se encontraron pólizas con los filtros aplicados."
            />
          }
        />
        <CardListLoadMore
          onLoadMore={() => {
            const currentLimit = searchParams.limit ?? 20
            updateSearch({ limit: currentLimit + 20 })
          }}
          isLoading={isLoading}
          hasMore={(data?.policies.length ?? 0) < (data?.meta.totalCount ?? 0)}
          currentCount={data?.policies.length ?? 0}
          totalCount={data?.meta.totalCount ?? 0}
        />
      </div>
    </div>
  )
}
