import { useState, useCallback, useSyncExternalStore } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, DollarSign, Info, Folder, History, Loader2, Building2, Calendar, CreditCard } from 'lucide-react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DetailSection,
  EditableText,
  EditableNumber,
  EditableSelect,
  EditableDate,
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
  Label,
} from '@/components/ui'
import { PolicyDetailHeader, PolicyWorkflowStepper, PolicyFilesTab, PolicyHistoryTab } from '@/features/policies'
import { usePolicyDetail, useUpdatePolicyField } from '@/features/policies/policyDetail'
import { policyFieldSchemas } from '@/features/policies/schemas'
import {
  PolicyStatus,
  PolicyStatusLabel,
  PolicyType,
  PolicyTypeLabel,
} from '@claims/shared'
import type { UpdatePolicyRequestDto } from '@/features/policies/policyDetail'
import { zodFieldValidator, toast } from '@/lib'
import type { SelectOption } from '@/components/ui/editable-field'

export const Route = createFileRoute('/_authenticated/policies/$policyId')({
  component: PolicyDetailPage,
})

const POLICY_TYPE_OPTIONS: SelectOption<PolicyType>[] = Object.values(PolicyType).map((value) => ({
  value,
  label: PolicyTypeLabel[value],
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
  reasonField?: 'cancellationReason' | 'expirationReason'
}

const TRANSITION_CONFIG: Partial<Record<PolicyStatus, TransitionConfig>> = {
  [PolicyStatus.ACTIVE]: {
    title: 'Activar Póliza',
    description: 'La póliza será activada y estará vigente.',
    confirmLabel: 'Activar',
    variant: 'default',
  },
  [PolicyStatus.EXPIRED]: {
    title: 'Expirar Póliza',
    description: 'La póliza será marcada como expirada.',
    confirmLabel: 'Expirar',
    variant: 'destructive',
    requiresReason: true,
    reasonLabel: 'Motivo de expiración',
    reasonPlaceholder: 'Explique el motivo de la expiración...',
    reasonField: 'expirationReason',
  },
  [PolicyStatus.CANCELLED]: {
    title: 'Cancelar Póliza',
    description: 'Esta acción cancelará la póliza permanentemente.',
    confirmLabel: 'Cancelar Póliza',
    variant: 'destructive',
    requiresReason: true,
    reasonLabel: 'Motivo de cancelación',
    reasonPlaceholder: 'Explique el motivo de la cancelación...',
    reasonField: 'cancellationReason',
  },
}

function PolicyDetailPage() {
  const { policyId } = Route.useParams()
  const [activeTab, setActiveTab] = useState('info')
  const isMobile = useIsMobile()

  // NOTE: Editing is intentionally disabled on mobile devices (read-only view)
  // Mobile users should use desktop for policy editing - this is by design

  // Transition dialog state
  const [pendingTransition, setPendingTransition] = useState<PolicyStatus | null>(null)
  const [transitionReason, setTransitionReason] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { data, isLoading, isError, error } = usePolicyDetail(policyId)
  const updateMutation = useUpdatePolicyField(policyId)

  const handleFieldSave = async <K extends keyof UpdatePolicyRequestDto>(
    field: K,
    value: UpdatePolicyRequestDto[K]
  ): Promise<void> => {
    await updateMutation.mutateAsync({ [field]: value })
    toast.success('Campo actualizado correctamente')
  }

  // Opens the confirmation dialog
  const handleStatusTransition = (toStatus: PolicyStatus): void => {
    setPendingTransition(toStatus)
    setTransitionReason('')
  }

  // Confirms and executes the transition
  const confirmTransition = async (): Promise<void> => {
    if (!pendingTransition) return

    const config = transitionConfig
    setIsTransitioning(true)

    try {
      const updateData: UpdatePolicyRequestDto = { status: pendingTransition }

      // Add reason field if required
      if (config?.requiresReason && config.reasonField && transitionReason.trim()) {
        updateData[config.reasonField] = transitionReason.trim()
      }

      await updateMutation.mutateAsync(updateData)
      toast.success(`Estado actualizado a ${PolicyStatusLabel[pendingTransition]}`)
      setPendingTransition(null)
      setTransitionReason('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el estado'
      toast.error(message)
    } finally {
      setIsTransitioning(false)
    }
  }

  // Get current transition config
  const transitionConfig = pendingTransition ? TRANSITION_CONFIG[pendingTransition] : null

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
          {error?.message || 'Error al cargar la póliza'}
        </Alert>
      </div>
    )
  }

  const { policy } = data

  return (
    <div className="-m-8 flex flex-col min-h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} variant="line" className="flex flex-col flex-1">
        {/* Master Header with integrated tabs - white background */}
        <PolicyDetailHeader
          policyNumber={policy.policyNumber}
          status={policy.status}
          type={policy.type}
        >
          <TabsList className="hidden md:flex">
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
        </PolicyDetailHeader>

        {/* Main Content Area - gray background fills remaining space */}
        <div className="flex-1 bg-slate-50/50 pb-20">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <TabsContent value="info" className="space-y-8">
              {/* Workflow Stepper */}
              <PolicyWorkflowStepper
                currentStatus={policy.status}
                expirationReason={policy.expirationReason}
                cancellationReason={policy.cancellationReason}
                onTransition={handleStatusTransition}
              />

              {/* Section 1: Relaciones */}
              <DetailSection title="Relaciones" icon={<Building2 className="size-4" />} columns={2}>
                <ReadOnlyLink
                  label="Cliente"
                  value={policy.clientName}
                  href={`/clients/${policy.clientId}`}
                />
                <ReadOnlyLink
                  label="Aseguradora"
                  value={policy.insurerName}
                  href={`/insurers/${policy.insurerId}`}
                />
              </DetailSection>

              {/* Section 2: Información General */}
              <DetailSection title="Información General" icon={<FileText className="size-4" />} columns={2}>
                <EditableText
                  label="Número de Póliza"
                  value={policy.policyNumber}
                  onSave={(value) => handleFieldSave('policyNumber', value || '')}
                  placeholder="Número de póliza"
                  emptyText="No especificado"
                  validate={zodFieldValidator(policyFieldSchemas.policyNumber)}
                  disabled={isMobile}
                />
                <EditableSelect<PolicyType>
                  label="Tipo de Póliza"
                  value={policy.type}
                  options={POLICY_TYPE_OPTIONS}
                  onSave={(value) => handleFieldSave('type', value)}
                  placeholder="Seleccionar tipo"
                  emptyText="No especificado"
                  validate={zodFieldValidator(policyFieldSchemas.type)}
                  disabled={isMobile}
                />
                <EditableDate
                  label="Fecha de Inicio"
                  value={policy.startDate}
                  onSave={(value) => handleFieldSave('startDate', value || '')}
                  emptyText="No especificada"
                  disabled={isMobile}
                />
                <EditableDate
                  label="Fecha de Fin"
                  value={policy.endDate}
                  onSave={(value) => handleFieldSave('endDate', value || '')}
                  emptyText="No especificada"
                  disabled={isMobile}
                />
              </DetailSection>

              {/* Section 3: Copagos */}
              <DetailSection title="Copagos" icon={<CreditCard className="size-4" />} columns={3}>
                <EditableNumber
                  label="Copago Ambulatorio"
                  value={policy.ambCopay}
                  onSave={(value) => handleFieldSave('ambCopay', value)}
                  placeholder="0.00"
                  emptyText="$0.00"
                  prefix="$"
                  validate={zodFieldValidator(policyFieldSchemas.ambCopay)}
                  disabled={isMobile}
                />
                <EditableNumber
                  label="Copago Hospitalario"
                  value={policy.hospCopay}
                  onSave={(value) => handleFieldSave('hospCopay', value)}
                  placeholder="0.00"
                  emptyText="$0.00"
                  prefix="$"
                  validate={zodFieldValidator(policyFieldSchemas.hospCopay)}
                  disabled={isMobile}
                />
                <EditableNumber
                  label="Maternidad"
                  value={policy.maternity}
                  onSave={(value) => handleFieldSave('maternity', value)}
                  placeholder="0.00"
                  emptyText="$0.00"
                  prefix="$"
                  validate={zodFieldValidator(policyFieldSchemas.maternity)}
                  disabled={isMobile}
                />
              </DetailSection>

              {/* Section 4: Primas */}
              <DetailSection title="Primas" icon={<DollarSign className="size-4" />} columns={2}>
                <EditableNumber
                  label="Prima Individual (T)"
                  value={policy.tPremium}
                  onSave={(value) => handleFieldSave('tPremium', value)}
                  placeholder="0.00"
                  emptyText="$0.00"
                  prefix="$"
                  validate={zodFieldValidator(policyFieldSchemas.tPremium)}
                  disabled={isMobile}
                />
                <EditableNumber
                  label="Prima T+1"
                  value={policy.tplus1Premium}
                  onSave={(value) => handleFieldSave('tplus1Premium', value)}
                  placeholder="0.00"
                  emptyText="$0.00"
                  prefix="$"
                  validate={zodFieldValidator(policyFieldSchemas.tplus1Premium)}
                  disabled={isMobile}
                />
                <EditableNumber
                  label="Prima Familiar (T+F)"
                  value={policy.tplusfPremium}
                  onSave={(value) => handleFieldSave('tplusfPremium', value)}
                  placeholder="0.00"
                  emptyText="$0.00"
                  prefix="$"
                  validate={zodFieldValidator(policyFieldSchemas.tplusfPremium)}
                  disabled={isMobile}
                />
                <EditableNumber
                  label="Costo de Beneficios"
                  value={policy.benefitsCost}
                  onSave={(value) => handleFieldSave('benefitsCost', value)}
                  placeholder="0.00"
                  emptyText="$0.00"
                  prefix="$"
                  validate={zodFieldValidator(policyFieldSchemas.benefitsCost)}
                  disabled={isMobile}
                />
              </DetailSection>

              {/* Section 5: Metadatos - Hidden on mobile */}
              <div className="hidden md:block">
                <DetailSection title="Metadatos" icon={<Calendar className="size-4" />}>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Estado Activo</span>
                    <p className="text-sm text-slate-900">
                      {policy.isActive ? 'Sí' : 'No'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Creado</span>
                    <p className="text-sm text-slate-900">{formatDate(policy.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Actualizado</span>
                    <p className="text-sm text-slate-900">{formatDate(policy.updatedAt)}</p>
                  </div>
                </DetailSection>
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-8">
              <PolicyFilesTab policyId={policyId} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-8">
              <PolicyHistoryTab policyId={policyId} />
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
                (transitionConfig?.requiresReason && !transitionReason.trim())
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
