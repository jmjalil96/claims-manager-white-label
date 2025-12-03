/**
 * Service layer for deleting claims
 * Contains business logic
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('claims:deleteClaim')

/**
 * Delete a claim by ID (hard delete)
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * @param id - Claim ID
 * @param user - Authenticated user context (for logging)
 * @returns Deleted claim ID
 */
export async function deleteClaim(id: string, user: AuthUser): Promise<{ id: string }> {
  logger.info({ claimId: id, userId: user.id }, 'Deleting claim')

  // 1. Verify claim exists
  const claim = await db.claim.findUnique({
    where: { id },
    select: { id: true, claimNumber: true, clientId: true },
  })

  if (!claim) {
    logger.warn({ claimId: id, userId: user.id }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Delete claim
  await db.claim.delete({
    where: { id },
  })

  logger.info(
    { claimId: id, claimNumber: claim.claimNumber, userId: user.id },
    'Claim deleted successfully'
  )

  audit({
    action: 'DELETE',
    resourceType: 'Claim',
    resourceId: id,
    userId: user.id,
    clientId: claim.clientId,
    metadata: { claimNumber: claim.claimNumber },
  })

  return { id }
}
