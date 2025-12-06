/**
 * Service layer for editing policies
 * Implements 7-step flow following claims pattern
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { audit, diff } from '../../../lib/audit.js'
import { createLogger } from '../../../lib/logger.js'
import { validatePolicyUpdate, PolicyStatus } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'
import type { EditPolicyInput } from './editPolicy.schema.js'
import type { UpdatePolicyResponseDto } from './editPolicy.dto.js'

const logger = createLogger('policies:editPolicy')

/**
 * Edit a policy - handles both field updates and status transitions
 *
 * 7-step flow:
 * 1. Fetch policy (throw 404 if not found)
 * 2. Prepare policy record for state machine
 * 3. Extract transition-specific fields (expirationReason, cancellationReason)
 * 4. Validate using state machine
 * 5. Build update data (convert dates, only policy table fields)
 * 6. Handle PolicyExpiration creation if ACTIVE→EXPIRED
 * 7. Update policy + audit log
 */
export async function editPolicy(
  id: string,
  input: EditPolicyInput,
  user: AuthUser
): Promise<UpdatePolicyResponseDto> {
  // 1. Fetch policy
  const policy = await db.policy.findUnique({ where: { id } })
  if (!policy) {
    throw AppError.notFound('Póliza')
  }

  logger.info({ policyId: id, userId: user.id, input }, 'Editing policy')

  // 2. Prepare policy record for state machine
  const policyRecord: Record<string, unknown> = { ...policy }

  // 3. Extract transition-specific fields
  const { expirationReason, cancellationReason, ...fieldUpdates } = input
  const updates: Record<string, unknown> = { ...fieldUpdates }
  if (expirationReason !== undefined) updates.expirationReason = expirationReason
  if (cancellationReason !== undefined) updates.cancellationReason = cancellationReason

  // 4. Validate using state machine
  const validationResult = validatePolicyUpdate({
    policy: policyRecord,
    updates,
  })

  if (!validationResult.valid) {
    logger.warn({ policyId: id, error: validationResult.error }, 'Policy edit validation failed')
    throw AppError.badRequest(validationResult.error ?? 'Error de validación')
  }

  // 5. Build update data (only policy table fields)
  const updateData: Record<string, unknown> = {}
  const policyFields = [
    'status',
    'policyNumber',
    'startDate',
    'endDate',
    'type',
    'ambCopay',
    'hospCopay',
    'maternity',
    'tPremium',
    'tplus1Premium',
    'tplusfPremium',
    'benefitsCost',
    'cancellationReason',
  ] as const

  for (const field of policyFields) {
    if (field in input && input[field as keyof EditPolicyInput] !== undefined) {
      const value = input[field as keyof EditPolicyInput]
      // Convert date strings to Date objects
      if ((field === 'startDate' || field === 'endDate') && typeof value === 'string') {
        updateData[field] = new Date(value)
      } else {
        updateData[field] = value
      }
    }
  }

  // Handle cancellation timestamp
  if (input.status === PolicyStatus.CANCELLED && !policy.cancelledAt) {
    updateData.cancelledAt = new Date()
  }

  // 6. Handle PolicyExpiration creation if ACTIVE→EXPIRED
  if (validationResult.createExpiration && expirationReason) {
    await db.policyExpiration.create({
      data: {
        policyId: id,
        expirationReason,
        createdById: user.id,
      },
    })
    logger.info({ policyId: id }, 'Created policy expiration record')
  }

  // 7. Update policy + audit log
  const updatedPolicy = await db.policy.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      policyNumber: true,
      status: true,
      updatedAt: true,
    },
  })

  audit({
    action: input.status ? 'STATUS_CHANGE' : 'UPDATE',
    resourceType: 'Policy',
    resourceId: id,
    userId: user.id,
    clientId: policy.clientId,
    changes: diff(policyRecord, updateData),
    metadata: { policyNumber: updatedPolicy.policyNumber },
  })

  logger.info(
    { policyId: id, status: updatedPolicy.status },
    'Policy updated successfully'
  )

  return {
    id: updatedPolicy.id,
    policyNumber: updatedPolicy.policyNumber,
    status: updatedPolicy.status as PolicyStatus,
    updatedAt: updatedPolicy.updatedAt.toISOString(),
  }
}
