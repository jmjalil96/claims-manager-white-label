import { ClaimStatus } from '@claims/shared'

export interface WorkflowAction {
  label: string
  status: ClaimStatus
  variant: 'outline' | 'primary' | 'ghost'
}

/**
 * Returns the available workflow actions for a given claim status.
 * Used by the claim workflow stepper to show transition buttons.
 */
export function getWorkflowActions(currentStatus: ClaimStatus): WorkflowAction[] {
  switch (currentStatus) {
    case ClaimStatus.DRAFT:
      return [{ label: 'Enviar a Validación', status: ClaimStatus.VALIDATION, variant: 'primary' }]

    case ClaimStatus.VALIDATION:
      return [
        { label: 'Devolver', status: ClaimStatus.DRAFT, variant: 'outline' },
        { label: 'Presentar', status: ClaimStatus.SUBMITTED, variant: 'primary' },
      ]

    case ClaimStatus.SUBMITTED:
      return [
        { label: 'Solicitar Info', status: ClaimStatus.PENDING_INFO, variant: 'outline' },
        { label: 'Devolver', status: ClaimStatus.RETURNED, variant: 'outline' },
        { label: 'Liquidar', status: ClaimStatus.SETTLED, variant: 'primary' },
      ]

    case ClaimStatus.PENDING_INFO:
      return [
        { label: 'Info Recibida', status: ClaimStatus.SUBMITTED, variant: 'primary' },
        { label: 'Devolver', status: ClaimStatus.RETURNED, variant: 'outline' },
      ]

    case ClaimStatus.RETURNED:
      return [{ label: 'Reintentar', status: ClaimStatus.DRAFT, variant: 'primary' }]

    case ClaimStatus.SETTLED:
    case ClaimStatus.CANCELLED:
    default:
      return []
  }
}

/**
 * Returns the target statuses available from the current status.
 * Simplified version for testing transitions without UI concerns.
 */
export function getAvailableTransitions(currentStatus: ClaimStatus): ClaimStatus[] {
  return getWorkflowActions(currentStatus).map((action) => action.status)
}
