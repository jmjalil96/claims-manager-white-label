/**
 * Shared constants for the API
 */

/**
 * Internal roles that bypass client access checks
 * These are employee/admin roles that can access all clients
 */
export const INTERNAL_ROLES = [
  'superadmin',
  'claims_admin',
  'claims_employee',
  'operations_employee',
] as const

export type InternalRole = (typeof INTERNAL_ROLES)[number]

/**
 * Check if a role is an internal role
 */
export function isInternalRole(role: string | null): boolean {
  return role !== null && INTERNAL_ROLES.includes(role as InternalRole)
}

/**
 * SLA limits per claim status (in business days)
 * Statuses not listed here have no SLA limit (terminal states)
 */
export const SLA_LIMITS: Record<string, number> = {
  DRAFT: 1,
  VALIDATION: 1,
  SUBMITTED: 8,
  PENDING_INFO: 3,
}
