import { useCallback, useSyncExternalStore } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Building2, Mail, Calendar, Loader2 } from 'lucide-react'
import {
  DetailSection,
  EditableText,
  EditableSelect,
  Alert,
} from '@/components/ui'
import type { SelectOption } from '@/components/ui/editable-field'
import { ClientDetailHeader } from '@/features/clients'
import { useClientDetail, useUpdateClient } from '@/features/clients'
import { clientFieldSchemas } from '@/features/clients/schemas'
import type { UpdateClientRequestDto } from '@/features/clients'
import { zodFieldValidator, toast } from '@/lib'

export const Route = createFileRoute('/_authenticated/clients/$clientId')({
  component: ClientDetailPage,
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

function ClientDetailPage() {
  const { clientId } = Route.useParams()
  const isMobile = useIsMobile()

  // NOTE: Editing is intentionally disabled on mobile devices (read-only view)
  // Mobile users should use desktop for client editing - this is by design

  const { data, isLoading, isError, error } = useClientDetail(clientId)
  const updateMutation = useUpdateClient(clientId)

  const handleFieldSave = async <K extends keyof UpdateClientRequestDto>(
    field: K,
    value: UpdateClientRequestDto[K]
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
          {error?.message || 'Error al cargar el cliente'}
        </Alert>
      </div>
    )
  }

  const { client } = data

  return (
    <div className="-m-8 flex flex-col min-h-full">
      {/* Header */}
      <ClientDetailHeader
        name={client.name}
        taxId={client.taxId}
        isActive={client.isActive}
      />

      {/* Main Content */}
      <div className="flex-1 bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Section 1: Información General */}
          <DetailSection title="Información General" icon={<Building2 className="size-4" />} columns={2}>
            <EditableText
              label="Nombre"
              value={client.name}
              onSave={(value) => handleFieldSave('name', value || '')}
              placeholder="Nombre del cliente"
              emptyText="No especificado"
              validate={zodFieldValidator(clientFieldSchemas.name)}
              disabled={isMobile}
            />
            <EditableText
              label="RNC/Cédula"
              value={client.taxId}
              onSave={(value) => handleFieldSave('taxId', value || '')}
              placeholder="RNC o cédula"
              emptyText="No especificado"
              validate={zodFieldValidator(clientFieldSchemas.taxId)}
              disabled={isMobile}
            />
            <EditableSelect<'true' | 'false'>
              label="Estado"
              value={client.isActive ? 'true' : 'false'}
              options={ACTIVE_STATUS_OPTIONS}
              onSave={(value) => handleFieldSave('isActive', value === 'true')}
              disabled={isMobile}
            />
          </DetailSection>

          {/* Section 2: Contacto */}
          <DetailSection title="Contacto" icon={<Mail className="size-4" />} columns={2}>
            <EditableText
              label="Email"
              value={client.email}
              onSave={(value) => handleFieldSave('email', value || null)}
              placeholder="correo@ejemplo.com"
              emptyText="No especificado"
              validate={zodFieldValidator(clientFieldSchemas.email)}
              disabled={isMobile}
            />
            <EditableText
              label="Teléfono"
              value={client.phone}
              onSave={(value) => handleFieldSave('phone', value || null)}
              placeholder="809-555-1234"
              emptyText="No especificado"
              validate={zodFieldValidator(clientFieldSchemas.phone)}
              disabled={isMobile}
            />
            <EditableText
              label="Dirección"
              value={client.address}
              onSave={(value) => handleFieldSave('address', value || null)}
              placeholder="Dirección del cliente"
              emptyText="No especificada"
              validate={zodFieldValidator(clientFieldSchemas.address)}
              disabled={isMobile}
              className="md:col-span-2"
            />
          </DetailSection>

          {/* Section 3: Metadatos - Hidden on mobile */}
          <div className="hidden md:block">
            <DetailSection title="Metadatos" icon={<Calendar className="size-4" />}>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Creado</span>
                <p className="text-sm text-slate-900">{formatDate(client.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Actualizado</span>
                <p className="text-sm text-slate-900">{formatDate(client.updatedAt)}</p>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  )
}
