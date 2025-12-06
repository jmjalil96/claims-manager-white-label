import { PolicyStatus } from '@claims/shared'

export interface WorkflowAction {
  label: string
  status: PolicyStatus
  variant: 'outline' | 'primary' | 'ghost'
}

/**
 * Returns the available workflow actions for a given policy status.
 * Used by the policy workflow stepper to show transition buttons.
 *
 * State Machine:
 * PENDING → ACTIVE | CANCELLED
 * ACTIVE → EXPIRED | CANCELLED
 * EXPIRED → ACTIVE | CANCELLED
 * CANCELLED → (terminal)
 */
export function getWorkflowActions(currentStatus: PolicyStatus): WorkflowAction[] {
  switch (currentStatus) {
    case PolicyStatus.PENDING:
      return [
        { label: 'Cancelar', status: PolicyStatus.CANCELLED, variant: 'outline' },
        { label: 'Activar', status: PolicyStatus.ACTIVE, variant: 'primary' },
      ]

    case PolicyStatus.ACTIVE:
      return [
        { label: 'Cancelar', status: PolicyStatus.CANCELLED, variant: 'outline' },
        { label: 'Expirar', status: PolicyStatus.EXPIRED, variant: 'outline' },
      ]

    case PolicyStatus.EXPIRED:
      return [
        { label: 'Cancelar', status: PolicyStatus.CANCELLED, variant: 'outline' },
        { label: 'Reactivar', status: PolicyStatus.ACTIVE, variant: 'primary' },
      ]

    case PolicyStatus.CANCELLED:
    default:
      return []
  }
}

/**
 * Returns the target statuses available from the current status.
 * Simplified version for testing transitions without UI concerns.
 */
export function getAvailableTransitions(currentStatus: PolicyStatus): PolicyStatus[] {
  return getWorkflowActions(currentStatus).map((action) => action.status)
}
