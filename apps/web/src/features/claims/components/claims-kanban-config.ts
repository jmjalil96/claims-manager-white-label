import { ClaimStatus, ClaimStatusLabel } from '@claims/shared'

/* -----------------------------------------------------------------------------
 * Claims Kanban Configuration
 * -------------------------------------------------------------------------- */

/** Column order for claims kanban */
export const CLAIMS_KANBAN_COLUMNS: ClaimStatus[] = [
  ClaimStatus.DRAFT,
  ClaimStatus.VALIDATION,
  ClaimStatus.SUBMITTED,
  ClaimStatus.PENDING_INFO,
  ClaimStatus.RETURNED,
  ClaimStatus.SETTLED,
  ClaimStatus.CANCELLED,
]

/** Border color mapping for claims statuses */
export const CLAIMS_STATUS_COLORS: Record<ClaimStatus, string> = {
  DRAFT: 'border-t-slate-300',
  VALIDATION: 'border-t-blue-500',
  SUBMITTED: 'border-t-slate-400',
  PENDING_INFO: 'border-t-amber-500',
  RETURNED: 'border-t-red-500',
  SETTLED: 'border-t-green-500',
  CANCELLED: 'border-t-slate-300',
}

/** Get label for claim status */
export const getClaimStatusLabel = (status: ClaimStatus): string =>
  ClaimStatusLabel[status]

/** Get border color for claim status */
export const getClaimStatusColor = (status: ClaimStatus): string =>
  CLAIMS_STATUS_COLORS[status]
