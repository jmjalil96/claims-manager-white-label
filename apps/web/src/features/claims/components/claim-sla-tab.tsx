import { Clock, Loader2, CheckCircle } from 'lucide-react'
import { Timeline, TimelineItem, type TimelineVariant } from '@/components/ui/timeline'
import { Alert, StatusBadge, type BadgeVariant } from '@/components/ui'
import { useClaimSla } from '../claimSla'
import { ClaimStatusLabel } from '@claims/shared'
import type { SlaIndicator, ClaimSlaStageDto } from '@claims/shared'

/* -----------------------------------------------------------------------------
 * Configuration
 * -------------------------------------------------------------------------- */

const SLA_INDICATOR_CONFIG: Record<SlaIndicator, { label: string; variant: BadgeVariant }> = {
  on_time: { label: 'En Tiempo', variant: 'success' },
  at_risk: { label: 'En Riesgo', variant: 'warning' },
  overdue: { label: 'Vencido', variant: 'error' },
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

function getIndicatorConfig(indicator: SlaIndicator) {
  return SLA_INDICATOR_CONFIG[indicator] ?? SLA_INDICATOR_CONFIG.on_time
}

function getTimelineVariant(indicator: SlaIndicator, isCurrent: boolean): TimelineVariant {
  if (isCurrent) return 'primary'
  if (indicator === 'overdue') return 'destructive'
  if (indicator === 'at_risk') return 'default'
  return 'muted'
}

function formatDays(days: number): string {
  if (days === 0) return '0 días'
  if (days === 1) return '1 día'
  return `${days} días`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* -----------------------------------------------------------------------------
 * StageContent Component
 * -------------------------------------------------------------------------- */

interface StageContentProps {
  stage: ClaimSlaStageDto
  isCurrent: boolean
}

function StageContent({ stage, isCurrent }: StageContentProps) {
  const indicatorConfig = getIndicatorConfig(stage.indicator)
  const statusLabel = ClaimStatusLabel[stage.status] ?? stage.status

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-700 font-medium">
          {statusLabel}
          {isCurrent && (
            <span className="ml-2 text-xs text-slate-400 font-normal">(actual)</span>
          )}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {formatDate(stage.enteredAt)}
          {stage.exitedAt && ` → ${formatDate(stage.exitedAt)}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isCurrent && (
          <>
            <span className="text-sm text-slate-600 tabular-nums">
              {formatDays(stage.businessDays)}
            </span>
            <StatusBadge
              label={indicatorConfig.label}
              variant={indicatorConfig.variant}
            />
          </>
        )}
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * ClaimSlaTab Component
 * -------------------------------------------------------------------------- */

interface ClaimSlaTabProps {
  claimId: string
}

export function ClaimSlaTab({ claimId }: ClaimSlaTabProps) {
  const { data, isLoading, isError, error } = useClaimSla(claimId)

  // Error state
  if (isError) {
    return (
      <Alert variant="error">
        {error instanceof Error ? error.message : 'Error al cargar los datos de SLA'}
      </Alert>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-700">SLA</h3>
          </div>
        </header>
        <div className="p-5">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-teal-600" />
          </div>
        </div>
      </div>
    )
  }

  // Empty state (no data)
  if (!data) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-700">SLA</h3>
          </div>
        </header>
        <div className="p-8 text-center">
          <Clock className="size-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">Sin datos de SLA</p>
          <p className="text-xs text-slate-400 mt-1">
            No se encontró información de SLA para este reclamo
          </p>
        </div>
      </div>
    )
  }

  const currentIndicatorConfig = getIndicatorConfig(data.currentIndicator)

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-slate-500" />
          <h3 className="text-sm font-medium text-slate-700">SLA</h3>
        </div>
        <StatusBadge
          label={currentIndicatorConfig.label}
          variant={currentIndicatorConfig.variant}
        />
      </header>

      {/* Summary Row */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-700">{formatDays(data.totalBusinessDays)}</span>
          {' '}hábiles
          <span className="mx-2 text-slate-300">•</span>
          <span className="font-medium text-slate-700">{data.totalCalendarDays}</span>
          {' '}días calendario
        </p>
      </div>

      {/* Timeline Content */}
      <div className="px-5 py-4">
        <Timeline>
          {data.stages.map((stage, idx) => {
            const isCurrent = stage.exitedAt === null
            const isLast = idx === data.stages.length - 1
            const variant = getTimelineVariant(stage.indicator, isCurrent)

            return (
              <TimelineItem
                key={`${stage.status}-${stage.enteredAt}`}
                variant={variant}
                icon={<CheckCircle className="size-3" />}
                isLast={isLast}
              >
                <StageContent stage={stage} isCurrent={isCurrent} />
              </TimelineItem>
            )
          })}
        </Timeline>
      </div>
    </div>
  )
}
