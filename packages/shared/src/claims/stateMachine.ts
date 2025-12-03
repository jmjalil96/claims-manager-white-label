/**
 * Claim State Machine - Bulletproof Edition
 *
 * 7-Status Workflow:
 * DRAFT -> VALIDATION -> SUBMITTED -> SETTLED (normal flow)
 *                     -> RETURNED (if docs incomplete)
 *          SUBMITTED -> PENDING_INFO -> SUBMITTED (reprocess loop)
 * Any state -> CANCELLED
 *
 * Terminal states: RETURNED, SETTLED, CANCELLED
 */

import { ClaimStatus } from '../enums/index.js'

// ═══════════════════════════════════════════════════════════════════
// FIELD GROUPS
// ═══════════════════════════════════════════════════════════════════

const DRAFT_FIELDS = [
  'policyId',
  'description',
  'careType',
  'diagnosisCode',
  'diagnosisDescription',
  'incidentDate',
] as const

const VALIDATION_EXTRA = ['amountSubmitted', 'submittedDate'] as const

const SETTLEMENT_FIELDS = [
  'diagnosisCode',
  'diagnosisDescription',
  'amountApproved',
  'amountDenied',
  'amountUnprocessed',
  'deductibleApplied',
  'copayApplied',
  'settlementDate',
  'settlementNumber',
  'settlementNotes',
] as const

// ═══════════════════════════════════════════════════════════════════
// STATE MACHINE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const LIFECYCLE = {
  [ClaimStatus.DRAFT]: {
    edit: DRAFT_FIELDS,
    next: [ClaimStatus.VALIDATION, ClaimStatus.CANCELLED],
    nonNullable: [] as readonly string[],
  },
  [ClaimStatus.VALIDATION]: {
    edit: [...DRAFT_FIELDS, ...VALIDATION_EXTRA],
    next: [ClaimStatus.SUBMITTED, ClaimStatus.RETURNED, ClaimStatus.CANCELLED],
    nonNullable: DRAFT_FIELDS as readonly string[],
  },
  [ClaimStatus.SUBMITTED]: {
    edit: SETTLEMENT_FIELDS,
    next: [ClaimStatus.PENDING_INFO, ClaimStatus.SETTLED, ClaimStatus.CANCELLED],
    nonNullable: ['diagnosisCode', 'diagnosisDescription'] as readonly string[],
  },
  [ClaimStatus.PENDING_INFO]: {
    edit: [] as readonly string[],
    next: [ClaimStatus.SUBMITTED, ClaimStatus.CANCELLED],
    nonNullable: [] as readonly string[],
  },
  [ClaimStatus.RETURNED]: {
    edit: [] as readonly string[],
    next: [] as ClaimStatus[],
    nonNullable: [] as readonly string[],
  },
  [ClaimStatus.SETTLED]: {
    edit: [] as readonly string[],
    next: [] as ClaimStatus[],
    nonNullable: [] as readonly string[],
  },
  [ClaimStatus.CANCELLED]: {
    edit: [] as readonly string[],
    next: [] as ClaimStatus[],
    nonNullable: [] as readonly string[],
  },
} as const

// ═══════════════════════════════════════════════════════════════════
// REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════

// Requirements to ENTER a state (checked on transition)
const STATE_ENTRY_REQUIREMENTS: Partial<Record<ClaimStatus, readonly string[]>> = {
  [ClaimStatus.VALIDATION]: ['clientId', 'affiliateId', 'patientId', 'policyId', ...DRAFT_FIELDS],
  [ClaimStatus.SUBMITTED]: VALIDATION_EXTRA,
  [ClaimStatus.SETTLED]: [
    'amountApproved',
    'amountDenied',
    'amountUnprocessed',
    'deductibleApplied',
    'copayApplied',
    'settlementDate',
    'settlementNumber',
    'settlementNotes',
  ],
}

// Special transition-specific requirements
const SPECIAL_TRANSITIONS: Record<
  string,
  {
    fields: readonly string[]
    createReprocess?: boolean
    autoCalculateBusinessDays?: boolean
  }
> = {
  'SUBMITTED->PENDING_INFO': { fields: ['pendingReason'] },
  'PENDING_INFO->SUBMITTED': {
    fields: ['reprocessDate', 'reprocessDescription'],
    createReprocess: true,
    autoCalculateBusinessDays: true,
  },
  'VALIDATION->RETURNED': { fields: ['returnReason'] },
  '*->CANCELLED': { fields: ['cancellationReason'] },
}

// State invariants (must always be present in each state)
const STATE_INVARIANTS: Record<ClaimStatus, readonly string[]> = {
  [ClaimStatus.DRAFT]: ['clientId', 'affiliateId', 'patientId'],
  [ClaimStatus.VALIDATION]: ['clientId', 'affiliateId', 'patientId', 'policyId', ...DRAFT_FIELDS],
  [ClaimStatus.SUBMITTED]: [
    'clientId',
    'affiliateId',
    'patientId',
    'policyId',
    ...DRAFT_FIELDS,
    ...VALIDATION_EXTRA,
  ],
  [ClaimStatus.PENDING_INFO]: [
    'clientId',
    'affiliateId',
    'patientId',
    'policyId',
    ...DRAFT_FIELDS,
    ...VALIDATION_EXTRA,
    'pendingReason',
  ],
  [ClaimStatus.RETURNED]: [
    'clientId',
    'affiliateId',
    'patientId',
    'policyId',
    ...DRAFT_FIELDS,
    'returnReason',
  ],
  [ClaimStatus.SETTLED]: [
    'clientId',
    'affiliateId',
    'patientId',
    'policyId',
    ...DRAFT_FIELDS,
    ...VALIDATION_EXTRA,
    'amountApproved',
    'amountDenied',
    'amountUnprocessed',
    'deductibleApplied',
    'copayApplied',
    'settlementDate',
    'settlementNumber',
    'settlementNotes',
  ],
  [ClaimStatus.CANCELLED]: ['cancellationReason'],
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const TERMINAL_STATES: ClaimStatus[] = [
  ClaimStatus.RETURNED,
  ClaimStatus.SETTLED,
  ClaimStatus.CANCELLED,
]

const ADMIN_ROLES = ['superadmin', 'claims_admin']
const INTERNAL_ROLES = ['superadmin', 'claims_admin', 'claims_employee', 'operations_employee']

// ═══════════════════════════════════════════════════════════════════
// HELPER EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const isTerminalState = (status: ClaimStatus): boolean => TERMINAL_STATES.includes(status)

export const canEdit = (role: string, status: ClaimStatus): boolean =>
  isTerminalState(status) ? ADMIN_ROLES.includes(role) : INTERNAL_ROLES.includes(role)

export const canTransition = (from: ClaimStatus, to: ClaimStatus): boolean =>
  (LIFECYCLE[from].next as readonly ClaimStatus[]).includes(to)

export const getEditableFields = (status: ClaimStatus): readonly string[] =>
  LIFECYCLE[status].edit as readonly string[]

export const getNonNullableFields = (status: ClaimStatus): readonly string[] =>
  LIFECYCLE[status].nonNullable

export const getStateInvariants = (status: ClaimStatus): readonly string[] =>
  STATE_INVARIANTS[status]

export const getAllowedTransitions = (status: ClaimStatus): readonly ClaimStatus[] =>
  LIFECYCLE[status].next as readonly ClaimStatus[]

export function getTransitionRequirements(from: ClaimStatus, to: ClaimStatus): readonly string[] {
  const key = `${from}->${to}`
  const specialTransition = SPECIAL_TRANSITIONS[key]
  if (specialTransition) return specialTransition.fields
  if (to === ClaimStatus.CANCELLED) {
    const cancelTransition = SPECIAL_TRANSITIONS['*->CANCELLED']
    return cancelTransition?.fields ?? []
  }
  return STATE_ENTRY_REQUIREMENTS[to] ?? []
}

export function getTransitionMetadata(
  from: ClaimStatus,
  to: ClaimStatus
): {
  createReprocess: boolean
  autoCalculateBusinessDays: boolean
} {
  const key = `${from}->${to}`
  const config = SPECIAL_TRANSITIONS[key]
  return {
    createReprocess: config?.createReprocess ?? false,
    autoCalculateBusinessDays: config?.autoCalculateBusinessDays ?? false,
  }
}

// ═══════════════════════════════════════════════════════════════════
// VALIDATION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ValidationInput {
  claim: Record<string, unknown>
  updates: Record<string, unknown>
  role: string
}

export interface ValidationResult {
  valid: boolean
  error: string | null
  createReprocess: boolean
  autoCalculateBusinessDays: boolean
  reprocessData?: {
    reprocessDate: unknown
    reprocessDescription: unknown
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function validate(input: ValidationInput): ValidationResult {
  const { claim, updates, role } = input
  const status = claim.status as ClaimStatus
  const toStatus = updates.status as ClaimStatus | undefined

  // Extract special fields that aren't on the Claim table (transition-specific fields)
  const {
    status: _,
    reprocessDate,
    reprocessDescription,
    pendingReason,
    returnReason,
    cancellationReason,
    ...fieldUpdates
  } = updates

  const fail = (error: string): ValidationResult => ({
    valid: false,
    error,
    createReprocess: false,
    autoCalculateBusinessDays: false,
  })

  // 1. PERMISSION CHECK
  if (!canEdit(role, status)) {
    return fail(`No tienes permiso para editar reclamos en estado ${status}`)
  }

  // 2. EDITABLE FIELDS CHECK
  const editableFields = getEditableFields(status)
  const attemptedFields = Object.keys(fieldUpdates).filter((k) => fieldUpdates[k] !== undefined)
  const forbiddenFields = attemptedFields.filter((f) => !editableFields.includes(f))

  if (forbiddenFields.length > 0) {
    return fail(`No puedes editar estos campos en estado ${status}: ${forbiddenFields.join(', ')}`)
  }

  // 3. NON-NULLABLE CHECK
  const nonNullableFields = getNonNullableFields(status)
  const nulledFields = attemptedFields.filter(
    (f) => nonNullableFields.includes(f) && (fieldUpdates[f] === null || fieldUpdates[f] === '')
  )

  if (nulledFields.length > 0) {
    return fail(`No se pueden vaciar estos campos: ${nulledFields.join(', ')}`)
  }

  // 4. STATE INVARIANTS CHECK
  const merged = { ...claim, ...fieldUpdates }
  const invariants = getStateInvariants(status)
  const violatedInvariants = invariants.filter((f) => merged[f] == null || merged[f] === '')

  if (violatedInvariants.length > 0) {
    return fail(`Campos requeridos no pueden estar vacíos: ${violatedInvariants.join(', ')}`)
  }

  // 5. BUSINESS VALIDATION: Date ordering
  const incidentDate = merged.incidentDate as Date | string | null
  const submittedDate = merged.submittedDate as Date | string | null
  const settlementDate = merged.settlementDate as Date | string | null

  if (incidentDate && submittedDate) {
    const incident = new Date(incidentDate).getTime()
    const submitted = new Date(submittedDate).getTime()
    if (incident > submitted) {
      return fail('La fecha de incurrencia no puede ser posterior a la fecha de presentación')
    }
  }

  if (settlementDate && submittedDate) {
    const settlement = new Date(settlementDate).getTime()
    const submitted = new Date(submittedDate).getTime()
    if (settlement <= submitted) {
      return fail('La fecha de liquidación debe ser posterior a la fecha de presentación')
    }
  }

  // 6. BUSINESS VALIDATION: Financial amounts
  const amountSubmitted = merged.amountSubmitted as number | null
  const amountApproved = merged.amountApproved as number | null
  const amountDenied = merged.amountDenied as number | null
  const amountUnprocessed = merged.amountUnprocessed as number | null
  const deductibleApplied = merged.deductibleApplied as number | null
  const copayApplied = merged.copayApplied as number | null

  if (
    amountSubmitted != null &&
    amountApproved != null &&
    amountDenied != null &&
    amountUnprocessed != null &&
    deductibleApplied != null &&
    copayApplied != null
  ) {
    const sum = amountApproved + amountDenied + amountUnprocessed + deductibleApplied + copayApplied
    if (Math.abs(amountSubmitted - sum) > 0.01) {
      return fail(
        `El monto presentado (${amountSubmitted}) debe ser igual a la suma de los montos de liquidación (${sum.toFixed(2)})`
      )
    }
  }

  // 7. TRANSITION VALIDATION
  let createReprocess = false
  let autoCalculateBusinessDays = false
  let reprocessData: { reprocessDate: unknown; reprocessDescription: unknown } | undefined

  if (toStatus && toStatus !== status) {
    // Check transition is allowed
    if (!canTransition(status, toStatus)) {
      return fail(`No se puede cambiar de ${status} a ${toStatus}`)
    }

    // Get transition metadata
    const metadata = getTransitionMetadata(status, toStatus)
    createReprocess = metadata.createReprocess
    autoCalculateBusinessDays = metadata.autoCalculateBusinessDays

    // Get transition requirements
    const requirements = getTransitionRequirements(status, toStatus)

    // Build source for checking requirements (includes transition-specific fields)
    const requirementSource: Record<string, unknown> = { ...merged }
    if (reprocessDate !== undefined) requirementSource.reprocessDate = reprocessDate
    if (reprocessDescription !== undefined)
      requirementSource.reprocessDescription = reprocessDescription
    if (pendingReason !== undefined) requirementSource.pendingReason = pendingReason
    if (returnReason !== undefined) requirementSource.returnReason = returnReason
    if (cancellationReason !== undefined) requirementSource.cancellationReason = cancellationReason

    // Check missing requirements
    const missingRequirements = requirements.filter(
      (f) => requirementSource[f] == null || requirementSource[f] === ''
    )

    if (missingRequirements.length > 0) {
      return fail(
        `Faltan campos requeridos para cambiar a ${toStatus}: ${missingRequirements.join(', ')}`
      )
    }

    // Store reprocess data if needed
    if (createReprocess) {
      reprocessData = { reprocessDate, reprocessDescription }
    }
  }

  return {
    valid: true,
    error: null,
    createReprocess,
    autoCalculateBusinessDays,
    reprocessData,
  }
}

// ═══════════════════════════════════════════════════════════════════
// TYPE EXPORTS (for consumers)
// ═══════════════════════════════════════════════════════════════════

export type ClaimField =
  | (typeof DRAFT_FIELDS)[number]
  | (typeof VALIDATION_EXTRA)[number]
  | (typeof SETTLEMENT_FIELDS)[number]
  | 'clientId'
  | 'affiliateId'
  | 'patientId'
  | 'returnReason'
  | 'cancellationReason'
  | 'pendingReason'

export type ReprocessField = 'reprocessDate' | 'reprocessDescription'
