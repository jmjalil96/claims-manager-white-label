import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, DollarSign, ClipboardCheck, Info, Folder, History, Loader2, Users, Clock, Receipt } from 'lucide-react'
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
  EditableCombobox,
  ReadOnlyLink,
  Alert,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  Textarea,
  Input,
  Label,
} from '@/components/ui'
import { ClaimDetailHeader, ClaimWorkflowStepper, ClaimFilesTab, ClaimHistoryTab, ClaimSlaTab, ClaimInvoicesTab } from '@/features/claims/components'
import { useClaimDetail, useUpdateClaimField, useClaimPolicies, claimFieldSchemas } from '@/features/claims'
import { CareType, CareTypeLabel, ClaimStatus, ClaimStatusLabel } from '@claims/shared'
import type { UpdateClaimRequestDto } from '@claims/shared'
import { zodFieldValidator, toast } from '@/lib'
import type { SelectOption } from '@/components/ui/editable-field'
import type { ComboboxOption } from '@/components/ui/combobox'

export const Route = createFileRoute('/_authenticated/claims/$claimId')({
  component: ClaimDetailPage,
})

const CARE_TYPE_OPTIONS: SelectOption<CareType>[] = Object.values(CareType).map((value) => ({
  value,
  label: CareTypeLabel[value],
}))

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

// Transition dialog configuration
interface TransitionConfig {
  title: string
  description: string
  confirmLabel: string
  variant: 'default' | 'destructive'
  requiresReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  reasonField?: 'pendingReason' | 'returnReason' | 'cancellationReason' | 'reprocessDescription'
  requiresDate?: boolean
  dateLabel?: string
  dateField?: 'reprocessDate'
}

const TRANSITION_CONFIG: Partial<Record<ClaimStatus, TransitionConfig>> = {
  [ClaimStatus.VALIDATION]: {
    title: 'Enviar a Validación',
    description: 'El reclamo será enviado al equipo de validación para su revisión.',
    confirmLabel: 'Enviar',
    variant: 'default',
  },
  [ClaimStatus.SUBMITTED]: {
    title: 'Presentar Reclamo',
    description: 'El reclamo será marcado como presentado a la aseguradora.',
    confirmLabel: 'Presentar',
    variant: 'default',
  },
  [ClaimStatus.PENDING_INFO]: {
    title: 'Solicitar Información',
    description: 'El reclamo quedará en espera hasta recibir la información solicitada.',
    confirmLabel: 'Solicitar',
    variant: 'default',
    requiresReason: true,
    reasonLabel: 'Información requerida',
    reasonPlaceholder: 'Describa la información que necesita del cliente...',
    reasonField: 'pendingReason',
  },
  [ClaimStatus.RETURNED]: {
    title: 'Devolver Reclamo',
    description: 'El reclamo será devuelto y requerirá correcciones antes de continuar.',
    confirmLabel: 'Devolver',
    variant: 'destructive',
    requiresReason: true,
    reasonLabel: 'Motivo de devolución',
    reasonPlaceholder: 'Explique el motivo de la devolución...',
    reasonField: 'returnReason',
  },
  [ClaimStatus.SETTLED]: {
    title: 'Liquidar Reclamo',
    description: 'Esta acción marcará el reclamo como liquidado. Asegúrese de que todos los datos financieros estén correctos.',
    confirmLabel: 'Liquidar',
    variant: 'default',
  },
  [ClaimStatus.DRAFT]: {
    title: 'Volver a Borrador',
    description: 'El reclamo volverá al estado de borrador para ser editado.',
    confirmLabel: 'Confirmar',
    variant: 'default',
  },
  [ClaimStatus.CANCELLED]: {
    title: 'Cancelar Reclamo',
    description: 'Esta acción cancelará el reclamo permanentemente.',
    confirmLabel: 'Cancelar Reclamo',
    variant: 'destructive',
    requiresReason: true,
    reasonLabel: 'Motivo de cancelación',
    reasonPlaceholder: 'Explique el motivo de la cancelación...',
    reasonField: 'cancellationReason',
  },
}

const TRANSITION_CONFIG_BY_SOURCE: Record<string, TransitionConfig> = {
  [`${ClaimStatus.PENDING_INFO}-${ClaimStatus.SUBMITTED}`]: {
    title: 'Información Recibida',
    description: 'Confirme que la información solicitada ha sido recibida para continuar con el proceso.',
    confirmLabel: 'Confirmar Recepción',
    variant: 'default',
    requiresReason: true,
    reasonLabel: 'Descripción del reproceso',
    reasonPlaceholder: 'Describa la información recibida y los próximos pasos...',
    reasonField: 'reprocessDescription',
    requiresDate: true,
    dateLabel: 'Fecha de reproceso',
    dateField: 'reprocessDate',
  },
}

const getTransitionConfig = (fromStatus: ClaimStatus, toStatus: ClaimStatus): TransitionConfig | null => {
  const sourceDestKey = `${fromStatus}-${toStatus}`
  if (TRANSITION_CONFIG_BY_SOURCE[sourceDestKey]) {
    return TRANSITION_CONFIG_BY_SOURCE[sourceDestKey]
  }
  return TRANSITION_CONFIG[toStatus] ?? null
}

function ClaimDetailPage() {
  const { claimId } = Route.useParams()
  const [activeTab, setActiveTab] = useState('info')
  const isMobile = useIsMobile()

  // NOTE: Editing is intentionally disabled on mobile devices (read-only view)
  // Mobile users should use desktop for claim editing - this is by design

  // Transition dialog state
  const [pendingTransition, setPendingTransition] = useState<ClaimStatus | null>(null)
  const [transitionReason, setTransitionReason] = useState('')
  const [transitionDate, setTransitionDate] = useState<Date | undefined>(undefined)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { data, isLoading, isError, error } = useClaimDetail(claimId)
  const updateMutation = useUpdateClaimField(claimId)
  const { data: policiesData, isLoading: loadingPolicies } = useClaimPolicies(claimId)

  const policyOptions: ComboboxOption[] = useMemo(
    () =>
      policiesData?.policies.map((p) => ({
        value: p.id,
        label: p.policyNumber,
        description: `${p.insurer.name} • ${p.status}`,
      })) ?? [],
    [policiesData]
  )

  const handleFieldSave = async <K extends keyof UpdateClaimRequestDto>(
    field: K,
    value: UpdateClaimRequestDto[K]
  ): Promise<void> => {
    await updateMutation.mutateAsync({ [field]: value })
    toast.success('Campo actualizado correctamente')
  }

  // Opens the confirmation dialog
  const handleStatusTransition = (toStatus: ClaimStatus): void => {
    setPendingTransition(toStatus)
    setTransitionReason('')
    setTransitionDate(undefined)
  }

  // Confirms and executes the transition
  const confirmTransition = async (): Promise<void> => {
    if (!pendingTransition) return

    const config = transitionConfig
    setIsTransitioning(true)

    try {
      const updateData: UpdateClaimRequestDto = { status: pendingTransition }

      // Add reason field if required
      if (config?.requiresReason && config.reasonField && transitionReason.trim()) {
        updateData[config.reasonField] = transitionReason.trim()
      }

      // Add date field if required (API expects YYYY-MM-DD format)
      if (config?.requiresDate && config.dateField && transitionDate) {
        updateData[config.dateField] = transitionDate.toISOString().slice(0, 10)
      }

      await updateMutation.mutateAsync(updateData)
      toast.success(`Estado actualizado a ${ClaimStatusLabel[pendingTransition]}`)
      setPendingTransition(null)
      setTransitionReason('')
      setTransitionDate(undefined)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el estado'
      toast.error(message)
    } finally {
      setIsTransitioning(false)
    }
  }

  // Get current transition config
  const transitionConfig =
    pendingTransition && data?.claim ? getTransitionConfig(data.claim.status, pendingTransition) : null

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
          <TabsList className="hidden md:flex">
            <TabsTrigger value="info" icon={<Info className="size-4" />}>
              Información
            </TabsTrigger>
            <TabsTrigger value="invoices" icon={<Receipt className="size-4" />}>
              Facturas
            </TabsTrigger>
            <TabsTrigger value="files" icon={<Folder className="size-4" />}>
              Archivos
            </TabsTrigger>
            <TabsTrigger value="history" icon={<History className="size-4" />}>
              Historial
            </TabsTrigger>
            <TabsTrigger value="sla" icon={<Clock className="size-4" />}>
              SLA
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
              <EditableCombobox
                label="Póliza"
                value={claim.policyId}
                options={policyOptions}
                onSave={(value) => handleFieldSave('policyId', value)}
                placeholder="Seleccionar póliza..."
                searchPlaceholder="Buscar póliza..."
                emptyText="Sin póliza asignada"
                emptyMessage="No se encontraron pólizas"
                clearLabel="Sin póliza"
                loading={loadingPolicies}
                validate={zodFieldValidator(claimFieldSchemas.policyId)}
                getHref={(policyId) => `/policies/${policyId}`}
                disabled={isMobile}
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
                disabled={isMobile}
              />
              <EditableSelect<CareType>
                label="Tipo de Atención"
                value={claim.careType}
                options={CARE_TYPE_OPTIONS}
                onSave={(value) => handleFieldSave('careType', value)}
                placeholder="Seleccionar tipo"
                emptyText="No especificado"
                validate={zodFieldValidator(claimFieldSchemas.careType)}
                disabled={isMobile}
              />
              <EditableText
                label="Código de Diagnóstico"
                value={claim.diagnosisCode}
                onSave={(value) => handleFieldSave('diagnosisCode', value || null)}
                placeholder="Ej: A00.0"
                emptyText="No especificado"
                validate={zodFieldValidator(claimFieldSchemas.diagnosisCode)}
                disabled={isMobile}
              />
              <EditableTextarea
                label="Descripción del Diagnóstico"
                value={claim.diagnosisDescription}
                onSave={(value) => handleFieldSave('diagnosisDescription', value || null)}
                placeholder="Descripción del diagnóstico"
                emptyText="Sin descripción"
                validate={zodFieldValidator(claimFieldSchemas.diagnosisDescription)}
                rows={2}
                disabled={isMobile}
              />
              <EditableDate
                label="Fecha del Incidente"
                value={claim.incidentDate}
                onSave={(value) => handleFieldSave('incidentDate', value)}
                emptyText="No especificada"
                validate={zodFieldValidator(claimFieldSchemas.incidentDate)}
                disabled={isMobile}
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
                disabled={isMobile}
              />
              <EditableNumber
                label="Monto Aprobado"
                value={claim.amountApproved}
                onSave={(value) => handleFieldSave('amountApproved', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.amountApproved)}
                disabled={isMobile}
              />
              <EditableNumber
                label="Monto Denegado"
                value={claim.amountDenied}
                onSave={(value) => handleFieldSave('amountDenied', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.amountDenied)}
                disabled={isMobile}
              />
              <EditableNumber
                label="Monto No Procesado"
                value={claim.amountUnprocessed}
                onSave={(value) => handleFieldSave('amountUnprocessed', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.amountUnprocessed)}
                disabled={isMobile}
              />
              <EditableNumber
                label="Deducible Aplicado"
                value={claim.deductibleApplied}
                onSave={(value) => handleFieldSave('deductibleApplied', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.deductibleApplied)}
                disabled={isMobile}
              />
              <EditableNumber
                label="Copago Aplicado"
                value={claim.copayApplied}
                onSave={(value) => handleFieldSave('copayApplied', value)}
                placeholder="0.00"
                emptyText="$0.00"
                prefix="$"
                validate={zodFieldValidator(claimFieldSchemas.copayApplied)}
                disabled={isMobile}
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
                disabled={isMobile}
              />
              <EditableDate
                label="Fecha de Liquidación"
                value={claim.settlementDate}
                onSave={(value) => handleFieldSave('settlementDate', value)}
                emptyText="No especificada"
                validate={zodFieldValidator(claimFieldSchemas.settlementDate)}
                disabled={isMobile}
              />
              <EditableText
                label="Número de Liquidación"
                value={claim.settlementNumber}
                onSave={(value) => handleFieldSave('settlementNumber', value || null)}
                placeholder="Ej: LIQ-2024-001"
                emptyText="No especificado"
                validate={zodFieldValidator(claimFieldSchemas.settlementNumber)}
                disabled={isMobile}
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
                disabled={isMobile}
              />
            </DetailSection>

            {/* Section 4: Metadatos - Hidden on mobile */}
            <div className="hidden md:block">
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
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-8">
            <ClaimInvoicesTab claimId={claimId} claimAmountSubmitted={claim.amountSubmitted ?? undefined} />
          </TabsContent>

          <TabsContent value="files" className="mt-8">
            <ClaimFilesTab claimId={claimId} />
          </TabsContent>

          <TabsContent value="history" className="mt-8">
            <ClaimHistoryTab claimId={claimId} />
          </TabsContent>

          <TabsContent value="sla" className="mt-8">
            <ClaimSlaTab claimId={claimId} />
          </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Status Transition Confirmation Dialog */}
      <AlertDialog
        open={!!pendingTransition}
        onOpenChange={(open) => {
          if (!open && !isTransitioning) {
            setPendingTransition(null)
            setTransitionReason('')
            setTransitionDate(undefined)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{transitionConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {transitionConfig?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {transitionConfig?.requiresDate && (
            <div className="space-y-2 py-2">
              <Label htmlFor="transition-date">{transitionConfig.dateLabel}</Label>
              <Input
                id="transition-date"
                type="date"
                value={transitionDate ? transitionDate.toISOString().slice(0, 10) : ''}
                onChange={(e) =>
                  setTransitionDate(e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined)
                }
                disabled={isTransitioning}
              />
            </div>
          )}

          {transitionConfig?.requiresReason && (
            <div className="space-y-2 py-2">
              <Label htmlFor="transition-reason">{transitionConfig.reasonLabel}</Label>
              <Textarea
                id="transition-reason"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                placeholder={transitionConfig.reasonPlaceholder}
                rows={3}
                disabled={isTransitioning}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTransitioning}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={transitionConfig?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => void confirmTransition()}
              disabled={
                isTransitioning ||
                (transitionConfig?.requiresReason && !transitionReason.trim()) ||
                (transitionConfig?.requiresDate && !transitionDate)
              }
            >
              {isTransitioning ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                transitionConfig?.confirmLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
