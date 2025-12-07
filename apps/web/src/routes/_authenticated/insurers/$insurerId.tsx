import { useCallback, useSyncExternalStore } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, Mail, Calendar, DollarSign, Loader2 } from 'lucide-react'
import {
  DetailSection,
  EditableText,
  EditableSelect,
  Alert,
} from '@/components/ui'
import type { SelectOption } from '@/components/ui/editable-field'
import { InsurerDetailHeader } from '@/features/insurers'
import { useInsurerDetail, useUpdateInsurer } from '@/features/insurers'
import { insurerFieldSchemas } from '@/features/insurers/schemas'
import type { UpdateInsurerRequestDto } from '@/features/insurers'
import { zodFieldValidator, toast } from '@/lib'

export const Route = createFileRoute('/_authenticated/insurers/$insurerId')({
  component: InsurerDetailPage,
})

const ACTIVE_STATUS_OPTIONS: SelectOption<'true' | 'false'>[] = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

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

function formatDate(isoString: string | null): string {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InsurerDetailPage() {
  const { insurerId } = Route.useParams()
  const isMobile = useIsMobile()

  // NOTE: Editing is intentionally disabled on mobile devices (read-only view)
  // Mobile users should use desktop for insurer editing - this is by design

  const { data, isLoading, isError, error } = useInsurerDetail(insurerId)
  const updateMutation = useUpdateInsurer(insurerId)

  const handleFieldSave = async <K extends keyof UpdateInsurerRequestDto>(
    field: K,
    value: UpdateInsurerRequestDto[K]
  ): Promise<void> => {
    await updateMutation.mutateAsync({ [field]: value })
    toast.success('Campo actualizado correctamente')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert variant="error">
          {error?.message || 'Error al cargar la aseguradora'}
        </Alert>
      </div>
    )
  }

  const { insurer } = data

  return (
    <div className="-m-8 flex flex-col min-h-full">
      {/* Header */}
      <InsurerDetailHeader
        name={insurer.name}
        code={insurer.code}
        isActive={insurer.isActive}
      />

      {/* Main Content */}
      <div className="flex-1 bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Section 1: Información General */}
          <DetailSection title="Información General" icon={<Building2 className="size-4" />} columns={2}>
            <EditableText
              label="Nombre"
              value={insurer.name}
              onSave={(value) => handleFieldSave('name', value || '')}
              placeholder="Nombre de la aseguradora"
              emptyText="No especificado"
              validate={zodFieldValidator(insurerFieldSchemas.name)}
              disabled={isMobile}
            />
            <EditableText
              label="Código"
              value={insurer.code}
              onSave={(value) => handleFieldSave('code', value || null)}
              placeholder="Código de la aseguradora"
              emptyText="No especificado"
              validate={zodFieldValidator(insurerFieldSchemas.code)}
              disabled={isMobile}
            />
            <EditableSelect<'true' | 'false'>
              label="Estado"
              value={insurer.isActive ? 'true' : 'false'}
              options={ACTIVE_STATUS_OPTIONS}
              onSave={(value) => handleFieldSave('isActive', value === 'true')}
              disabled={isMobile}
            />
          </DetailSection>

          {/* Section 2: Contacto */}
          <DetailSection title="Contacto" icon={<Mail className="size-4" />} columns={2}>
            <EditableText
              label="Email"
              value={insurer.email}
              onSave={(value) => handleFieldSave('email', value || null)}
              placeholder="correo@aseguradora.com"
              emptyText="No especificado"
              validate={zodFieldValidator(insurerFieldSchemas.email)}
              disabled={isMobile}
            />
            <EditableText
              label="Teléfono"
              value={insurer.phone}
              onSave={(value) => handleFieldSave('phone', value || null)}
              placeholder="809-555-1234"
              emptyText="No especificado"
              validate={zodFieldValidator(insurerFieldSchemas.phone)}
              disabled={isMobile}
            />
            <EditableText
              label="Sitio Web"
              value={insurer.website}
              onSave={(value) => handleFieldSave('website', value || null)}
              placeholder="https://www.aseguradora.com"
              emptyText="No especificado"
              validate={zodFieldValidator(insurerFieldSchemas.website)}
              disabled={isMobile}
              className="md:col-span-2"
            />
          </DetailSection>

          {/* Section 3: Financiero */}
          <DetailSection title="Financiero" icon={<DollarSign className="size-4" />}>
            <EditableText
              label="Tasa de Impuesto (%)"
              value={insurer.taxRate?.toString() ?? null}
              onSave={(value) => handleFieldSave('taxRate', value ? parseFloat(value) : null)}
              placeholder="18"
              emptyText="No especificado"
              disabled={isMobile}
            />
            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-500">Pólizas</span>
              <p className="text-sm text-slate-900">{insurer.policyCount}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-500">Facturas</span>
              <p className="text-sm text-slate-900">{insurer.invoiceCount}</p>
            </div>
          </DetailSection>

          {/* Section 4: Metadatos - Hidden on mobile */}
          <div className="hidden md:block">
            <DetailSection title="Metadatos" icon={<Calendar className="size-4" />}>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Creado</span>
                <p className="text-sm text-slate-900">{formatDate(insurer.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Actualizado</span>
                <p className="text-sm text-slate-900">{formatDate(insurer.updatedAt)}</p>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  )
}
