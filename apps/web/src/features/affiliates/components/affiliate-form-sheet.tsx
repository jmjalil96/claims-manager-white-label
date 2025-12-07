import { useRef, useEffect, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
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
  type ComboboxOption,
} from '@/components/ui'
import { toast } from '@/lib'
import { apiClient } from '@/lib/api-client'
import type { GetAvailableClientsResponse, GetAvailableOwnersResponse } from '@claims/shared'
import { useCreateAffiliate } from '../createAffiliate'

const createAffiliateSchema = z.object({
  clientId: z.string().min(1, 'Cliente requerido'),
  firstName: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().min(1, 'Apellido requerido').max(100, 'Máximo 100 caracteres'),
  documentType: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  documentNumber: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  email: z.string().email('Email inválido').max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  phone: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  maritalStatus: z.string().optional().or(z.literal('')),
  primaryAffiliateId: z.string().optional().or(z.literal('')),
  relationship: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    // If primaryAffiliateId is set, relationship is required
    if (data.primaryAffiliateId && data.primaryAffiliateId !== '' && (!data.relationship || data.relationship === '')) {
      return false
    }
    return true
  },
  {
    message: 'Relación requerida para dependientes',
    path: ['relationship'],
  }
)

type CreateAffiliateInput = z.infer<typeof createAffiliateSchema>

const DOCUMENT_TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'DPI', label: 'DPI' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'MENOR', label: 'Menor' },
  { value: 'OTHER', label: 'Otro' },
]

const GENDER_OPTIONS: ComboboxOption[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'OTHER', label: 'Otro' },
]

const MARITAL_STATUS_OPTIONS: ComboboxOption[] = [
  { value: 'SINGLE', label: 'Soltero/a' },
  { value: 'MARRIED', label: 'Casado/a' },
  { value: 'DIVORCED', label: 'Divorciado/a' },
  { value: 'WIDOWED', label: 'Viudo/a' },
  { value: 'DOMESTIC_PARTNER', label: 'Unión libre' },
]

const RELATIONSHIP_OPTIONS: ComboboxOption[] = [
  { value: 'SPOUSE', label: 'Cónyuge' },
  { value: 'CHILD', label: 'Hijo/a' },
  { value: 'PARENT', label: 'Padre/Madre' },
  { value: 'DOMESTIC_PARTNER', label: 'Pareja' },
  { value: 'SIBLING', label: 'Hermano/a' },
  { value: 'OTHER', label: 'Otro' },
]

interface AffiliateFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AffiliateFormSheet({
  open,
  onOpenChange,
  onSuccess,
}: AffiliateFormSheetProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  const createMutation = useCreateAffiliate()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAffiliateInput>({
    resolver: zodResolver(createAffiliateSchema),
    defaultValues: {
      clientId: '',
      firstName: '',
      lastName: '',
      documentType: '',
      documentNumber: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      primaryAffiliateId: '',
      relationship: '',
    },
  })

  // Watch for changes to form fields
  // eslint-disable-next-line react-hooks/incompatible-library -- watch() needed for conditional form logic
  const watchedClientId = watch('clientId')
  const watchedPrimaryAffiliateId = watch('primaryAffiliateId')

  // Sync local state with form state
  useEffect(() => {
    if (watchedClientId !== selectedClientId) {
      setSelectedClientId(watchedClientId)
      // Reset owner selection when client changes
      setValue('primaryAffiliateId', '')
      setValue('relationship', '')
    }
  }, [watchedClientId, selectedClientId, setValue])

  // Fetch available clients
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['affiliates', 'available-clients'],
    queryFn: () => apiClient<GetAvailableClientsResponse>('/affiliates/clients'),
    enabled: open,
  })

  // Fetch available owners for selected client
  const { data: ownersData, isLoading: ownersLoading } = useQuery({
    queryKey: ['affiliates', 'available-owners', selectedClientId],
    queryFn: () => apiClient<GetAvailableOwnersResponse>(`/affiliates/clients/${selectedClientId}/owners`),
    enabled: open && !!selectedClientId,
  })

  // Transform data to combobox options
  const clientOptions: ComboboxOption[] = useMemo(
    () =>
      clientsData?.clients.map((c) => ({
        value: c.id,
        label: c.name,
        description: c.taxId,
      })) ?? [],
    [clientsData]
  )

  const ownerOptions: ComboboxOption[] = useMemo(
    () => [
      { value: '', label: 'Ninguno (crear como titular)' },
      ...(ownersData?.owners.map((o) => ({
        value: o.id,
        label: `${o.firstName} ${o.lastName}`,
        description: o.documentNumber ?? o.email ?? undefined,
      })) ?? []),
    ],
    [ownersData]
  )

  useEffect(() => {
    if (open) {
      reset({
        clientId: '',
        firstName: '',
        lastName: '',
        documentType: '',
        documentNumber: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        maritalStatus: '',
        primaryAffiliateId: '',
        relationship: '',
      })
      setSelectedClientId('')
    }
  }, [open, reset])

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSave = async (data: CreateAffiliateInput) => {
    try {
      await createMutation.mutateAsync({
        clientId: data.clientId,
        firstName: data.firstName,
        lastName: data.lastName,
        documentType: data.documentType || null,
        documentNumber: data.documentNumber || null,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: (data.gender as 'MALE' | 'FEMALE' | 'OTHER') || null,
        maritalStatus: (data.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'DOMESTIC_PARTNER') || null,
        primaryAffiliateId: data.primaryAffiliateId || null,
        relationship: (data.relationship as 'SPOUSE' | 'CHILD' | 'PARENT' | 'DOMESTIC_PARTNER' | 'SIBLING' | 'OTHER') || null,
      })
      toast.success('Afiliado creado exitosamente')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el afiliado'
      )
    }
  }

  const focusFirstInput = () => {
    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 50)
  }

  const handleSaveAndCreateAnother = async (data: CreateAffiliateInput) => {
    try {
      await createMutation.mutateAsync({
        clientId: data.clientId,
        firstName: data.firstName,
        lastName: data.lastName,
        documentType: data.documentType || null,
        documentNumber: data.documentNumber || null,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: (data.gender as 'MALE' | 'FEMALE' | 'OTHER') || null,
        maritalStatus: (data.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'DOMESTIC_PARTNER') || null,
        primaryAffiliateId: data.primaryAffiliateId || null,
        relationship: (data.relationship as 'SPOUSE' | 'CHILD' | 'PARENT' | 'DOMESTIC_PARTNER' | 'SIBLING' | 'OTHER') || null,
      })
      toast.success('Afiliado creado exitosamente')
      reset({
        clientId: data.clientId, // Keep same client
        firstName: '',
        lastName: '',
        documentType: '',
        documentNumber: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        maritalStatus: '',
        primaryAffiliateId: '',
        relationship: '',
      })
      focusFirstInput()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el afiliado'
      )
    }
  }

  const isPending = createMutation.isPending || isSubmitting

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Nuevo Afiliado</SheetTitle>
        <SheetDescription>
          Ingresa los datos del nuevo afiliado
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        <form id="affiliate-form" className="space-y-4">
          {/* Client Selection */}
          <FormField
            name="clientId"
            label="Cliente"
            error={errors.clientId?.message}
            required
          >
            <Combobox
              options={clientOptions}
              value={watchedClientId}
              onChange={(value) => setValue('clientId', value ?? '')}
              placeholder={clientsLoading ? 'Cargando...' : 'Seleccionar cliente'}
              emptyMessage="No hay clientes disponibles"
              disabled={isPending || clientsLoading}
            />
          </FormField>

          {/* Required Fields */}
          <FormField
            name="firstName"
            label="Nombre"
            error={errors.firstName?.message}
            required
          >
            <Input
              {...register('firstName')}
              ref={(e) => {
                register('firstName').ref(e)
                if (e) firstInputRef.current = e
              }}
              placeholder="Nombre del afiliado"
              error={!!errors.firstName}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="lastName"
            label="Apellido"
            error={errors.lastName?.message}
            required
          >
            <Input
              {...register('lastName')}
              placeholder="Apellido del afiliado"
              error={!!errors.lastName}
              disabled={isPending}
            />
          </FormField>

          {/* Document Fields */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="documentType"
              label="Tipo de documento"
              error={errors.documentType?.message}
            >
              <Combobox
                options={DOCUMENT_TYPE_OPTIONS}
                value={watch('documentType') || ''}
                onChange={(value) => setValue('documentType', value ?? '')}
                placeholder="Seleccionar"
                emptyMessage="Sin opciones"
                disabled={isPending}
              />
            </FormField>

            <FormField
              name="documentNumber"
              label="Número de documento"
              error={errors.documentNumber?.message}
            >
              <Input
                {...register('documentNumber')}
                placeholder="Ej: 1234567890101"
                error={!!errors.documentNumber}
                disabled={isPending}
              />
            </FormField>
          </div>

          {/* Contact Fields */}
          <FormField
            name="email"
            label="Email"
            error={errors.email?.message}
          >
            <Input
              {...register('email')}
              type="email"
              placeholder="correo@ejemplo.com"
              error={!!errors.email}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="phone"
            label="Teléfono"
            error={errors.phone?.message}
          >
            <Input
              {...register('phone')}
              placeholder="Ej: 5555-1234"
              error={!!errors.phone}
              disabled={isPending}
            />
          </FormField>

          {/* Personal Info Fields */}
          <FormField
            name="dateOfBirth"
            label="Fecha de nacimiento"
            error={errors.dateOfBirth?.message}
          >
            <Input
              {...register('dateOfBirth')}
              type="date"
              error={!!errors.dateOfBirth}
              disabled={isPending}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="gender"
              label="Género"
              error={errors.gender?.message}
            >
              <Combobox
                options={GENDER_OPTIONS}
                value={watch('gender') || ''}
                onChange={(value) => setValue('gender', value ?? '')}
                placeholder="Seleccionar"
                emptyMessage="Sin opciones"
                disabled={isPending}
              />
            </FormField>

            <FormField
              name="maritalStatus"
              label="Estado civil"
              error={errors.maritalStatus?.message}
            >
              <Combobox
                options={MARITAL_STATUS_OPTIONS}
                value={watch('maritalStatus') || ''}
                onChange={(value) => setValue('maritalStatus', value ?? '')}
                placeholder="Seleccionar"
                emptyMessage="Sin opciones"
                disabled={isPending}
              />
            </FormField>
          </div>

          {/* Dependent Fields - Only show if client selected */}
          {selectedClientId && (
            <>
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Dependiente de (opcional)
                </p>
              </div>

              <FormField
                name="primaryAffiliateId"
                label="Titular"
                error={errors.primaryAffiliateId?.message}
              >
                <Combobox
                  options={ownerOptions}
                  value={watchedPrimaryAffiliateId || ''}
                  onChange={(value) => setValue('primaryAffiliateId', value ?? '')}
                  placeholder={ownersLoading ? 'Cargando...' : 'Seleccionar titular'}
                  emptyMessage="No hay titulares disponibles"
                  disabled={isPending || ownersLoading}
                />
              </FormField>

              {watchedPrimaryAffiliateId && (
                <FormField
                  name="relationship"
                  label="Relación con el titular"
                  error={errors.relationship?.message}
                  required
                >
                  <Combobox
                    options={RELATIONSHIP_OPTIONS}
                    value={watch('relationship') || ''}
                    onChange={(value) => setValue('relationship', value ?? '')}
                    placeholder="Seleccionar relación"
                    emptyMessage="Sin opciones"
                    disabled={isPending}
                  />
                </FormField>
              )}
            </>
          )}
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
            Guardar y crear otro
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
