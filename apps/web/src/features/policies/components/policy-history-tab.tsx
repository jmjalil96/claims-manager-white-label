import { useState, useMemo } from 'react'
import {
  Plus,
  Pencil,
  RefreshCw,
  Trash2,
  History,
  Loader2,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Timeline, TimelineItem, type TimelineVariant } from '@/components/ui/timeline'
import { Button, Alert, StatusBadge, type BadgeVariant } from '@/components/ui'
import { usePolicyAudit } from '../policyAudit'
import { PolicyStatusLabel, PolicyTypeLabel } from '@claims/shared'
import type { PolicyStatus, PolicyType } from '@claims/shared'
import type { AuditLogItemDto } from '@claims/shared'

/* -----------------------------------------------------------------------------
 * Types & Configuration
 * -------------------------------------------------------------------------- */

type AuditAction = 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'DELETE'

interface ActionConfig {
  variant: TimelineVariant
  icon: React.ReactNode
}

const ACTION_CONFIG: Record<AuditAction, ActionConfig> = {
  CREATE: {
    variant: 'primary',
    icon: <Plus className="size-3" strokeWidth={2.5} />,
  },
  UPDATE: {
    variant: 'muted',
    icon: <Pencil className="size-3" />,
  },
  STATUS_CHANGE: {
    variant: 'primary',
    icon: <RefreshCw className="size-3" />,
  },
  DELETE: {
    variant: 'destructive',
    icon: <Trash2 className="size-3" />,
  },
}

/* -----------------------------------------------------------------------------
 * Field Labels (Spanish)
 * -------------------------------------------------------------------------- */

const FIELD_LABELS: Record<string, string> = {
  policyNumber: 'Número de póliza',
  type: 'Tipo',
  status: 'Estado',
  startDate: 'Fecha de inicio',
  endDate: 'Fecha de fin',
  ambCopay: 'Copago ambulatorio',
  hospCopay: 'Copago hospitalario',
  maternity: 'Maternidad',
  tPremium: 'Prima T',
  tplus1Premium: 'Prima T+1',
  tplusfPremium: 'Prima T+F',
  benefitsCost: 'Costo de beneficios',
  expirationReason: 'Motivo de expiración',
  cancellationReason: 'Motivo de cancelación',
  isActive: 'Estado activo',
}

/* -----------------------------------------------------------------------------
 * Status Badge Helpers
 * -------------------------------------------------------------------------- */

function getPolicyStatusVariant(status: PolicyStatus): BadgeVariant {
  const map: Record<PolicyStatus, BadgeVariant> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    EXPIRED: 'default',
    CANCELLED: 'error',
  }
  return map[status] ?? 'default'
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

function getActionConfig(action: string): ActionConfig {
  return ACTION_CONFIG[action as AuditAction] ?? {
    variant: 'default' as TimelineVariant,
    icon: <History className="size-3" />,
  }
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field
}

// Date grouping helpers
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function getDateGroupKey(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) return 'Hoy'
  if (isSameDay(date, yesterday)) return 'Ayer'

  return date.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

// Value formatting
function formatValue(value: unknown, fieldKey: string): string {
  if (value === null || value === undefined) return '—'

  // Currency fields
  if (
    fieldKey.toLowerCase().includes('premium') ||
    fieldKey.toLowerCase().includes('copay') ||
    fieldKey === 'benefitsCost' ||
    fieldKey === 'maternity'
  ) {
    const num = Number(value)
    if (isNaN(num)) return typeof value === 'string' ? value : JSON.stringify(value)
    return `$${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Date fields
  if (fieldKey.toLowerCase().includes('date') && typeof value === 'string') {
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })
    }
  }

  // Status enum
  if (fieldKey === 'status' && typeof value === 'string') {
    return PolicyStatusLabel[value as PolicyStatus] ?? value
  }

  // Type enum
  if (fieldKey === 'type' && typeof value === 'string') {
    return PolicyTypeLabel[value as PolicyType] ?? value
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  // Truncate long strings
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  return str.length > 40 ? str.slice(0, 37) + '...' : str
}

interface ChangesData {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

function parseChanges(changes: unknown): ChangesData | null {
  if (!changes || typeof changes !== 'object') return null
  return changes as ChangesData
}

function getStatusTransition(changes: ChangesData | null): { from: PolicyStatus; to: PolicyStatus } | null {
  if (!changes?.before?.status || !changes?.after?.status) return null
  return {
    from: changes.before.status as PolicyStatus,
    to: changes.after.status as PolicyStatus,
  }
}

interface MetadataData {
  policyNumber?: string
  fileCount?: number
}

function parseMetadata(metadata: unknown): MetadataData | null {
  if (!metadata || typeof metadata !== 'object') return null
  return metadata as MetadataData
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

/* -----------------------------------------------------------------------------
 * Narrative Builder - Enterprise CRM Style
 * -------------------------------------------------------------------------- */

interface NarrativeResult {
  action: string
  details: Array<{ field: string; label: string; from: string; to: string }> | null
}

function buildNarrative(item: AuditLogItemDto, changes: ChangesData | null): NarrativeResult {
  switch (item.action) {
    case 'CREATE':
      return { action: 'creó la póliza', details: null }

    case 'STATUS_CHANGE': {
      const transition = getStatusTransition(changes)
      if (transition) {
        return {
          action: `cambió estado a`,
          details: null,
        }
      }
      return { action: 'cambió el estado', details: null }
    }

    case 'UPDATE': {
      const fields = Object.keys(changes?.after ?? {}).filter((k) => k !== 'status')
      if (fields.length === 1 && fields[0]) {
        const field = fields[0]
        const value = formatValue(changes?.after?.[field], field)
        return { action: `actualizó ${getFieldLabel(field).toLowerCase()} a ${value}`, details: null }
      }
      if (fields.length > 1) {
        return {
          action: `actualizó ${fields.length} campos`,
          details: fields.map((f) => ({
            field: f,
            label: getFieldLabel(f),
            from: formatValue(changes?.before?.[f], f),
            to: formatValue(changes?.after?.[f], f),
          })),
        }
      }
      return { action: 'actualizó información', details: null }
    }

    case 'DELETE':
      return { action: 'eliminó un registro', details: null }

    default:
      return { action: item.action.toLowerCase(), details: null }
  }
}

/* -----------------------------------------------------------------------------
 * DateDivider Component
 * -------------------------------------------------------------------------- */

interface DateDividerProps {
  label: string
}

function DateDivider({ label }: DateDividerProps) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * ActivityContent Component (Enterprise CRM Narrative Style)
 * -------------------------------------------------------------------------- */

interface ActivityContentProps {
  item: AuditLogItemDto
}

function ActivityContent({ item }: ActivityContentProps) {
  const changes = parseChanges(item.changes)
  const metadata = parseMetadata(item.metadata)
  const time = formatTime(item.createdAt)
  const userName = item.userName ?? item.userEmail ?? 'Sistema'

  // Build narrative
  const narrative = buildNarrative(item, changes)
  const transition = item.action === 'STATUS_CHANGE' ? getStatusTransition(changes) : null

  // Collapsible state for multi-field updates
  const isCollapsible = narrative.details !== null && narrative.details.length > 0
  const [expanded, setExpanded] = useState(false)

  const handleToggle = () => {
    if (isCollapsible) setExpanded(!expanded)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCollapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setExpanded(!expanded)
    }
  }

  return (
    <div className="group">
      {/* Narrative Header */}
      <div
        className={cn(
          'flex items-start justify-between gap-4',
          isCollapsible && 'cursor-pointer select-none rounded -mx-1 px-1 hover:bg-slate-50 transition-colors'
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role={isCollapsible ? 'button' : undefined}
        tabIndex={isCollapsible ? 0 : undefined}
        aria-expanded={isCollapsible ? expanded : undefined}
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-800">{userName}</span>
          {' '}{narrative.action}
          {/* Inline status badge for status changes */}
          {transition && (
            <StatusBadge
              label={PolicyStatusLabel[transition.to]}
              variant={getPolicyStatusVariant(transition.to)}
              className="ml-1.5 align-middle"
            />
          )}
          {/* Chevron for expandable */}
          {isCollapsible && (
            <ChevronDown
              className={cn(
                'inline-block ml-1 size-3.5 text-slate-400 transition-transform duration-200 align-middle',
                expanded && 'rotate-180'
              )}
            />
          )}
        </p>
        <span className="text-xs text-slate-400 shrink-0 tabular-nums pt-0.5">{time}</span>
      </div>

      {/* Expandable Details for multi-field updates */}
      {isCollapsible && (
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="pt-2.5 pl-3 ml-1 border-l-2 border-slate-100 space-y-1.5">
              {narrative.details?.map((detail) => (
                <div key={detail.field} className="flex items-baseline gap-3 text-xs">
                  <span className="text-slate-500 w-28 shrink-0">{detail.label}</span>
                  <span className="text-slate-400">{detail.from}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-slate-700 font-medium">{detail.to}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE metadata */}
      {item.action === 'CREATE' && metadata?.fileCount && metadata.fileCount > 0 && (
        <p className="text-xs text-slate-500 mt-1.5">
          {metadata.fileCount} {metadata.fileCount === 1 ? 'archivo adjunto' : 'archivos adjuntos'}
        </p>
      )}
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * PolicyHistoryTab Component
 * -------------------------------------------------------------------------- */

interface PolicyHistoryTabProps {
  policyId: string
}

export function PolicyHistoryTab({ policyId }: PolicyHistoryTabProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error } = usePolicyAudit(policyId, { page, limit: 20 })

  // Group audit logs by date
  const groupedLogs = useMemo(() => {
    const logs = data?.auditLogs ?? []
    const groups: Map<string, AuditLogItemDto[]> = new Map()

    logs.forEach((log) => {
      const key = getDateGroupKey(log.createdAt)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(log)
    })

    return groups
  }, [data?.auditLogs])

  // Error state
  if (isError) {
    return (
      <Alert variant="error">
        {error instanceof Error ? error.message : 'Error al cargar el historial'}
      </Alert>
    )
  }

  const auditLogs = data?.auditLogs ?? []
  const meta = data?.meta
  const hasMore = meta?.hasNextPage ?? false
  const isLoadingMore = isLoading && page > 1

  // Loading state
  if (isLoading && page === 1) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-700">Historial de Actividad</h3>
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

  // Empty state
  if (auditLogs.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-slate-500" />
            <h3 className="text-sm font-medium text-slate-700">Historial de Actividad</h3>
          </div>
        </header>
        <div className="p-8 text-center">
          <History className="size-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">Sin historial</p>
          <p className="text-xs text-slate-400 mt-1">
            Aún no hay actividad registrada para esta póliza
          </p>
        </div>
      </div>
    )
  }

  // Flatten groups for rendering with dividers
  const groupEntries = Array.from(groupedLogs.entries())

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <History className="size-4 text-slate-500" />
          <h3 className="text-sm font-medium text-slate-700">Historial de Actividad</h3>
        </div>
        {meta && (
          <span className="text-xs text-slate-400">
            {meta.totalCount} {meta.totalCount === 1 ? 'registro' : 'registros'}
          </span>
        )}
      </header>

      {/* Timeline Content with Date Groups */}
      <div className="px-5 py-4">
        {groupEntries.map(([dateKey, items], groupIdx) => {
          const firstItem = items[0]
          if (!firstItem) return null
          const dateLabel = formatDateGroup(firstItem.createdAt)

          return (
            <div key={dateKey}>
              {/* Date Divider */}
              <DateDivider label={dateLabel} />

              {/* Items in this group */}
              <Timeline>
                {items.map((item, itemIdx) => {
                  const config = getActionConfig(item.action)
                  const isLastInGroup = itemIdx === items.length - 1
                  const isLastGroup = groupIdx === groupEntries.length - 1
                  const isLast = isLastInGroup && isLastGroup && !hasMore

                  return (
                    <TimelineItem
                      key={item.id}
                      variant={config.variant}
                      icon={config.icon}
                      isLast={isLast}
                    >
                      <ActivityContent item={item} />
                    </TimelineItem>
                  )
                })}
              </Timeline>
            </div>
          )
        })}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4 mt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>Cargar más registros</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
