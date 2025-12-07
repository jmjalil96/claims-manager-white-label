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
import { useCreateInsurer } from '../createInsurer'

const createInsurerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(255, 'Máximo 255 caracteres'),
  code: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  email: z.string().email('Email inválido').max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  phone: z.string().max(50, 'Máximo 50 caracteres').optional().or(z.literal('')),
  website: z.string().url('URL inválida').max(255, 'Máximo 255 caracteres').optional().or(z.literal('')),
  taxRate: z.string().optional().or(z.literal('')),
})

type CreateInsurerInput = z.infer<typeof createInsurerSchema>

interface InsurerFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InsurerFormSheet({
  open,
  onOpenChange,
  onSuccess,
}: InsurerFormSheetProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreateInsurer()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInsurerInput>({
    resolver: zodResolver(createInsurerSchema),
    defaultValues: {
      name: '',
      code: '',
      email: '',
      phone: '',
      website: '',
      taxRate: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        code: '',
        email: '',
        phone: '',
        website: '',
        taxRate: '',
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

  const handleSave = async (data: CreateInsurerInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        code: data.code || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        taxRate: data.taxRate ? parseFloat(data.taxRate) : null,
      })
      toast.success('Aseguradora creada exitosamente')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la aseguradora'
      )
    }
  }

  const focusFirstInput = () => {
    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 50)
  }

  const handleSaveAndCreateAnother = async (data: CreateInsurerInput) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        code: data.code || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        taxRate: data.taxRate ? parseFloat(data.taxRate) : null,
      })
      toast.success('Aseguradora creada exitosamente')
      reset({
        name: '',
        code: '',
        email: '',
        phone: '',
        website: '',
        taxRate: '',
      })
      focusFirstInput()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la aseguradora'
      )
    }
  }

  const isPending = createMutation.isPending || isSubmitting

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetHeader>
        <SheetTitle>Nueva Aseguradora</SheetTitle>
        <SheetDescription>
          Ingresa los datos de la nueva aseguradora
        </SheetDescription>
      </SheetHeader>

      <SheetBody>
        <form id="insurer-form" className="space-y-4">
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
              placeholder="Nombre de la aseguradora"
              error={!!errors.name}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="code"
            label="Código"
            error={errors.code?.message}
          >
            <Input
              {...register('code')}
              placeholder="Ej: SEG001"
              error={!!errors.code}
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
              placeholder="correo@aseguradora.com"
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
            name="website"
            label="Sitio Web"
            error={errors.website?.message}
          >
            <Input
              {...register('website')}
              placeholder="https://www.aseguradora.com"
              error={!!errors.website}
              disabled={isPending}
            />
          </FormField>

          <FormField
            name="taxRate"
            label="Tasa de Impuesto (%)"
            error={errors.taxRate?.message}
          >
            <Input
              {...register('taxRate')}
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ej: 18"
              error={!!errors.taxRate}
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
