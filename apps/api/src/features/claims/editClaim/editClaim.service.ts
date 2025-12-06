/**
 * Service layer for editing claims
 * Contains business logic, state machine validation, and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit, diff } from '../../../lib/audit.js'
import { calculateBusinessDays } from '../../../utils/date.js'
import { validate as validateStateMachine } from '@claims/shared'
import type { EditClaimInput } from './editClaim.schema.js'
import type { UpdateClaimResponseDto } from './editClaim.dto.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('claims:editClaim')

/**
 * Edit an existing claim with state machine validation
 *
 * @param id - Claim ID to edit
 * @param input - Validated update data
 * @param user - Authenticated user context (must be internal role)
 * @returns Updated claim data
 * @throws AppError for not found or validation failures
 */
export async function editClaim(
  id: string,
  input: EditClaimInput,
  user: AuthUser
): Promise<UpdateClaimResponseDto> {
  logger.info({ claimId: id, userId: user.id, updates: Object.keys(input) }, 'Editing claim')

  // 1. Fetch existing claim
  const claim = await db.claim.findUnique({
    where: { id },
  })

  if (!claim) {
    throw AppError.notFound('Reclamo')
  }

  // 2. Prepare claim record for state machine (convert to plain object)
  const claimRecord: Record<string, unknown> = {
    ...claim,
    status: claim.status,
  }

  // 3. Prepare updates for state machine
  const { reprocessDate, reprocessDescription, ...fieldUpdates } = input

  const updates: Record<string, unknown> = { ...fieldUpdates }
  if (reprocessDate !== undefined) updates.reprocessDate = reprocessDate
  if (reprocessDescription !== undefined) updates.reprocessDescription = reprocessDescription

  // 4. Validate using state machine
  const validationResult = validateStateMachine({
    claim: claimRecord,
    updates,
    role: user.role ?? '',
  })

  if (!validationResult.valid) {
    logger.warn({ claimId: id, error: validationResult.error }, 'Claim edit validation failed')
    throw AppError.badRequest(validationResult.error ?? 'Error de validación')
  }

  // 5. Build update data (exclude special fields that aren't on Claim table)
  const updateData: Record<string, unknown> = {}

  // Only include fields that are actually on the Claim model
  const claimFields = [
    'status',
    'policyId',
    'description',
    'careType',
    'diagnosisCode',
    'diagnosisDescription',
    'incidentDate',
    'amountSubmitted',
    'submittedDate',
    'amountApproved',
    'amountDenied',
    'amountUnprocessed',
    'deductibleApplied',
    'copayApplied',
    'settlementDate',
    'settlementNumber',
    'settlementNotes',
    'pendingReason',
    'returnReason',
    'cancellationReason',
  ] as const

  for (const field of claimFields) {
    if (field in input && input[field as keyof EditClaimInput] !== undefined) {
      const value = input[field as keyof EditClaimInput]

      // Convert date strings to Date objects
      if (
        (field === 'incidentDate' || field === 'submittedDate' || field === 'settlementDate') &&
        typeof value === 'string'
      ) {
        updateData[field] = new Date(value)
      } else {
        updateData[field] = value
      }
    }
  }

  // Always set updatedById
  updateData.updatedById = user.id

  // 6. Handle reprocess creation if transitioning PENDING_INFO → SUBMITTED
  if (validationResult.createReprocess && validationResult.reprocessData) {
    const { reprocessDate: rpDate, reprocessDescription: rpDesc } = validationResult.reprocessData

    if (rpDate && rpDesc) {
      // Calculate business days from previous cycle start (not always from submittedDate)
      let businessDays: number | undefined
      if (validationResult.autoCalculateBusinessDays) {
        // Get previous reprocess (if any) to determine cycle start
        const previousReprocess = await db.claimReprocess.findFirst({
          where: { claimId: id },
          orderBy: { reprocessDate: 'desc' },
          select: { reprocessDate: true },
        })

        const cycleStart = previousReprocess?.reprocessDate ?? claim.submittedDate
        if (cycleStart) {
          businessDays = calculateBusinessDays(cycleStart, new Date(rpDate as string))
        }
      }

      await db.claimReprocess.create({
        data: {
          claimId: id,
          reprocessDate: new Date(rpDate as string),
          reprocessDescription: rpDesc as string,
          businessDays,
          createdById: user.id,
        },
      })

      logger.info({ claimId: id, reprocessDate: rpDate }, 'Created reprocess record')
    }
  }

  // 7. Update claim
  const updatedClaim = await db.claim.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      claimNumber: true,
      status: true,
      updatedAt: true,
    },
  })

  logger.info({ claimId: id, newStatus: updatedClaim.status }, 'Claim updated successfully')

  audit({
    action: input.status ? 'STATUS_CHANGE' : 'UPDATE',
    resourceType: 'Claim',
    resourceId: id,
    userId: user.id,
    clientId: claim.clientId,
    changes: diff(claimRecord, updateData),
    metadata: { claimNumber: updatedClaim.claimNumber },
  })

  return {
    id: updatedClaim.id,
    claimNumber: updatedClaim.claimNumber,
    status: updatedClaim.status,
    updatedAt: updatedClaim.updatedAt.toISOString(),
  }
}

