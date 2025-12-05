import { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import type { InvoiceDto } from '@claims/shared'
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  Button,
  FormField,
  Input,
} from '@/components/ui'
import { toast } from '@/lib'
import { createInvoiceSchema, type CreateInvoiceInput } from '../schemas'
import { useCreateInvoice, useEditInvoice } from '../claimInvoices'

interface InvoiceFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  claimId: string
  invoice?: InvoiceDto // If provided = edit mode, otherwise = create mode
  onSuccess?: () => void
}

export function InvoiceFormSheet({
  open,
  onOpenChange,
  claimId,
  invoice,
  onSuccess,
}: InvoiceFormSheetProps) {
  const isEditMode = !!invoice
  const firstInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreateInvoice(claimId)
  const editMutation = useEditInvoice(claimId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: invoice
      ? {
          invoiceNumber: invoice.invoiceNumber,
          providerName: invoice.providerName,
          amountSubmitted: invoice.amountSubmitted,
        }
      : {
          invoiceNumber: '',
          providerName: '',
          amountSubmitted: 0,
        },
  })

  // Reset form when invoice changes or sheet opens
  useEffect(() => {
    if (open) {
      if (invoice) {
        reset({
          invoiceNumber: invoice.invoiceNumber,
          providerName: invoice.providerName,
          amountSubmitted: invoice.amountSubmitted,
        })
      } else {
        reset({
          invoiceNumber: '',
          providerName: '',
          amountSubmitted: 0,
        })
      }
    }
  }, [open, invoice, reset])

  // Focus first input when sheet opens
  useEffect(() => {
    if (open && !isEditMode) {
      // Small delay to ensure sheet is rendered
      const timer = setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open, isEditMode])

  const handleSave = async (data: CreateInvoiceInput) => {
    try {
      if (isEditMode && invoice) {
        await editMutation.mutateAsync({
          invoiceId: invoice.id,
          data,
        })
        toast.success('Factura actualizada')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Factura creada')
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar la factura'
      )
    }
  }

  const focusFirstInput = () => {
    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 50)
  }

  const handleSaveAndCreateAnother = async (data: CreateInvoiceInput) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Factura creada')
      // Reset form for next entry
      reset({
        invoiceNumber: '',
        providerName: '',
        amountSubmitted: 0,
      })
      // Focus first input
      focusFirstInput()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la factura'
      )
    }
  }

  const isPending = createMutation.isPending || editMutation.isPending || isSubmitting

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>{isEditMode ? 'Editar Factura' : 'Nueva Factura'}</SheetTitle>
        <SheetDescription>
          {isEditMode
            ? 'Modifica los datos de la factura'
            : 'Ingresa los datos de la nueva factura'}
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        <form id="invoice-form" className="space-y-4">
          <FormField
            name="invoiceNumber"
            label="Número de Factura"
            error={errors.invoiceNumber?.message}
            required
          >
            <Input
              {...register('invoiceNumber')}
              ref={(e) => {
                register('invoiceNumber').ref(e)
                if (e) firstInputRef.current = e
              }}
              placeholder="Ej: FAC-001"
              error={!!errors.invoiceNumber}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="providerName"
            label="Nombre del Proveedor"
            error={errors.providerName?.message}
            required
          >
            <Input
              {...register('providerName')}
              placeholder="Ej: Hospital General"
              error={!!errors.providerName}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="amountSubmitted"
            label="Monto"
            error={errors.amountSubmitted?.message}
            required
          >
            <Input
              {...register('amountSubmitted', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              prefix="$"
              error={!!errors.amountSubmitted}
              disabled={isPending}
            />
          </FormField>
        </form>
      </SheetBody>

      <SheetFooter>
        <Button
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancelar
        </Button>

        <div className="flex gap-2">
          {!isEditMode && (
            <Button
              variant="secondary"
              onClick={() => void handleSubmit(handleSaveAndCreateAnother)()}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Guardar y crear otra
            </Button>
          )}

          <Button
            onClick={() => void handleSubmit(handleSave)()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            {isEditMode ? 'Guardar' : 'Guardar'}
          </Button>
        </div>
      </SheetFooter>
    </Sheet>
  )
}
