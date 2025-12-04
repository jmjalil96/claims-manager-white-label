import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Plus } from 'lucide-react'
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
  createEditAction,
  createDeleteAction,
  CardList,
  CardListEmpty,
  CardListLoadMore,
} from '@/components/ui'
import {
  useClaims,
  useKanbanClaims,
  claimsFilterConfig,
  ClaimCard,
  KanbanBoard,
  type ClaimsQueryParams,
  type KanbanQueryParams,
  type ClaimsSortBy,
} from '@/features/claims'
import { ClaimStatus, ClaimStatusLabel, CareTypeLabel } from '@claims/shared'
import type { CareType } from '@claims/shared'
import type { ClaimListItemDto } from '@claims/shared'
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
  'claimNumber',
  'status',
  'amountSubmitted',
  'amountApproved',
  'incidentDate',
  'submittedDate',
  'settlementDate',
  'createdAt',
] as const

// URL search params schema
const claimsSearchSchema = z.object({
  // View mode (desktop only)
  view: z.enum(['list', 'kanban']).optional().default('list'),
  // Quick filters
  search: z.string().optional(),
  status: z.string().optional(),
  submittedDateFrom: z.string().optional(),
  submittedDateTo: z.string().optional(),
  // Advanced filters
  careType: z.string().optional(),
  incidentDateFrom: z.string().optional(),
  incidentDateTo: z.string().optional(),
  settlementDateFrom: z.string().optional(),
  settlementDateTo: z.string().optional(),
  createdAtFrom: z.string().optional(),
  createdAtTo: z.string().optional(),
  // Pagination & sorting
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(SORTABLE_COLUMNS).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

type ClaimsSearch = z.infer<typeof claimsSearchSchema>

export const Route = createFileRoute('/_authenticated/claims/')({
  validateSearch: claimsSearchSchema,
  component: ClaimsListPage,
})

// Column helper for type safety
const columnHelper = createColumnHelper<ClaimListItemDto>()

// Status options from shared enums
const STATUS_OPTIONS = Object.values(ClaimStatus).map((value) => ({
  value,
  label: ClaimStatusLabel[value],
}))

// Helper function to get variant for claim status
function getClaimStatusVariant(status: ClaimStatus): BadgeVariant {
  const map: Record<ClaimStatus, BadgeVariant> = {
    DRAFT: 'default',
    PENDING_INFO: 'warning',
    VALIDATION: 'info',
    SUBMITTED: 'secondary',
    RETURNED: 'error',
    SETTLED: 'success',
    CANCELLED: 'default',
  }
  return map[status]
}

function ClaimsListPage() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const isMobile = useIsMobile()

  // Advanced filters drawer state
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)

  // URL update helpers
  const updateSearch = useCallback(
    (updates: Partial<ClaimsSearch>) => {
      void navigate({
        to: '/claims',
        search: (prev) => ({ ...prev, ...updates }),
      })
    },
    [navigate]
  )

  const updateFilter = useCallback(
    (updates: Partial<ClaimsSearch>) => {
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
  const queryParams: ClaimsQueryParams = useMemo(
    () => ({
      search: searchParams.search,
      status: searchParams.status,
      submittedDateFrom: searchParams.submittedDateFrom,
      submittedDateTo: searchParams.submittedDateTo,
      // Advanced filters
      careType: searchParams.careType,
      incidentDateFrom: searchParams.incidentDateFrom,
      incidentDateTo: searchParams.incidentDateTo,
      settlementDateFrom: searchParams.settlementDateFrom,
      settlementDateTo: searchParams.settlementDateTo,
      createdAtFrom: searchParams.createdAtFrom,
      createdAtTo: searchParams.createdAtTo,
      // Pagination & sorting
      page: searchParams.page,
      limit: searchParams.limit,
      sortBy: searchParams.sortBy as ClaimsSortBy,
      sortOrder: searchParams.sortOrder,
    }),
    [searchParams]
  )

  // Count active advanced filters for badge
  const advancedFilterCount = useMemo(
    () => countActiveAdvancedFilters(claimsFilterConfig.filters, searchParams as FilterValues),
    [searchParams]
  )

  // Kanban query params (same filters, no status/pagination)
  const kanbanQueryParams: KanbanQueryParams = useMemo(
    () => ({
      search: searchParams.search,
      // Advanced filters
      careType: searchParams.careType,
      incidentDateFrom: searchParams.incidentDateFrom,
      incidentDateTo: searchParams.incidentDateTo,
      submittedDateFrom: searchParams.submittedDateFrom,
      submittedDateTo: searchParams.submittedDateTo,
      settlementDateFrom: searchParams.settlementDateFrom,
      settlementDateTo: searchParams.settlementDateTo,
      createdAtFrom: searchParams.createdAtFrom,
      createdAtTo: searchParams.createdAtTo,
      limitPerColumn: 10,
    }),
    [searchParams]
  )

  // Determine if kanban should be active (desktop only)
  const isKanbanView = searchParams.view === 'kanban' && !isMobile

  // Fetch claims with server-side pagination (list view)
  const { data, isLoading, isError, refetch } = useClaims(queryParams)

  // Fetch kanban data (only when kanban view is active)
  const {
    data: kanbanData,
    isLoading: isKanbanLoading,
    isError: isKanbanError,
    refetch: refetchKanban,
  } = useKanbanClaims(kanbanQueryParams, { enabled: isKanbanView })

  // Parse careType array from comma-separated string
  const careTypeFilter = useMemo(
    () => searchParams.careType?.split(',').filter(Boolean) ?? [],
    [searchParams.careType]
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
        value: ClaimStatusLabel[status as ClaimStatus] || status,
        onRemove: () => {
          const newStatuses = statusFilter.filter((s) => s !== status)
          updateFilter({ status: newStatuses.length > 0 ? newStatuses.join(',') : undefined })
        },
      })
    })

    if (searchParams.submittedDateFrom || searchParams.submittedDateTo) {
      const value =
        searchParams.submittedDateFrom && searchParams.submittedDateTo
          ? `${searchParams.submittedDateFrom} - ${searchParams.submittedDateTo}`
          : searchParams.submittedDateFrom || searchParams.submittedDateTo || ''
      chips.push({
        key: 'submittedDate',
        label: 'Fecha Presentado',
        value,
        onRemove: () => updateFilter({ submittedDateFrom: undefined, submittedDateTo: undefined }),
      })
    }

    // Advanced filter chips
    careTypeFilter.forEach((careType) => {
      chips.push({
        key: `careType-${careType}`,
        label: 'Tipo Atención',
        value: CareTypeLabel[careType as CareType] || careType,
        onRemove: () => {
          const newCareTypes = careTypeFilter.filter((c) => c !== careType)
          updateFilter({ careType: newCareTypes.length > 0 ? newCareTypes.join(',') : undefined })
        },
      })
    })

    if (searchParams.incidentDateFrom || searchParams.incidentDateTo) {
      const value =
        searchParams.incidentDateFrom && searchParams.incidentDateTo
          ? `${searchParams.incidentDateFrom} - ${searchParams.incidentDateTo}`
          : searchParams.incidentDateFrom || searchParams.incidentDateTo || ''
      chips.push({
        key: 'incidentDate',
        label: 'Fecha Incidente',
        value,
        onRemove: () => updateFilter({ incidentDateFrom: undefined, incidentDateTo: undefined }),
      })
    }

    if (searchParams.settlementDateFrom || searchParams.settlementDateTo) {
      const value =
        searchParams.settlementDateFrom && searchParams.settlementDateTo
          ? `${searchParams.settlementDateFrom} - ${searchParams.settlementDateTo}`
          : searchParams.settlementDateFrom || searchParams.settlementDateTo || ''
      chips.push({
        key: 'settlementDate',
        label: 'Fecha Liquidación',
        value,
        onRemove: () => updateFilter({ settlementDateFrom: undefined, settlementDateTo: undefined }),
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
  }, [searchParams, statusFilter, careTypeFilter, updateFilter])

  const clearAllFilters = () => {
    void navigate({
      to: '/claims',
      search: { view: searchParams.view, page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
    })
  }

  // Define columns - ordered by importance
  const columns: ColumnDef<ClaimListItemDto, unknown>[] = useMemo(
    () => [
      // Primary Identification
      columnHelper.accessor('claimNumber', {
        header: 'N° Reclamo',
        size: 140,
        cell: ({ getValue, row }) => (
          <button
            type="button"
            onClick={() => void navigate({ to: '/claims/$claimId', params: { claimId: row.original.id } })}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
          >
            {getValue()}
          </button>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        size: 180,
        cell: (info) => (
          <StatusBadge
            label={ClaimStatusLabel[info.getValue()]}
            variant={getClaimStatusVariant(info.getValue())}
          />
        ),
        enableSorting: true,
      }),

      // People & Context
      columnHelper.accessor('patientName', {
        header: 'Paciente',
        size: 200,
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor('affiliateName', {
        header: 'Afiliado',
        size: 200,
        cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
        enableSorting: false,
      }),
      columnHelper.accessor('clientName', {
        header: 'Cliente',
        size: 220,
        cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
        enableSorting: false,
      }),
      columnHelper.accessor('careType', {
        header: 'Tipo Atención',
        size: 160,
        cell: (info) => {
          const value = info.getValue()
          return value ? (
            <StatusBadge label={CareTypeLabel[value]} variant="info" />
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: false,
      }),

      // Policy & Reference
      columnHelper.accessor('policyNumber', {
        header: 'N° Póliza',
        size: 140,
        cell: (info) => {
          const value = info.getValue()
          return value ? (
            <span className="text-slate-600">{value}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: false,
      }),

      // Financial
      columnHelper.accessor('amountSubmitted', {
        header: 'Monto Presentado',
        size: 160,
        cell: (info) => {
          const value = info.getValue()
          return value != null ? (
            <span className="tabular-nums">${value.toLocaleString()}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: true,
      }),
      columnHelper.accessor('amountApproved', {
        header: 'Monto Aprobado',
        size: 160,
        cell: (info) => {
          const value = info.getValue()
          return value != null ? (
            <span className="tabular-nums text-green-600">${value.toLocaleString()}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: true,
      }),

      // Key Dates
      columnHelper.accessor('incidentDate', {
        header: 'Fecha Incidente',
        size: 150,
        cell: (info) => {
          const value = info.getValue()
          return value ? (
            new Date(value).toLocaleDateString()
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: true,
      }),
      columnHelper.accessor('submittedDate', {
        header: 'Fecha Presentado',
        size: 160,
        cell: (info) => {
          const value = info.getValue()
          return value ? (
            new Date(value).toLocaleDateString()
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: true,
      }),
      columnHelper.accessor('settlementDate', {
        header: 'Fecha Liquidación',
        size: 160,
        cell: (info) => {
          const value = info.getValue()
          return value ? (
            new Date(value).toLocaleDateString()
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
        enableSorting: true,
      }),

      // Audit (at end)
      columnHelper.accessor('createdAt', {
        header: 'Creado',
        size: 120,
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
        enableSorting: true,
      }),

      // Actions
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <DataTableRowActions
            label={`Acciones para ${row.original.claimNumber}`}
            actions={[
              createViewAction(() => {
                void navigate({ to: '/claims/$claimId', params: { claimId: row.original.id } })
              }),
              createEditAction(() => {
                void navigate({ to: '/claims/$claimId', params: { claimId: row.original.id } })
              }),
              createDeleteAction(() => {
                // TODO: Implement delete confirmation
                console.log('Delete claim:', row.original.id)
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
    data: data?.claims ?? [],
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
    <div className="space-y-6">
      <PageHeader
        title="Mis Reclamos"
        subtitle="Gestiona y da seguimiento a tus solicitudes de reembolso"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Reclamos' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {!isMobile && (
              <ViewToggle
                value={(searchParams.view ?? 'list') as ViewMode}
                onChange={(view) => updateSearch({ view })}
              />
            )}
            <Button>
              <Plus size={18} className="md:mr-2" />
              <span className="hidden md:inline">Nuevo Reclamo</span>
            </Button>
          </div>
        }
      />

      <FilterBar
        search={
          <SearchInput
            value={searchParams.search ?? ''}
            onChange={(value) => updateFilter({ search: value || undefined })}
            placeholder="Buscar por N° reclamo, paciente, afiliado..."
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
              label="Fecha Presentado"
              fromValue={searchParams.submittedDateFrom}
              toValue={searchParams.submittedDateTo}
              onChange={(from, to) =>
                updateFilter({
                  submittedDateFrom: from || undefined,
                  submittedDateTo: to || undefined,
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

      <AdvancedFiltersSheet
        open={advancedFiltersOpen}
        onOpenChange={setAdvancedFiltersOpen}
        config={claimsFilterConfig}
        values={searchParams as FilterValues}
        onApply={(values) => {
          updateFilter(values as Partial<ClaimsSearch>)
        }}
        mode={isMobile ? 'mobile' : 'desktop'}
      />

      {(isError || isKanbanError) && (
        <Alert variant="error" title="Error al cargar reclamos">
          <p>No se pudieron cargar los reclamos. Por favor intente nuevamente.</p>
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

      {/* Desktop: Table or Kanban view */}
      <div className="hidden md:block">
        {isKanbanView ? (
          <KanbanBoard data={kanbanData} isLoading={isKanbanLoading} />
        ) : (
          <DataTable
            table={table}
            isLoading={isLoading}
            minWidth={2100}
            maxHeight="calc(100vh - 14rem)"
            pagination={<DataTablePagination table={table} />}
          />
        )}
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden">
        <CardList
          data={data?.claims ?? []}
          renderItem={(claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          )}
          keyExtractor={(claim) => claim.id}
          isLoading={isLoading}
          emptyState={
            <CardListEmpty
              title="No hay reclamos"
              description="No se encontraron reclamos con los filtros aplicados."
            />
          }
        />
        <CardListLoadMore
          onLoadMore={() => {
            const currentLimit = searchParams.limit ?? 20
            updateSearch({ limit: currentLimit + 20 })
          }}
          isLoading={isLoading}
          hasMore={(data?.claims.length ?? 0) < (data?.meta.totalCount ?? 0)}
          currentCount={data?.claims.length ?? 0}
          totalCount={data?.meta.totalCount ?? 0}
        />
      </div>
    </div>
  )
}
