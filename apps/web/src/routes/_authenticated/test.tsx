import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import {
  FilterBar,
  SearchInput,
  MultiSelect,
  DateRangePicker,
  type FilterChip,
} from '@/components/ui/filters'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table'
import {
  DataTable,
  DataTablePagination,
  DataTableRowActions,
  createViewAction,
  createEditAction,
  createDeleteAction,
} from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/test')({
  component: TestPage,
})

// Mock data type
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'editor'
  status: 'active' | 'inactive' | 'pending'
  department: string
  joinedAt: string
  salary: number
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    status: 'active',
    department: 'Engineering',
    joinedAt: '2023-01-15',
    salary: 95000,
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'user',
    status: 'active',
    department: 'Marketing',
    joinedAt: '2023-03-22',
    salary: 65000,
  },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'editor',
    status: 'pending',
    department: 'Content',
    joinedAt: '2024-01-10',
    salary: 72000,
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@example.com',
    role: 'user',
    status: 'inactive',
    department: 'Sales',
    joinedAt: '2022-08-05',
    salary: 58000,
  },
  {
    id: '5',
    name: 'Eva Martinez',
    email: 'eva@example.com',
    role: 'admin',
    status: 'active',
    department: 'Engineering',
    joinedAt: '2022-05-18',
    salary: 110000,
  },
  {
    id: '6',
    name: 'Frank Garcia',
    email: 'frank@example.com',
    role: 'editor',
    status: 'active',
    department: 'Content',
    joinedAt: '2023-07-30',
    salary: 68000,
  },
  {
    id: '7',
    name: 'Grace Lee',
    email: 'grace@example.com',
    role: 'user',
    status: 'pending',
    department: 'HR',
    joinedAt: '2024-02-14',
    salary: 55000,
  },
  {
    id: '8',
    name: 'Henry Wilson',
    email: 'henry@example.com',
    role: 'user',
    status: 'active',
    department: 'Finance',
    joinedAt: '2023-11-01',
    salary: 78000,
  },
  {
    id: '9',
    name: 'Ivy Chen',
    email: 'ivy@example.com',
    role: 'editor',
    status: 'active',
    department: 'Content',
    joinedAt: '2023-09-12',
    salary: 70000,
  },
  {
    id: '10',
    name: 'Jack Taylor',
    email: 'jack@example.com',
    role: 'user',
    status: 'inactive',
    department: 'Sales',
    joinedAt: '2022-12-03',
    salary: 62000,
  },
  {
    id: '11',
    name: 'Karen White',
    email: 'karen@example.com',
    role: 'admin',
    status: 'active',
    department: 'Operations',
    joinedAt: '2022-03-28',
    salary: 98000,
  },
  {
    id: '12',
    name: 'Leo Adams',
    email: 'leo@example.com',
    role: 'user',
    status: 'pending',
    department: 'Engineering',
    joinedAt: '2024-03-01',
    salary: 85000,
  },
]

// Status badge component
function StatusBadge({ status }: { status: User['status'] }) {
  const styles: Record<User['status'], string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-700',
    pending: 'bg-amber-100 text-amber-700',
  }

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Role badge component
function RoleBadge({ role }: { role: User['role'] }) {
  const styles: Record<User['role'], string> = {
    admin: 'bg-purple-100 text-purple-700',
    editor: 'bg-blue-100 text-blue-700',
    user: 'bg-slate-100 text-slate-700',
  }

  return (
    <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium', styles[role])}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

// Column helper for type safety
const columnHelper = createColumnHelper<User>()

// Status options for multi-select
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
]

// Status label map for chips
const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
}

function TestPage() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [data] = useState(mockUsers)

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [joinedFrom, setJoinedFrom] = useState<string | undefined>()
  const [joinedTo, setJoinedTo] = useState<string | undefined>()

  // Build filter chips
  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = []

    if (search) {
      chips.push({
        key: 'search',
        label: 'Search',
        value: search,
        onRemove: () => setSearch(''),
      })
    }

    statusFilter.forEach((status) => {
      chips.push({
        key: `status-${status}`,
        label: 'Status',
        value: STATUS_LABELS[status] || status,
        onRemove: () => setStatusFilter((prev) => prev.filter((s) => s !== status)),
      })
    })

    if (joinedFrom || joinedTo) {
      const value = joinedFrom && joinedTo
        ? `${joinedFrom} - ${joinedTo}`
        : joinedFrom || joinedTo || ''
      chips.push({
        key: 'joined',
        label: 'Joined',
        value,
        onRemove: () => {
          setJoinedFrom(undefined)
          setJoinedTo(undefined)
        },
      })
    }

    return chips
  }, [search, statusFilter, joinedFrom, joinedTo])

  const clearAllFilters = () => {
    setSearch('')
    setStatusFilter([])
    setJoinedFrom(undefined)
    setJoinedTo(undefined)
  }

  // Define columns
  const columns: ColumnDef<User, unknown>[] = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      enableSorting: true,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => <span className="text-slate-500">{info.getValue()}</span>,
      enableSorting: true,
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => <RoleBadge role={info.getValue()} />,
      enableSorting: true,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      enableSorting: true,
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      enableSorting: true,
    }),
    columnHelper.accessor('salary', {
      header: 'Salary',
      cell: (info) => (
        <span className="tabular-nums">
          ${info.getValue().toLocaleString()}
        </span>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('joinedAt', {
      header: 'Joined',
      cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      enableSorting: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DataTableRowActions
          label={`Actions for ${row.original.name}`}
          actions={[
            createViewAction(() => alert(`View: ${row.original.name}`)),
            createEditAction(() => alert(`Edit: ${row.original.name}`)),
            createDeleteAction(() => alert(`Delete: ${row.original.name}`)),
          ]}
        />
      ),
    }),
  ]

  // Create table instance
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table acknowledged
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Table Test"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Components' },
          { label: 'Data Table' },
        ]}
        actions={<Button>New User</Button>}
      />

      <FilterBar
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users..."
          />
        }
        quickFilters={
          <>
            <MultiSelect
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <DateRangePicker
              label="Joined"
              fromValue={joinedFrom}
              toValue={joinedTo}
              onChange={(from, to) => {
                setJoinedFrom(from)
                setJoinedTo(to)
              }}
            />
          </>
        }
        chips={filterChips}
        onClearAll={filterChips.length > 0 ? clearAllFilters : undefined}
        moreFiltersCount={2}
        onMoreFilters={() => alert('More filters modal would open here')}
      />

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <DataTable table={table} />
        <DataTablePagination table={table} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="font-semibold">Features Demonstrated</h2>
        <ul className="mt-2 list-disc list-inside text-sm text-slate-600 space-y-1">
          <li>Click column headers to sort (ascending/descending/none)</li>
          <li>Keyboard accessible sorting (Tab + Enter/Space)</li>
          <li>Horizontal scrolling when table overflows</li>
          <li>Kebab menu with view/edit/delete actions</li>
          <li>Status and role badges with color coding</li>
          <li>Pagination with first/prev/next/last navigation</li>
          <li>Page size selector (5, 10, 20, 50, 100)</li>
          <li>Loading skeleton (set isLoading=true to see)</li>
          <li>Empty state message</li>
        </ul>
      </div>
    </div>
  )
}
