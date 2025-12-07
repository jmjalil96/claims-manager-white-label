import { useCallback, useSyncExternalStore } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { User, Mail, Calendar, Users, Loader2 } from 'lucide-react'
import {
  DetailSection,
  EditableText,
  EditableSelect,
  Alert,
} from '@/components/ui'
import type { SelectOption } from '@/components/ui/editable-field'
import { AffiliateDetailHeader } from '@/features/affiliates'
import { useAffiliateDetail, useUpdateAffiliate } from '@/features/affiliates'
import { affiliateFieldSchemas } from '@/features/affiliates/schemas'
import type { UpdateAffiliateRequestDto } from '@/features/affiliates'
import { zodFieldValidator, toast } from '@/lib'

export const Route = createFileRoute('/_authenticated/affiliates/$affiliateId')({
  component: AffiliateDetailPage,
})

const ACTIVE_STATUS_OPTIONS: SelectOption<'true' | 'false'>[] = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

const DOCUMENT_TYPE_OPTIONS: SelectOption<string>[] = [
  { value: 'DPI', label: 'DPI' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'MENOR', label: 'Menor' },
  { value: 'OTHER', label: 'Otro' },
]

const GENDER_OPTIONS: SelectOption<string>[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Femenino' },
  { value: 'OTHER', label: 'Otro' },
]

const MARITAL_STATUS_OPTIONS: SelectOption<string>[] = [
  { value: 'SINGLE', label: 'Soltero/a' },
  { value: 'MARRIED', label: 'Casado/a' },
  { value: 'DIVORCED', label: 'Divorciado/a' },
  { value: 'WIDOWED', label: 'Viudo/a' },
  { value: 'DOMESTIC_PARTNER', label: 'Unión libre' },
]

const RELATIONSHIP_OPTIONS: SelectOption<string>[] = [
  { value: 'SPOUSE', label: 'Cónyuge' },
  { value: 'CHILD', label: 'Hijo/a' },
  { value: 'PARENT', label: 'Padre/Madre' },
  { value: 'DOMESTIC_PARTNER', label: 'Pareja' },
  { value: 'SIBLING', label: 'Hermano/a' },
  { value: 'OTHER', label: 'Otro' },
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

function formatDateOnly(isoString: string | null): string {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getRelationshipLabel(relationship: string | null): string {
  const option = RELATIONSHIP_OPTIONS.find((o) => o.value === relationship)
  return option?.label ?? '-'
}

function AffiliateDetailPage() {
  const { affiliateId } = Route.useParams()
  const isMobile = useIsMobile()

  // NOTE: Editing is intentionally disabled on mobile devices (read-only view)
  // Mobile users should use desktop for affiliate editing - this is by design

  const { data, isLoading, isError, error } = useAffiliateDetail(affiliateId)
  const updateMutation = useUpdateAffiliate(affiliateId)

  const handleFieldSave = async <K extends keyof UpdateAffiliateRequestDto>(
    field: K,
    value: UpdateAffiliateRequestDto[K]
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
          {error?.message || 'Error al cargar el afiliado'}
        </Alert>
      </div>
    )
  }

  const { affiliate } = data

  return (
    <div className="-m-8 flex flex-col min-h-full">
      {/* Header */}
      <AffiliateDetailHeader
        firstName={affiliate.firstName}
        lastName={affiliate.lastName}
        documentNumber={affiliate.documentNumber}
        isOwner={affiliate.isOwner}
        isActive={affiliate.isActive}
        clientName={affiliate.clientName}
      />

      {/* Main Content */}
      <div className="flex-1 bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Section 1: Información Personal */}
          <DetailSection title="Información Personal" icon={<User className="size-4" />} columns={2}>
            <EditableText
              label="Nombre"
              value={affiliate.firstName}
              onSave={(value) => handleFieldSave('firstName', value || '')}
              placeholder="Nombre"
              emptyText="No especificado"
              validate={zodFieldValidator(affiliateFieldSchemas.firstName)}
              disabled={isMobile}
            />
            <EditableText
              label="Apellido"
              value={affiliate.lastName}
              onSave={(value) => handleFieldSave('lastName', value || '')}
              placeholder="Apellido"
              emptyText="No especificado"
              validate={zodFieldValidator(affiliateFieldSchemas.lastName)}
              disabled={isMobile}
            />
            <EditableSelect<string>
              label="Tipo de documento"
              value={affiliate.documentType || ''}
              options={DOCUMENT_TYPE_OPTIONS}
              onSave={(value) => handleFieldSave('documentType', value || null)}
              disabled={isMobile}
            />
            <EditableText
              label="Número de documento"
              value={affiliate.documentNumber}
              onSave={(value) => handleFieldSave('documentNumber', value || null)}
              placeholder="Número de documento"
              emptyText="No especificado"
              validate={zodFieldValidator(affiliateFieldSchemas.documentNumber)}
              disabled={isMobile}
            />
            <EditableText
              label="Fecha de nacimiento"
              value={affiliate.dateOfBirth ? formatDateOnly(affiliate.dateOfBirth) : null}
              onSave={(value) => handleFieldSave('dateOfBirth', value || null)}
              placeholder="DD/MM/AAAA"
              emptyText="No especificada"
              disabled={isMobile}
            />
            <EditableSelect<string>
              label="Género"
              value={affiliate.gender || ''}
              options={GENDER_OPTIONS}
              onSave={(value) => handleFieldSave('gender', (value as 'MALE' | 'FEMALE' | 'OTHER') || null)}
              disabled={isMobile}
            />
            <EditableSelect<string>
              label="Estado civil"
              value={affiliate.maritalStatus || ''}
              options={MARITAL_STATUS_OPTIONS}
              onSave={(value) => handleFieldSave('maritalStatus', (value as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'DOMESTIC_PARTNER') || null)}
              disabled={isMobile}
            />
            <EditableSelect<'true' | 'false'>
              label="Estado"
              value={affiliate.isActive ? 'true' : 'false'}
              options={ACTIVE_STATUS_OPTIONS}
              onSave={(value) => handleFieldSave('isActive', value === 'true')}
              disabled={isMobile}
            />
          </DetailSection>

          {/* Section 2: Contacto */}
          <DetailSection title="Contacto" icon={<Mail className="size-4" />} columns={2}>
            <EditableText
              label="Email"
              value={affiliate.email}
              onSave={(value) => handleFieldSave('email', value || null)}
              placeholder="correo@ejemplo.com"
              emptyText="No especificado"
              validate={zodFieldValidator(affiliateFieldSchemas.email)}
              disabled={isMobile}
            />
            <EditableText
              label="Teléfono"
              value={affiliate.phone}
              onSave={(value) => handleFieldSave('phone', value || null)}
              placeholder="5555-1234"
              emptyText="No especificado"
              validate={zodFieldValidator(affiliateFieldSchemas.phone)}
              disabled={isMobile}
            />
          </DetailSection>

          {/* Section 3: Relación (only for dependents) */}
          {!affiliate.isOwner && affiliate.primaryAffiliate && (
            <DetailSection title="Relación" icon={<Users className="size-4" />} columns={2}>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Titular</span>
                <p className="text-sm text-slate-900">
                  <Link
                    to="/affiliates/$affiliateId"
                    params={{ affiliateId: affiliate.primaryAffiliate.id }}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {affiliate.primaryAffiliate.firstName} {affiliate.primaryAffiliate.lastName}
                  </Link>
                </p>
              </div>
              <EditableSelect<string>
                label="Relación"
                value={affiliate.relationship || ''}
                options={RELATIONSHIP_OPTIONS}
                onSave={(value) => handleFieldSave('relationship', (value as 'SPOUSE' | 'CHILD' | 'PARENT' | 'DOMESTIC_PARTNER' | 'SIBLING' | 'OTHER') || null)}
                disabled={isMobile}
              />
            </DetailSection>
          )}

          {/* Section 4: Dependientes (only for owners with dependents) */}
          {affiliate.isOwner && affiliate.dependents.length > 0 && (
            <DetailSection title="Dependientes" icon={<Users className="size-4" />}>
              <div className="col-span-full">
                <div className="space-y-2">
                  {affiliate.dependents.map((dependent) => (
                    <Link
                      key={dependent.id}
                      to="/affiliates/$affiliateId"
                      params={{ affiliateId: dependent.id }}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <span className="font-medium text-slate-900">
                          {dependent.firstName} {dependent.lastName}
                        </span>
                        <span className="text-sm text-slate-500 ml-2">
                          ({getRelationshipLabel(dependent.relationship)})
                        </span>
                      </div>
                      <span className={`text-sm ${dependent.isActive ? 'text-green-600' : 'text-slate-500'}`}>
                        {dependent.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </DetailSection>
          )}

          {/* Section 5: Metadatos - Hidden on mobile */}
          <div className="hidden md:block">
            <DetailSection title="Metadatos" icon={<Calendar className="size-4" />} columns={2}>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Cliente</span>
                <p className="text-sm text-slate-900">
                  <Link
                    to="/clients/$clientId"
                    params={{ clientId: affiliate.clientId }}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {affiliate.clientName}
                  </Link>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Tipo</span>
                <p className="text-sm text-slate-900">{affiliate.isOwner ? 'Titular' : 'Dependiente'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Creado</span>
                <p className="text-sm text-slate-900">{formatDate(affiliate.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Actualizado</span>
                <p className="text-sm text-slate-900">{formatDate(affiliate.updatedAt)}</p>
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  )
}
