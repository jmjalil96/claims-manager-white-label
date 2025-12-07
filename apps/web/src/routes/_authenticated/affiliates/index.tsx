import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import {
  PageHeader,
  Button,
  Alert,
  FilterBar,
  SearchInput,
  type FilterChip,
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
  StatusBadge,
} from '@/components/ui'
import {
  useAffiliates,
  useAffiliateFamilies,
  AffiliateFormSheet,
  AffiliateViewToggle,
  FamilyTable,
  type AffiliatesQueryParams,
  type AffiliateViewMode,
} from '@/features/affiliates'
import type { AffiliateListItemDto, AffiliatesSortBy } from '@claims/shared'

// Sortable columns - defined first so it can be used in schema
const SORTABLE_COLUMNS = ['createdAt', 'lastName', 'firstName', 'documentNumber'] as const

// URL search params schema
const affiliatesSearchSchema = z.object({
  // View mode (desktop only)
  view: z.enum(['list', 'family']).optional().default('list'),
  search: z.string().optional(),
  clientId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isOwner: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(SORTABLE_COLUMNS).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

type AffiliatesSearch = z.infer<typeof affiliatesSearchSchema>

export const Route = createFileRoute('/_authenticated/affiliates/')({
  validateSearch: affiliatesSearchSchema,
  component: AffiliatesListPage,
})

// Hook to detect mobile breakpoint
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

// Simple pagination for family view (doesn't depend on TanStack Table)
interface SimplePaginationProps {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function SimplePagination({
  page,
  limit,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: SimplePaginationProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, totalCount)

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
      <div className="flex items-center gap-6">
        <p className="text-sm text-slate-600">
          Showing <span className="font-medium text-slate-900">{from}</span>
          {' '}-{' '}
          <span className="font-medium text-slate-900">{to}</span>
          {' '}of{' '}
          <span className="font-medium text-slate-900">{totalCount}</span>
        </p>
        <select
          value={limit}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
          aria-label="Rows per page"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-colors"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="px-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{page}</span>
          {' / '}
          <span className="font-medium text-slate-900">{totalPages || 1}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 transition-colors"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// Column helper for type safety
const columnHelper = createColumnHelper<AffiliateListItemDto>()

function AffiliatesListPage() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  // New affiliate form sheet state
  const [newAffiliateSheetOpen, setNewAffiliateSheetOpen] = useState(false)

  // View mode - family view only on desktop
  const isMobile = useIsMobile()
  const isFamilyView = searchParams.view === 'family' && !isMobile

  // URL update helpers
  const updateSearch = useCallback(
    (updates: Partial<AffiliatesSearch>) => {
      void navigate({
        from: Route.fullPath,
        search: (prev: AffiliatesSearch) => ({ ...prev, ...updates }),
      })
    },
    [navigate]
  )

  const updateFilter = useCallback(
    (updates: Partial<AffiliatesSearch>) => {
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

  // Build query params from URL search params
  const queryParams: AffiliatesQueryParams = useMemo(
    () => ({
      search: searchParams.search,
      clientId: searchParams.clientId,
      isActive: searchParams.isActive,
      isOwner: searchParams.isOwner,
      page: searchParams.page,
      limit: searchParams.limit,
      sortBy: searchParams.sortBy as AffiliatesSortBy,
      sortOrder: searchParams.sortOrder,
    }),
    [searchParams]
  )

  // Fetch affiliates with server-side pagination
  // Only one query is enabled at a time based on view mode
  const { data, isLoading, isError, refetch } = useAffiliates(queryParams, { enabled: !isFamilyView })
  const { data: familyData, isLoading: isFamilyLoading, isError: isFamilyError, refetch: refetchFamilies } = useAffiliateFamilies(queryParams, { enabled: isFamilyView })

  // Build filter chips
  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = []

    if (searchParams.search) {
      chips.push({
        key: 'search',
        label: 'Buscar',
        value: searchParams.search,
        onRemove: () => updateFilter({ search: undefined }),
      })
    }

    if (searchParams.isActive !== undefined) {
      chips.push({
        key: 'isActive',
        label: 'Estado',
        value: searchParams.isActive ? 'Activo' : 'Inactivo',
        onRemove: () => updateFilter({ isActive: undefined }),
      })
    }

    if (searchParams.isOwner !== undefined) {
      chips.push({
        key: 'isOwner',
        label: 'Tipo',
        value: searchParams.isOwner ? 'Titular' : 'Dependiente',
        onRemove: () => updateFilter({ isOwner: undefined }),
      })
    }

    return chips
  }, [searchParams, updateFilter])

  const clearAllFilters = () => {
    void navigate({
      to: '/affiliates',
      search: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
    })
  }

  // Define columns - ordered by importance
  const columns: ColumnDef<AffiliateListItemDto, unknown>[] = useMemo(
    () => [
      columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
        id: 'name',
        header: 'Nombre',
        size: 200,
        cell: ({ getValue, row }) => (
          <button
            type="button"
            onClick={() => void navigate({ to: '/affiliates/$affiliateId', params: { affiliateId: row.original.id } })}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
          >
            {getValue()}
          </button>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row.documentType && row.documentNumber ? `${row.documentType} ${row.documentNumber}` : row.documentNumber, {
        id: 'document',
        header: 'Documento',
        size: 160,
        cell: (info) => info.getValue() ? <span className="font-mono text-sm">{info.getValue()}</span> : <span className="text-slate-400">—</span>,
        enableSorting: false,
      }),
      columnHelper.accessor('clientName', {
        header: 'Cliente',
        size: 180,
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor('isOwner', {
        header: 'Tipo',
        size: 110,
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? 'Titular' : 'Dependiente'}
            variant={info.getValue() ? 'info' : 'warning'}
          />
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
        cell: (info) => info.getValue() ?? <span className="text-slate-400">—</span>,
        enableSorting: false,
      }),
      columnHelper.accessor('isActive', {
        header: 'Estado',
        size: 100,
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? 'Activo' : 'Inactivo'}
            variant={info.getValue() ? 'success' : 'default'}
          />
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Creado',
        size: 120,
        cell: (info) => formatDate(info.getValue()),
        enableSorting: true,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <DataTableRowActions
            label={`Acciones para ${row.original.firstName} ${row.original.lastName}`}
            actions={[
              createViewAction(() => {
                void navigate({
                  to: '/affiliates/$affiliateId',
                  params: { affiliateId: row.original.id },
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
    data: data?.affiliates ?? [],
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
          title="Afiliados"
          subtitle="Gestiona los afiliados del sistema"
          breadcrumbs={[
            { label: 'Inicio', href: '/dashboard' },
            { label: 'Afiliados' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <AffiliateViewToggle
                value={(searchParams.view ?? 'list') as AffiliateViewMode}
                onChange={(view) => updateFilter({ view })}
                className="hidden md:inline-flex"
              />
              <Button onClick={() => setNewAffiliateSheetOpen(true)}>
                <Plus size={18} className="md:mr-2" />
                <span className="hidden md:inline">Nuevo Afiliado</span>
              </Button>
            </div>
          }
        />

        <FilterBar
          search={
            <SearchInput
              value={searchParams.search ?? ''}
              onChange={(value) => updateFilter({ search: value || undefined })}
              placeholder="Buscar por nombre, documento, email..."
            />
          }
          chips={filterChips}
          onClearAll={filterChips.length > 0 ? clearAllFilters : undefined}
          totalFilterCount={filterChips.length}
        />

        {(isError || isFamilyError) && (
          <Alert variant="error" title="Error al cargar afiliados">
            <p>No se pudieron cargar los afiliados. Por favor intente nuevamente.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void (isFamilyView ? refetchFamilies() : refetch())}
              className="mt-2"
            >
              Reintentar
            </Button>
          </Alert>
        )}
      </div>

      <AffiliateFormSheet
        open={newAffiliateSheetOpen}
        onOpenChange={setNewAffiliateSheetOpen}
      />

      {/* Desktop: Table view */}
      <div className="hidden md:flex flex-1 min-h-0">
        {isFamilyView ? (
          <FamilyTable
            families={familyData?.families ?? []}
            meta={familyData?.meta}
            isLoading={isFamilyLoading}
            onViewAffiliate={(id) => void navigate({ to: '/affiliates/$affiliateId', params: { affiliateId: id } })}
            pagination={
              <SimplePagination
                page={searchParams.page ?? 1}
                limit={searchParams.limit ?? 20}
                totalCount={familyData?.meta.totalCount ?? 0}
                totalPages={familyData?.meta.totalPages ?? 0}
                onPageChange={(page) => updateSearch({ page })}
                onPageSizeChange={(limit) => updateSearch({ page: 1, limit })}
              />
            }
          />
        ) : (
          <DataTable
            table={table}
            isLoading={isLoading}
            minWidth={1200}
            pagination={<DataTablePagination table={table} />}
          />
        )}
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden">
        <CardList
          data={data?.affiliates ?? []}
          renderItem={(affiliate) => (
            <div
              key={affiliate.id}
              onClick={() => void navigate({ to: '/affiliates/$affiliateId', params: { affiliateId: affiliate.id } })}
              className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-900 truncate">{affiliate.firstName} {affiliate.lastName}</h3>
                  <p className="text-sm text-slate-500">{affiliate.clientName}</p>
                  {affiliate.documentNumber && (
                    <p className="text-sm text-slate-500 font-mono">{affiliate.documentNumber}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <StatusBadge
                    label={affiliate.isOwner ? 'Titular' : 'Dependiente'}
                    variant={affiliate.isOwner ? 'info' : 'warning'}
                  />
                  <StatusBadge
                    label={affiliate.isActive ? 'Activo' : 'Inactivo'}
                    variant={affiliate.isActive ? 'success' : 'default'}
                  />
                </div>
              </div>
            </div>
          )}
          keyExtractor={(affiliate) => affiliate.id}
          isLoading={isLoading}
          emptyState={
            <CardListEmpty
              title="No hay afiliados"
              description="No se encontraron afiliados con los filtros aplicados."
            />
          }
        />
        <CardListLoadMore
          onLoadMore={() => {
            const currentLimit = searchParams.limit ?? 20
            updateSearch({ limit: currentLimit + 20 })
          }}
          isLoading={isLoading}
          hasMore={(data?.affiliates.length ?? 0) < (data?.meta.totalCount ?? 0)}
          currentCount={data?.affiliates.length ?? 0}
          totalCount={data?.meta.totalCount ?? 0}
        />
      </div>
    </div>
  )
}
