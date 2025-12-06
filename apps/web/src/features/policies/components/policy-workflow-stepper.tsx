import { Check, Clock, AlertTriangle, CheckCircle2, XCircle, Ban } from 'lucide-react'
import { Button } from '@/components/ui'
import { PolicyStatus } from '@claims/shared'
import { cn } from '@/lib/utils'
import { getWorkflowActions } from '../utils/workflow-actions'

/* -----------------------------------------------------------------------------
 * Types & Configuration
 * -------------------------------------------------------------------------- */

const PRIMARY_STEPS: PolicyStatus[] = [
  PolicyStatus.PENDING,
  PolicyStatus.ACTIVE,
  PolicyStatus.EXPIRED,
]

const STEP_LABELS: Record<PolicyStatus, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'Activa',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
}

function getStepIndex(status: PolicyStatus): number {
  return PRIMARY_STEPS.indexOf(status)
}

/* -----------------------------------------------------------------------------
 * Step Circle Component
 * -------------------------------------------------------------------------- */

type StepState = 'completed' | 'current' | 'pending' | 'error' | 'warning' | 'cancelled'

interface StepCircleProps {
  state: StepState
  label: string
}

function StepCircle({ state, label }: StepCircleProps) {
  return (
    <div className="flex flex-row items-center gap-2 md:flex-col md:gap-1.5 z-10">
      <div
        className={cn(
          'size-7 rounded-full flex items-center justify-center transition-all duration-300 border-[1.5px] shrink-0',
          state === 'completed' && 'bg-teal-600 border-teal-600 text-white',
          state === 'current' && 'bg-white border-teal-600 text-teal-600 shadow-sm shadow-teal-100',
          state === 'pending' && 'bg-white border-slate-200 text-slate-300',
          state === 'error' && 'bg-white border-red-500 text-red-500 shadow-sm shadow-red-100',
          state === 'warning' && 'bg-white border-amber-500 text-amber-500 shadow-sm shadow-amber-100',
          state === 'cancelled' && 'bg-slate-100 border-slate-300 text-slate-400'
        )}
      >
        {state === 'completed' && <Check className="size-3.5" strokeWidth={3} />}
        {state === 'current' && <div className="size-2 rounded-full bg-teal-600" />}
        {state === 'pending' && <div className="size-1.5 rounded-full bg-slate-200" />}
        {state === 'error' && <XCircle className="size-3.5" />}
        {state === 'warning' && <Clock className="size-3.5" />}
        {state === 'cancelled' && <Ban className="size-3.5" />}
      </div>
      <span
        className={cn(
          'text-xs md:text-[10px] font-medium tracking-wide uppercase whitespace-nowrap',
          state === 'completed' && 'text-teal-700',
          state === 'current' && 'text-teal-700',
          state === 'pending' && 'text-slate-400',
          state === 'error' && 'text-red-600',
          state === 'warning' && 'text-amber-600',
          state === 'cancelled' && 'text-slate-400'
        )}
      >
        {label}
      </span>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * PolicyWorkflowStepper Component
 * -------------------------------------------------------------------------- */

interface PolicyWorkflowStepperProps {
  currentStatus: PolicyStatus
  expirationReason?: string | null
  cancellationReason?: string | null
  onTransition?: (toStatus: PolicyStatus) => void
  className?: string
}

export function PolicyWorkflowStepper({
  currentStatus,
  expirationReason,
  cancellationReason,
  onTransition,
  className,
}: PolicyWorkflowStepperProps) {

  // Logic to determine visual state of each primary step
  function getVisualState(_step: PolicyStatus, index: number): StepState {
    const currentIndex = getStepIndex(currentStatus)

    // 1. Happy Path (status is in PRIMARY_STEPS)
    if (currentIndex !== -1) {
      // EXPIRED is the terminal happy-path state
      if (currentStatus === PolicyStatus.EXPIRED) return 'completed'
      if (index < currentIndex) return 'completed'
      if (index === currentIndex) return 'current'
      return 'pending'
    }

    // 2. Cancelled state (off the happy path)
    if (currentStatus === PolicyStatus.CANCELLED) {
      return 'cancelled'
    }

    return 'pending'
  }

  // Determine connector color between steps
  function getConnectorState(index: number): 'completed' | 'pending' | 'cancelled' {
    if (currentStatus === PolicyStatus.CANCELLED) return 'cancelled'

    const nextStep = PRIMARY_STEPS[index + 1]
    if (!nextStep) return 'pending'

    const nextStepState = getVisualState(nextStep, index + 1)
    if (
      nextStepState === 'completed' ||
      nextStepState === 'current' ||
      nextStepState === 'warning' ||
      nextStepState === 'error'
    ) {
      return 'completed'
    }
    return 'pending'
  }

  // Get actions for current status (returns empty if no transition handler)
  function getActions() {
    if (!onTransition) return []
    return getWorkflowActions(currentStatus)
  }

  // Message configuration
  const message =
    (currentStatus === PolicyStatus.PENDING)
      ? { type: 'warning' as const, text: 'Póliza pendiente de activación' }
    : (currentStatus === PolicyStatus.EXPIRED && expirationReason)
      ? { type: 'warning' as const, text: expirationReason }
    : (currentStatus === PolicyStatus.CANCELLED && cancellationReason)
      ? { type: 'error' as const, text: cancellationReason }
    : (currentStatus === PolicyStatus.ACTIVE)
      ? { type: 'success' as const, text: 'Póliza activa y vigente' }
    : null

  const actions = getActions()
  const hasFooter = message || actions.length > 0

  return (
    <div className={cn('rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden', className)}>
      {/* Stepper Content */}
      <div className="px-4 py-3">
        <div className="relative">
          {/* Horizontal Connector Lines (Desktop only) */}
          <div className="hidden md:flex absolute top-3.5 left-0 right-0 px-[44px]">
            {PRIMARY_STEPS.slice(0, -1).map((_, i) => {
              const cState = getConnectorState(i)
              return (
                <div key={i} className="flex-1 h-0.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      cState === 'completed' && 'bg-teal-500 w-full',
                      cState === 'cancelled' && 'bg-slate-300 w-full',
                      cState === 'pending' && 'w-0'
                    )}
                  />
                </div>
              )
            })}
          </div>

          {/* Steps Layer - Vertical on mobile, Horizontal on desktop */}
          <div className="flex flex-col gap-2 md:flex-row md:justify-between relative">
            {PRIMARY_STEPS.map((step, index) => (
              <StepCircle
                key={step}
                state={getVisualState(step, index)}
                label={STEP_LABELS[step]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Unified Footer: Message + Actions */}
      {hasFooter && (
        <div
          className={cn(
            'px-3 py-2 border-t flex items-center gap-3',
            message?.type === 'warning' && 'bg-amber-50 border-amber-100',
            message?.type === 'error' && 'bg-red-50 border-red-100',
            message?.type === 'success' && 'bg-green-50 border-green-100',
            !message && 'bg-slate-50 border-slate-100'
          )}
        >
          {/* Message (left side) */}
          {message && (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div
                className={cn(
                  'p-1 rounded-full shrink-0',
                  message.type === 'warning' && 'bg-amber-100 text-amber-600',
                  message.type === 'error' && 'bg-red-100 text-red-600',
                  message.type === 'success' && 'bg-green-100 text-green-600'
                )}
              >
                {message.type === 'warning' && <Clock className="size-3.5" />}
                {message.type === 'error' && <AlertTriangle className="size-3.5" />}
                {message.type === 'success' && <CheckCircle2 className="size-3.5" />}
              </div>
              <p
                className={cn(
                  'text-xs font-medium truncate',
                  message.type === 'warning' && 'text-amber-800',
                  message.type === 'error' && 'text-red-800',
                  message.type === 'success' && 'text-green-800'
                )}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Actions (right side) - Hidden on mobile */}
          {actions.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant}
                  size="xs"
                  onClick={() => onTransition?.(action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
