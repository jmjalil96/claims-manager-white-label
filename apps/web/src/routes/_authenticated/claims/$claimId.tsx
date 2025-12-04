import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, DollarSign, ClipboardCheck, Info, Folder, History, Loader2, Users } from 'lucide-react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DetailSection,
  EditableText,
  EditableNumber,
  EditableSelect,
  EditableTextarea,
  EditableDate,
  ReadOnlyLink,
  Alert,
} from '@/components/ui'
import { ClaimDetailHeader, ClaimWorkflowStepper } from '@/features/claims/components'
import { useClaimDetail, useUpdateClaimField, claimFieldSchemas } from '@/features/claims'
import { CareType, CareTypeLabel } from '@claims/shared'
import type { ClaimStatus } from '@claims/shared'
import type { UpdateClaimRequestDto } from '@claims/shared'
import { zodFieldValidator, toast } from '@/lib'
import type { SelectOption } from '@/components/ui/editable-field'

export const Route = createFileRoute('/_authenticated/claims/$claimId')({
  component: ClaimDetailPage,
})

const CARE_TYPE_OPTIONS: SelectOption<CareType>[] = Object.values(CareType).map((value) => ({
  value,
  label: CareTypeLabel[value],
}))

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

function ClaimDetailPage() {
  const { claimId } = Route.useParams()
  const [activeTab, setActiveTab] = useState('info')

  const { data, isLoading, isError, error } = useClaimDetail(claimId)
  const updateMutation = useUpdateClaimField(claimId)

  const handleFieldSave = async <K extends keyof UpdateClaimRequestDto>(
    field: K,
    value: UpdateClaimRequestDto[K]
  ): Promise<void> => {
    await updateMutation.mutateAsync({ [field]: value })
    toast.success('Campo actualizado correctamente')
  }

  const handleStatusTransition = (toStatus: ClaimStatus): void => {
    updateMutation.mutate(
      { status: toStatus },
      {
        onSuccess: () => toast.success('Estado actualizado correctamente'),
        onError: () => toast.error('Error al actualizar el estado'),
      }
    )
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
          {error?.message || 'Error al cargar el reclamo'}
        </Alert>
      </div>
    )
  }

  const { claim } = data

  return (
    <div className="-m-8 flex flex-col min-h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} variant="line" className="flex flex-col flex-1">
        {/* Master Header with integrated tabs - white background */}
        <ClaimDetailHeader
          claimNumber={claim.claimNumber}
          status={claim.status}
          careType={claim.careType}
        >
          <TabsList>
            <TabsTrigger value="info" icon={<Info className="size-4" />}>
              Información
            </TabsTrigger>
            <TabsTrigger value="files" icon={<Folder className="size-4" />}>
              Archivos
            </TabsTrigger>
            <TabsTrigger value="history" icon={<History className="size-4" />}>
              Historial
            </TabsTrigger>
          </TabsList>
        </ClaimDetailHeader>

        {/* Main Content Area - gray background fills remaining space */}
        <div className="flex-1 bg-slate-50/50 pb-20">
          <div className="max-w-7xl mx-auto px-8 py-8">
          <TabsContent value="info" className="space-y-8">
            {/* Workflow Stepper - now inside Info tab */}
            <ClaimWorkflowStepper
              currentStatus={claim.status}
              pendingReason={claim.pendingReason}
              returnReason={claim.returnReason}
              cancellationReason={claim.cancellationReason}
              onTransition={handleStatusTransition}
            />

            {/* Section 0: Relaciones */}
            <DetailSection title="Relaciones" icon={<Users className="size-4" />} columns={2}>
              <ReadOnlyLink
                label="Cliente"
                value={claim.clientName}
                href={`/clients/${claim.clientId}`}
              />
              <ReadOnlyLink
                label="Afiliado"
                value={claim.affiliateName}
                href={`/affiliates/${claim.affiliateId}`}
              />
              <ReadOnlyLink
                label="Paciente"
                value={claim.patientName}
                href={`/affiliates/${claim.patientId}`}
              />
              <ReadOnlyLink
                label="Póliza"
                value={claim.policyNumber}
                href={claim.policyId ? `/policies/${claim.policyId}` : undefined}
                emptyText="Sin póliza asignada"
              />
            </DetailSection>

            {/* Section 1: Información General */}
            <DetailSection title="Información General" icon={<FileText className="size-4" />}>
              <EditableTextarea
                label="Descripción"
                value={claim.description}
                onSave={(value) => handleFieldSave('description', value || null)}
                placeholder="Descripción del reclamo"
                emptyText="Sin descripción"
                validate={zodFieldValidator(claimFieldSchemas.description)}
                rows={3}
              />
              <EditableSelect<CareType>
                label="Tipo de Atención"
                value={claim.careType}
                options={CARE_TYPE_OPTIONS}
                onSave={(value) => handleFieldSave('careType', value)}
                placeholder="Seleccionar tipo"
                emptyText="No especificado"
                validate={zodFieldValidator(claimFieldSchemas.careType)}
              />
              <EditableText
                label="Código de Diagnóstico"
                value={claim.diagnosisCode}
                onSave={(value) => handleFieldSave('diagnosisCode', value || null)}
                placeholder="Ej: A00.0"
                emptyText="No especificado"
                validate={zodFieldValidator(claimFieldSchemas.diagnosisCode)}
              />
              <EditableTextarea
                label="Descripción del Diagnóstico"
                value={claim.diagnosisDescription}
                onSave={(value) => handleFieldSave('diagnosisDescription', value || null)}
                placeholder="Descripción del diagnóstico"
                emptyText="Sin descripción"
                validate={zodFieldValidator(claimFieldSchemas.diagnosisDescription)}
                rows={2}
              />
              <EditableDate
                label="Fecha del Incidente"
                value={claim.incidentDate}
                onSave={(value) => handleFieldSave('incidentDate', value)}
                emptyText="No especificada"
                validate={zodFieldValidator(claimFieldSchemas.incidentDate)}
              />
            </DetailSection>

            {/* Section 2: Información Financiera */}
            <DetailSection title="Información Financiera" icon={<DollarSign className="size-4" />} columns={3}>
              <EditableNumber
                label="Monto Presentado"
                value={claim.amountSubmitted}
                onSave={(value) => handleFieldSave('amountSubmitted', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.amountSubmitted)}
              />
              <EditableNumber
                label="Monto Aprobado"
                value={claim.amountApproved}
                onSave={(value) => handleFieldSave('amountApproved', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.amountApproved)}
              />
              <EditableNumber
                label="Monto Denegado"
                value={claim.amountDenied}
                onSave={(value) => handleFieldSave('amountDenied', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.amountDenied)}
              />
              <EditableNumber
                label="Monto No Procesado"
                value={claim.amountUnprocessed}
                onSave={(value) => handleFieldSave('amountUnprocessed', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.amountUnprocessed)}
              />
              <EditableNumber
                label="Deducible Aplicado"
                value={claim.deductibleApplied}
                onSave={(value) => handleFieldSave('deductibleApplied', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.deductibleApplied)}
              />
              <EditableNumber
                label="Copago Aplicado"
                value={claim.copayApplied}
                onSave={(value) => handleFieldSave('copayApplied', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.copayApplied)}
              />
            </DetailSection>

            {/* Section 3: Liquidación */}
            <DetailSection title="Liquidación" icon={<ClipboardCheck className="size-4" />}>
              <EditableDate
                label="Fecha de Presentación"
                value={claim.submittedDate}
                onSave={(value) => handleFieldSave('submittedDate', value)}
                emptyText="No especificada"
                validate={zodFieldValidator(claimFieldSchemas.submittedDate)}
              />
              <EditableDate
                label="Fecha de Liquidación"
                value={claim.settlementDate}
                onSave={(value) => handleFieldSave('settlementDate', value)}
                emptyText="No especificada"
                validate={zodFieldValidator(claimFieldSchemas.settlementDate)}
              />
              <EditableText
                label="Número de Liquidación"
                value={claim.settlementNumber}
                onSave={(value) => handleFieldSave('settlementNumber', value || null)}
                placeholder="Ej: LIQ-2024-001"
                emptyText="No especificado"
                validate={zodFieldValidator(claimFieldSchemas.settlementNumber)}
              />
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Días Hábiles</span>
                <p className="text-sm text-slate-900">
                  {claim.businessDays !== null ? claim.businessDays : '-'}
                </p>
              </div>
              <EditableTextarea
                label="Notas de Liquidación"
                value={claim.settlementNotes}
                onSave={(value) => handleFieldSave('settlementNotes', value || null)}
                placeholder="Notas adicionales"
                emptyText="Sin notas"
                validate={zodFieldValidator(claimFieldSchemas.settlementNotes)}
                rows={3}
                className="md:col-span-2"
              />
            </DetailSection>

            {/* Section 4: Metadatos */}
            <DetailSection title="Metadatos" icon={<Info className="size-4" />}>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Creado</span>
                <p className="text-sm text-slate-900">{formatDate(claim.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Actualizado</span>
                <p className="text-sm text-slate-900">{formatDate(claim.updatedAt)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Creado Por</span>
                <p className="text-sm text-slate-900 font-mono text-xs">{claim.createdById}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-500">Actualizado Por</span>
                <p className="text-sm text-slate-900 font-mono text-xs">
                  {claim.updatedById || '-'}
                </p>
              </div>
            </DetailSection>
          </TabsContent>

          <TabsContent value="files" className="mt-8">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 border-dashed border-2 border-slate-200 p-12 text-center">
              <Folder className="size-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">Archivos</h3>
              <p className="text-sm text-slate-500">Próximamente</p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-8">
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 border-dashed border-2 border-slate-200 p-12 text-center">
              <History className="size-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">Historial</h3>
              <p className="text-sm text-slate-500">Próximamente</p>
            </div>
          </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
