import { PolicyStatus, PolicyStatusLabel } from '@claims/shared'

/* -----------------------------------------------------------------------------
 * Policies Kanban Configuration
 * -------------------------------------------------------------------------- */

/** Column order for policies kanban */
export const POLICIES_KANBAN_COLUMNS: PolicyStatus[] = [
  PolicyStatus.PENDING,
  PolicyStatus.ACTIVE,
  PolicyStatus.EXPIRED,
  PolicyStatus.CANCELLED,
]

/** Border color mapping for policies statuses */
export const POLICIES_STATUS_COLORS: Record<PolicyStatus, string> = {
  PENDING: 'border-t-amber-500',
  ACTIVE: 'border-t-green-500',
  EXPIRED: 'border-t-slate-400',
  CANCELLED: 'border-t-slate-300',
}

/** Get label for policy status */
export const getPolicyStatusLabel = (status: PolicyStatus): string =>
  PolicyStatusLabel[status]

/** Get border color for policy status */
export const getPolicyStatusColor = (status: PolicyStatus): string =>
  POLICIES_STATUS_COLORS[status]
