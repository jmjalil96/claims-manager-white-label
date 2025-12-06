export type ConsistencyStatus = 'match' | 'close' | 'mismatch'

export interface ConsistencyResult {
  status: ConsistencyStatus
  label: string
}

const CONSISTENCY_LABELS: Record<ConsistencyStatus, string> = {
  match: 'Coincide',
  close: 'Diferencia menor',
  mismatch: 'No coincide',
}

/**
 * Compares invoice total against claim amount and returns consistency status.
 * - 'match': exact match (diff === 0)
 * - 'close': within 5% tolerance
 * - 'mismatch': difference exceeds 5%
 *
 * Returns null if claimAmount is undefined or 0 (cannot compare).
 */
export function getConsistencyStatus(
  invoiceTotal: number,
  claimAmount: number | undefined
): ConsistencyResult | null {
  if (claimAmount === undefined || claimAmount === 0) return null

  const diff = Math.abs(invoiceTotal - claimAmount)
  const percentDiff = (diff / claimAmount) * 100

  if (diff === 0) {
    return { status: 'match', label: CONSISTENCY_LABELS.match }
  }
  if (percentDiff <= 5) {
    return { status: 'close', label: CONSISTENCY_LABELS.close }
  }
  return { status: 'mismatch', label: CONSISTENCY_LABELS.mismatch }
}
