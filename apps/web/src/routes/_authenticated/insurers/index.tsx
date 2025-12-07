import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Plus } from 'lucide-react'
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
import { useInsurers, InsurerFormSheet, type InsurersQueryParams } from '@/features/insurers'
import type { InsurerListItemDto, InsurersSortBy } from '@claims/shared'

// Sortable columns - defined first so it can be used in schema
const SORTABLE_COLUMNS = ['createdAt', 'name', 'code'] as const

// URL search params schema
const insurersSearchSchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(SORTABLE_COLUMNS).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

type InsurersSearch = z.infer<typeof insurersSearchSchema>

export const Route = createFileRoute('/_authenticated/insurers/')({
  validateSearch: insurersSearchSchema,
  component: InsurersListPage,
})

// Column helper for type safety
const columnHelper = createColumnHelper<InsurerListItemDto>()

function InsurersListPage() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()

  // New insurer form sheet state
  const [newInsurerSheetOpen, setNewInsurerSheetOpen] = useState(false)

  // URL update helpers
  const updateSearch = useCallback(
    (updates: Partial<InsurersSearch>) => {
      void navigate({
        from: Route.fullPath,
        search: (prev: InsurersSearch) => ({ ...prev, ...updates }),
      })
    },
    [navigate]
  )

  const updateFilter = useCallback(
    (updates: Partial<InsurersSearch>) => {
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
  const queryParams: InsurersQueryParams = useMemo(
    () => ({
      search: searchParams.search,
      isActive: searchParams.isActive,
      page: searchParams.page,
      limit: searchParams.limit,
      sortBy: searchParams.sortBy as InsurersSortBy,
      sortOrder: searchParams.sortOrder,
    }),
    [searchParams]
  )

  // Fetch insurers with server-side pagination
  const { data, isLoading, isError, refetch } = useInsurers(queryParams)

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

    return chips
  }, [searchParams, updateFilter])

  const clearAllFilters = () => {
    void navigate({
      to: '/insurers',
      search: { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
    })
  }

  // Define columns - ordered by importance
  const columns: ColumnDef<InsurerListItemDto, unknown>[] = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nombre',
        size: 200,
        cell: ({ getValue, row }) => (
          <button
            type="button"
            onClick={() => void navigate({ to: '/insurers/$insurerId', params: { insurerId: row.original.id } })}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
          >
            {getValue()}
          </button>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('code', {
        header: 'Código',
        size: 120,
        cell: (info) => info.getValue() ? <span className="font-mono text-sm">{info.getValue()}</span> : <span className="text-slate-400">—</span>,
        enableSorting: true,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        size: 200,
        cell: (info) => info.getValue() ?? <span className="text-slate-400">—</span>,
        enableSorting: false,
      }),
      columnHelper.accessor('phone', {
        header: 'Teléfono',
        size: 140,
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
      columnHelper.accessor('policyCount', {
        header: 'Pólizas',
        size: 100,
        cell: (info) => info.getValue(),
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
            label={`Acciones para ${row.original.name}`}
            actions={[
              createViewAction(() => {
                void navigate({
                  to: '/insurers/$insurerId',
                  params: { insurerId: row.original.id },
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
    data: data?.insurers ?? [],
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
          title="Aseguradoras"
          subtitle="Gestiona las aseguradoras del sistema"
          breadcrumbs={[
            { label: 'Inicio', href: '/dashboard' },
            { label: 'Aseguradoras' },
          ]}
          actions={
            <Button onClick={() => setNewInsurerSheetOpen(true)}>
              <Plus size={18} className="md:mr-2" />
              <span className="hidden md:inline">Nueva Aseguradora</span>
            </Button>
          }
        />

        <FilterBar
          search={
            <SearchInput
              value={searchParams.search ?? ''}
              onChange={(value) => updateFilter({ search: value || undefined })}
              placeholder="Buscar por nombre, código, email..."
            />
          }
          chips={filterChips}
          onClearAll={filterChips.length > 0 ? clearAllFilters : undefined}
          totalFilterCount={filterChips.length}
        />

        {isError && (
          <Alert variant="error" title="Error al cargar aseguradoras">
            <p>No se pudieron cargar las aseguradoras. Por favor intente nuevamente.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              className="mt-2"
            >
              Reintentar
            </Button>
          </Alert>
        )}
      </div>

      <InsurerFormSheet
        open={newInsurerSheetOpen}
        onOpenChange={setNewInsurerSheetOpen}
      />

      {/* Desktop: Table view */}
      <div className="hidden md:flex flex-1 min-h-0">
        <DataTable
          table={table}
          isLoading={isLoading}
          minWidth={1000}
          pagination={<DataTablePagination table={table} />}
        />
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden">
        <CardList
          data={data?.insurers ?? []}
          renderItem={(insurer) => (
            <div
              key={insurer.id}
              onClick={() => void navigate({ to: '/insurers/$insurerId', params: { insurerId: insurer.id } })}
              className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-900 truncate">{insurer.name}</h3>
                  {insurer.code && <p className="text-sm text-slate-500 font-mono">{insurer.code}</p>}
                </div>
                <StatusBadge
                  label={insurer.isActive ? 'Activo' : 'Inactivo'}
                  variant={insurer.isActive ? 'success' : 'default'}
                />
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                <span>{insurer.policyCount} pólizas</span>
              </div>
            </div>
          )}
          keyExtractor={(insurer) => insurer.id}
          isLoading={isLoading}
          emptyState={
            <CardListEmpty
              title="No hay aseguradoras"
              description="No se encontraron aseguradoras con los filtros aplicados."
            />
          }
        />
        <CardListLoadMore
          onLoadMore={() => {
            const currentLimit = searchParams.limit ?? 20
            updateSearch({ limit: currentLimit + 20 })
          }}
          isLoading={isLoading}
          hasMore={(data?.insurers.length ?? 0) < (data?.meta.totalCount ?? 0)}
          currentCount={data?.insurers.length ?? 0}
          totalCount={data?.meta.totalCount ?? 0}
        />
      </div>
    </div>
  )
}
