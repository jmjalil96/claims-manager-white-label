import { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import { useCreateClient } from '../createClient'

const createClientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255, 'Máximo 255 caracteres'),
  taxId: z.string().min(1, 'RNC/Cédula requerido').max(50, 'Máximo 50 caracteres'),
  email: z.string().email('Email inválido').max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  phone: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  address: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
})

type CreateClientInput = z.infer<typeof createClientSchema>

interface ClientFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ClientFormSheet({
  open,
  onOpenChange,
  onSuccess,
}: ClientFormSheetProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreateClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
      })
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

  const handleSave = async (data: CreateClientInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        taxId: data.taxId,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })
      toast.success('Cliente creado exitosamente')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el cliente'
      )
    }
  }

  const focusFirstInput = () => {
    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 50)
  }

  const handleSaveAndCreateAnother = async (data: CreateClientInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        taxId: data.taxId,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })
      toast.success('Cliente creado exitosamente')
      reset({
        name: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
      })
      focusFirstInput()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el cliente'
      )
    }
  }

  const isPending = createMutation.isPending || isSubmitting

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Nuevo Cliente</SheetTitle>
        <SheetDescription>
          Ingresa los datos del nuevo cliente
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        <form id="client-form" className="space-y-4">
          <FormField
            name="name"
            label="Nombre"
            error={errors.name?.message}
            required
          >
            <Input
              {...register('name')}
              ref={(e) => {
                register('name').ref(e)
                if (e) firstInputRef.current = e
              }}
              placeholder="Nombre del cliente"
              error={!!errors.name}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="taxId"
            label="RNC/Cédula"
            error={errors.taxId?.message}
            required
          >
            <Input
              {...register('taxId')}
              placeholder="Ej: 101-12345-6"
              error={!!errors.taxId}
              disabled={isPending}
            />
          </FormField>

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
              placeholder="Ej: 809-555-1234"
              error={!!errors.phone}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="address"
            label="Dirección"
            error={errors.address?.message}
          >
            <Input
              {...register('address')}
              placeholder="Dirección del cliente"
              error={!!errors.address}
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
