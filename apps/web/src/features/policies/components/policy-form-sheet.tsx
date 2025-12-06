import { useRef, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { PolicyType, PolicyTypeLabel } from '@claims/shared'
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
  Combobox,
} from '@/components/ui'
import { toast } from '@/lib'
import { useAvailableInsurers, useAvailableClients, useCreatePolicy } from '../createPolicy'

// Validation schema
const createPolicySchema = z.object({
  policyNumber: z.string().min(1, 'Número de póliza requerido').max(50),
  clientId: z.string().min(1, 'Cliente requerido'),
  insurerId: z.string().min(1, 'Aseguradora requerida'),
  type: z.nativeEnum(PolicyType).optional(),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().min(1, 'Fecha de vencimiento requerida'),
})

type CreatePolicyInput = z.infer<typeof createPolicySchema>

interface PolicyFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function PolicyFormSheet({
  open,
  onOpenChange,
  onSuccess,
}: PolicyFormSheetProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreatePolicy()
  const { data: clientsData, isLoading: loadingClients } = useAvailableClients()
  const { data: insurersData, isLoading: loadingInsurers } = useAvailableInsurers()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreatePolicyInput>({
    resolver: zodResolver(createPolicySchema),
    defaultValues: {
      policyNumber: '',
      clientId: '',
      insurerId: '',
      type: undefined,
      startDate: '',
      endDate: '',
    },
  })

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      reset({
        policyNumber: '',
        clientId: '',
        insurerId: '',
        type: undefined,
        startDate: '',
        endDate: '',
      })
    }
  }, [open, reset])

  // Focus first input when sheet opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Transform clients to options
  const clientOptions = useMemo(() => {
    return clientsData?.clients.map((client) => ({
      value: client.id,
      label: client.name,
    })) ?? []
  }, [clientsData])

  // Transform insurers to options
  const insurerOptions = useMemo(() => {
    return insurersData?.insurers.map((insurer) => ({
      value: insurer.id,
      label: insurer.name,
    })) ?? []
  }, [insurersData])

  // Policy type options
  const typeOptions = Object.values(PolicyType).map((value) => ({
    value,
    label: PolicyTypeLabel[value],
  }))

  const handleSave = async (data: CreatePolicyInput) => {
    try {
      await createMutation.mutateAsync({
        policyNumber: data.policyNumber,
        clientId: data.clientId,
        insurerId: data.insurerId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      toast.success('Póliza creada exitosamente')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la póliza'
      )
    }
  }

  const focusFirstInput = () => {
    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 50)
  }

  const handleSaveAndCreateAnother = async (data: CreatePolicyInput) => {
    try {
      await createMutation.mutateAsync({
        policyNumber: data.policyNumber,
        clientId: data.clientId,
        insurerId: data.insurerId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      toast.success('Póliza creada exitosamente')
      // Reset form for next entry
      reset({
        policyNumber: '',
        clientId: '',
        insurerId: '',
        type: undefined,
        startDate: '',
        endDate: '',
      })
      focusFirstInput()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la póliza'
      )
    }
  }

  const isPending = createMutation.isPending || isSubmitting

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Nueva Póliza</SheetTitle>
        <SheetDescription>
          Ingresa los datos de la nueva póliza
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        <form id="policy-form" className="space-y-4">
          <FormField
            name="policyNumber"
            label="Número de Póliza"
            error={errors.policyNumber?.message}
            required
          >
            <Input
              {...register('policyNumber')}
              ref={(e) => {
                register('policyNumber').ref(e)
                if (e) firstInputRef.current = e
              }}
              placeholder="Ej: POL-001"
              error={!!errors.policyNumber}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="clientId"
            label="Cliente"
            error={errors.clientId?.message}
            required
          >
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={clientOptions}
                  value={field.value || null}
                  onChange={(value) => field.onChange(value ?? '')}
                  placeholder={loadingClients ? 'Cargando...' : 'Seleccionar cliente'}
                  disabled={isPending || loadingClients}
                  loading={loadingClients}
                  error={!!errors.clientId}
                />
              )}
            />
          </FormField>

          <FormField
            name="insurerId"
            label="Aseguradora"
            error={errors.insurerId?.message}
            required
          >
            <Controller
              name="insurerId"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={insurerOptions}
                  value={field.value || null}
                  onChange={(value) => field.onChange(value ?? '')}
                  placeholder={loadingInsurers ? 'Cargando...' : 'Seleccionar aseguradora'}
                  disabled={isPending || loadingInsurers}
                  loading={loadingInsurers}
                  error={!!errors.insurerId}
                />
              )}
            />
          </FormField>

          <FormField
            name="type"
            label="Tipo de Póliza"
            error={errors.type?.message}
          >
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={typeOptions}
                  value={field.value ?? null}
                  onChange={(value) => field.onChange(value ?? undefined)}
                  placeholder="Seleccionar tipo (opcional)"
                  disabled={isPending}
                  error={!!errors.type}
                />
              )}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="startDate"
              label="Fecha de Inicio"
              error={errors.startDate?.message}
              required
            >
              <Input
                {...register('startDate')}
                type="date"
                error={!!errors.startDate}
                disabled={isPending}
              />
            </FormField>

            <FormField
              name="endDate"
              label="Fecha de Vencimiento"
              error={errors.endDate?.message}
              required
            >
              <Input
                {...register('endDate')}
                type="date"
                error={!!errors.endDate}
                disabled={isPending}
              />
            </FormField>
          </div>
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

          <Button
            onClick={() => void handleSubmit(handleSave)()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            Guardar
          </Button>
        </div>
      </SheetFooter>
    </Sheet>
  )
}
