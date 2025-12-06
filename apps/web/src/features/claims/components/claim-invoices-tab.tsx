import { useState, useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'
import { Receipt, Loader2, Plus, Pencil, Trash2, DollarSign, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { InvoiceDto } from '@claims/shared'
import {
  Button,
  DataTable,
  Alert,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui'
import { cn, toast } from '@/lib'
import { useClaimInvoices, useDeleteInvoice } from '../claimInvoices'
import { InvoiceFormSheet } from './invoice-form-sheet'
import { getConsistencyStatus } from '../utils/invoice-consistency'

/* -----------------------------------------------------------------------------
 * Types & Props
 * -------------------------------------------------------------------------- */

interface ClaimInvoicesTabProps {
  claimId: string
  claimAmountSubmitted?: number
}

interface SummaryCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

const columnHelper = createColumnHelper<InvoiceDto>()

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getConsistencyIcon(status: 'match' | 'close' | 'mismatch') {
  switch (status) {
    case 'match':
      return <CheckCircle className="size-4 text-green-600" />
    case 'close':
      return <AlertTriangle className="size-4 text-amber-600" />
    case 'mismatch':
      return <XCircle className="size-4 text-red-600" />
  }
}

/* -----------------------------------------------------------------------------
 * SummaryCard Component
 * -------------------------------------------------------------------------- */

function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center gap-4">
      <div className="p-2 bg-slate-50 rounded-lg shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * ClaimInvoicesTab Component
 * -------------------------------------------------------------------------- */

export function ClaimInvoicesTab({ claimId, claimAmountSubmitted }: ClaimInvoicesTabProps) {
  const { data, isLoading, isError, error } = useClaimInvoices(claimId)
  const deleteMutation = useDeleteInvoice(claimId)

  // Sheet state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceDto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<InvoiceDto | null>(null)

  const invoices = useMemo(() => data?.invoices ?? [], [data?.invoices])

  const handleDelete = useCallback(
    async (invoice: InvoiceDto) => {
      if (deletingId) return // Prevent double-delete

      setDeletingId(invoice.id)
      setDeleteConfirm(null) // Close dialog
      try {
        await deleteMutation.mutateAsync(invoice.id)
        toast.success('Factura eliminada')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Error al eliminar la factura'
        )
      } finally {
        setDeletingId(null)
      }
    },
    [deleteMutation, deletingId]
  )

  const columns = useMemo<ColumnDef<InvoiceDto, unknown>[]>(
    () => [
      columnHelper.accessor('invoiceNumber', {
        header: '# Factura',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-500">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('providerName', {
        header: 'Proveedor',
        cell: (info) => {
          const value = info.getValue()
          return (
            <span
              className="font-medium text-slate-900 truncate max-w-[200px] block"
              title={value}
            >
              {value}
            </span>
          )
        },
      }),
      columnHelper.accessor('amountSubmitted', {
        header: () => <span className="text-right block">Monto</span>,
        cell: (info) => (
          <span className="text-right block tabular-nums font-semibold text-slate-900">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: 'Fecha',
        cell: (info) => (
          <span className="text-sm text-slate-400">{formatDate(info.getValue())}</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const invoice = row.original
          const isDeleting = deletingId === invoice.id

          return (
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setEditingInvoice(invoice)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={isDeleting}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(invoice)}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </div>
          )
        },
      }),
    ],
    [deletingId]
  )

  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalAmount = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.amountSubmitted, 0),
    [invoices]
  )

  const consistency = useMemo(
    () => getConsistencyStatus(totalAmount, claimAmountSubmitted),
    [totalAmount, claimAmountSubmitted]
  )

  // Loading state - card shell pattern (like History/SLA)
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-700">Facturas</h3>
          </div>
        </header>
        <div className="p-5">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-teal-600" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <Alert variant="error">
        {error instanceof Error ? error.message : 'Error al cargar las facturas'}
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="Total Presentado"
          value={formatCurrency(totalAmount)}
          icon={<DollarSign className="size-5 text-teal-600" />}
        />
        <SummaryCard
          label="Facturas"
          value={invoices.length.toString()}
          icon={<Receipt className="size-5 text-blue-600" />}
        />
      </div>

      {/* Consistency Check */}
      {consistency && claimAmountSubmitted !== undefined && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
          {getConsistencyIcon(consistency.status)}
          <div className="flex-1">
            <span className="text-sm text-slate-600">
              Total facturas vs Monto Reclamo:
            </span>
            <span className="ml-2 text-sm font-medium text-slate-900">
              {formatCurrency(totalAmount)} vs {formatCurrency(claimAmountSubmitted)}
            </span>
          </div>
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              consistency.status === 'match' && 'bg-green-100 text-green-700',
              consistency.status === 'close' && 'bg-amber-100 text-amber-700',
              consistency.status === 'mismatch' && 'bg-red-100 text-red-700'
            )}
          >
            {consistency.label}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">Listado de Facturas</h3>
        <Button
          size="sm"
          leftIcon={<Plus className="size-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nueva factura
        </Button>
      </div>

      {/* Table or Empty State */}
      {invoices.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <Receipt className="size-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 mb-4">No hay facturas registradas</p>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="size-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Agregar primera factura
          </Button>
        </div>
      ) : (
        <DataTable table={table} minWidth={600} maxHeight="none" />
      )}

      {/* Create Sheet */}
      <InvoiceFormSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        claimId={claimId}
      />

      {/* Edit Sheet */}
      <InvoiceFormSheet
        open={!!editingInvoice}
        onOpenChange={(open) => {
          if (!open) setEditingInvoice(null)
        }}
        claimId={claimId}
        invoice={editingInvoice ?? undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la factura <strong>{deleteConfirm?.invoiceNumber}</strong> permanentemente.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteConfirm) void handleDelete(deleteConfirm)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
