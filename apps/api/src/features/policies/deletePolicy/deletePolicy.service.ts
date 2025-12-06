/**
 * Service layer for deleting policies
 * Contains business logic
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('policies:deletePolicy')

/**
 * Delete a policy by ID (hard delete)
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * @param id - Policy ID
 * @param user - Authenticated user context (for logging)
 * @returns Deleted policy ID
 */
export async function deletePolicy(id: string, user: AuthUser): Promise<{ id: string }> {
  logger.info({ policyId: id, userId: user.id }, 'Deleting policy')

  // 1. Verify policy exists
  const policy = await db.policy.findUnique({
    where: { id },
    select: { id: true, policyNumber: true, clientId: true },
  })

  if (!policy) {
    logger.warn({ policyId: id, userId: user.id }, 'Policy not found')
    throw AppError.notFound('Póliza')
  }

  // 2. Delete policy
  await db.policy.delete({
    where: { id },
  })

  logger.info(
    { policyId: id, policyNumber: policy.policyNumber, userId: user.id },
    'Policy deleted successfully'
  )

  audit({
    action: 'DELETE',
    resourceType: 'Policy',
    resourceId: id,
    userId: user.id,
    clientId: policy.clientId,
    metadata: { policyNumber: policy.policyNumber },
  })

  return { id }
}
