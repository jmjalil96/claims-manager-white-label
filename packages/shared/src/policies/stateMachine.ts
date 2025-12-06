/**
 * Policy State Machine - Simple lifecycle management for policies
 *
 * State Flow:
 * PENDING → ACTIVE ↔ EXPIRED (payment toggles)
 *              ↓
 *          CANCELLED
 *
 * Transitions:
 * - PENDING → ACTIVE, CANCELLED
 * - ACTIVE → EXPIRED, CANCELLED
 * - EXPIRED → ACTIVE, CANCELLED (can reactivate when paid)
 * - CANCELLED → (terminal)
 */

import { PolicyStatus } from '../enums/index.js'

// =============================================================================
// TRANSITIONS
// =============================================================================

const TRANSITIONS = {
  [PolicyStatus.PENDING]: [PolicyStatus.ACTIVE, PolicyStatus.CANCELLED],
  [PolicyStatus.ACTIVE]: [PolicyStatus.EXPIRED, PolicyStatus.CANCELLED],
  [PolicyStatus.EXPIRED]: [PolicyStatus.ACTIVE, PolicyStatus.CANCELLED],
  [PolicyStatus.CANCELLED]: [],
} as const

// Terminal states
const TERMINAL_STATES: PolicyStatus[] = [PolicyStatus.CANCELLED]

// =============================================================================
// EDITABLE FIELDS
// =============================================================================

// Required fields (only editable in PENDING)
const REQUIRED_FIELDS = ['policyNumber', 'startDate', 'endDate'] as const

// Optional fields (always editable)
const OPTIONAL_FIELDS = [
  'type',
  'ambCopay',
  'hospCopay',
  'maternity',
  'tPremium',
  'tplus1Premium',
  'tplusfPremium',
  'benefitsCost',
] as const

// =============================================================================
// TRANSITION REQUIREMENTS
// =============================================================================

// Fields required to activate a policy (PENDING → ACTIVE)
const ACTIVATION_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const

const TRANSITION_REQUIREMENTS: Record<string, readonly string[]> = {
  'PENDING->ACTIVE': ACTIVATION_FIELDS,
  '*->CANCELLED': ['cancellationReason'],
  'ACTIVE->EXPIRED': ['expirationReason'],
}

// =============================================================================
// STATE INVARIANTS (fields that cannot be nullified in each state)
// =============================================================================

const STATE_INVARIANTS: Record<PolicyStatus, readonly string[]> = {
  [PolicyStatus.PENDING]: [], // No invariants - all fields can be null
  [PolicyStatus.ACTIVE]: ACTIVATION_FIELDS, // All fields required, cannot be nullified
  [PolicyStatus.EXPIRED]: ACTIVATION_FIELDS, // Keep fields from when active
  [PolicyStatus.CANCELLED]: [], // Terminal state, no edits allowed anyway
}

// =============================================================================
// HELPER FUNCTIONS (Policy-specific naming to avoid collisions)
// =============================================================================

export const canPolicyTransition = (from: PolicyStatus, to: PolicyStatus): boolean =>
  (TRANSITIONS[from] as readonly PolicyStatus[]).includes(to)

export const getAllowedPolicyTransitions = (status: PolicyStatus): readonly PolicyStatus[] =>
  TRANSITIONS[status] as readonly PolicyStatus[]

export const isPolicyTerminal = (status: PolicyStatus): boolean => TERMINAL_STATES.includes(status)

export const getPolicyEditableFields = (status: PolicyStatus): readonly string[] =>
  status === PolicyStatus.PENDING
    ? [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]
    : [...OPTIONAL_FIELDS]

export const getPolicyStateInvariants = (status: PolicyStatus): readonly string[] =>
  STATE_INVARIANTS[status]

export const getPolicyTransitionRequirements = (
  from: PolicyStatus,
  to: PolicyStatus
): readonly string[] => {
  if (to === PolicyStatus.CANCELLED) {
    return TRANSITION_REQUIREMENTS['*->CANCELLED'] ?? []
  }
  const key = `${from}->${to}`
  return TRANSITION_REQUIREMENTS[key] ?? []
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface PolicyValidationInput {
  policy: Record<string, unknown>
  updates: Record<string, unknown>
}

export interface PolicyValidationResult {
  valid: boolean
  error: string | null
  createExpiration: boolean
}

export function validatePolicyUpdate(input: PolicyValidationInput): PolicyValidationResult {
  const { policy, updates } = input
  const status = policy.status as PolicyStatus
  const toStatus = updates.status as PolicyStatus | undefined

  const { status: _status, expirationReason, cancellationReason, ...fieldUpdates } = updates
  void _status // Unused, destructured to exclude from fieldUpdates

  const fail = (error: string): PolicyValidationResult => ({
    valid: false,
    error,
    createExpiration: false,
  })

  // 1. Terminal state check
  if (isPolicyTerminal(status)) {
    return fail('No se puede editar una póliza cancelada')
  }

  // 2. Editable fields check
  const editableFields = getPolicyEditableFields(status)
  const attemptedFields = Object.keys(fieldUpdates).filter((k) => fieldUpdates[k] !== undefined)
  const forbiddenFields = attemptedFields.filter((f) => !editableFields.includes(f))

  if (forbiddenFields.length > 0) {
    return fail(
      `No se pueden editar estos campos en estado ${status}: ${forbiddenFields.join(', ')}`
    )
  }

  // 3. Date validation
  const merged = { ...policy, ...fieldUpdates }
  const startDate = merged.startDate as Date | string | null
  const endDate = merged.endDate as Date | string | null

  if (startDate && endDate) {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    if (end < start) {
      return fail('La fecha de fin debe ser igual o posterior a la fecha de inicio')
    }
  }

  // 3.5. Prevent nullifying invariant fields (only applies to ACTIVE/EXPIRED)
  const stateInvariants = getPolicyStateInvariants(status)
  const nullifiedInvariants = stateInvariants.filter(
    (f) => attemptedFields.includes(f) && fieldUpdates[f] === null
  )
  if (nullifiedInvariants.length > 0) {
    return fail(
      `No se pueden vaciar estos campos en estado ${status}: ${nullifiedInvariants.join(', ')}`
    )
  }

  // 3.6. Ensure merged state maintains invariants
  const brokenInvariants = stateInvariants.filter((f) => merged[f] == null)
  if (brokenInvariants.length > 0) {
    return fail(`Campos requeridos no pueden estar vacíos: ${brokenInvariants.join(', ')}`)
  }

  // 4. Transition validation
  let createExpiration = false

  if (toStatus && toStatus !== status) {
    if (!canPolicyTransition(status, toStatus)) {
      return fail(`No se puede cambiar de ${status} a ${toStatus}`)
    }

    const requirements = getPolicyTransitionRequirements(status, toStatus)
    const requirementSource: Record<string, unknown> = {
      ...merged,
      expirationReason,
      cancellationReason,
    }
    const missing = requirements.filter((f) => !requirementSource[f])

    if (missing.length > 0) {
      return fail(`Faltan campos requeridos para cambiar a ${toStatus}: ${missing.join(', ')}`)
    }

    // Flag for creating expiration record
    if (status === PolicyStatus.ACTIVE && toStatus === PolicyStatus.EXPIRED) {
      createExpiration = true
    }
  }

  return { valid: true, error: null, createExpiration }
}
