/**
 * Service layer for getting policy audit trail
 * Contains business logic and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { GetPolicyAuditQuery } from './getPolicyAudit.schema.js'
import type { GetPolicyAuditResponse, AuditLogItemDto, PaginationMeta } from './getPolicyAudit.dto.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('policies:getPolicyAudit')

/**
 * Get audit trail for a policy by ID
 *
 * Authorization matrix:
 * - Internal roles: Full access to all policies' audit logs
 * - External roles with client access: Policies for accessible clients only
 *
 * @param policyId - Policy ID
 * @param query - Pagination parameters
 * @param user - Authenticated user context
 * @returns Paginated audit logs
 */
export async function getPolicyAudit(
  policyId: string,
  query: GetPolicyAuditQuery,
  user: AuthUser
): Promise<GetPolicyAuditResponse> {
  const { page, limit } = query

  logger.info({ policyId, userId: user.id, page, limit }, 'Getting policy audit trail')

  // 1. Fetch policy to verify existence and authorization
  const policy = await db.policy.findUnique({
    where: { id: policyId },
    select: { id: true, clientId: true, policyNumber: true },
  })

  if (!policy) {
    logger.warn({ policyId, userId: user.id }, 'Policy not found')
    throw AppError.notFound('Póliza')
  }

  // 2. Authorization check
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    // External roles: check client access
    const hasAccess = await db.userClient.findUnique({
      where: {
        userId_clientId: { userId: user.id, clientId: policy.clientId },
        isActive: true,
      },
    })

    if (!hasAccess) {
      logger.warn({ policyId, userId: user.id, clientId: policy.clientId }, 'Client access denied')
      throw AppError.forbidden('Sin acceso a esta póliza')
    }
  }

  // 3. Count total audit logs for this policy
  const totalCount = await db.auditLog.count({
    where: {
      resourceType: 'Policy',
      resourceId: policyId,
    },
  })

  // 4. Fetch paginated audit logs with user details
  const skip = (page - 1) * limit

  const auditLogs = await db.auditLog.findMany({
    where: {
      resourceType: 'Policy',
      resourceId: policyId,
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    select: {
      id: true,
      action: true,
      resourceType: true,
      resourceId: true,
      userId: true,
      changes: true,
      metadata: true,
      ipAddress: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  // 5. Transform to DTO
  const auditLogDtos: AuditLogItemDto[] = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    userId: log.userId,
    userName: log.user?.name ?? null,
    userEmail: log.user?.email ?? null,
    changes: log.changes,
    metadata: log.metadata,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
  }))

  logger.info(
    { policyId, policyNumber: policy.policyNumber, totalCount, returned: auditLogDtos.length },
    'Policy audit trail retrieved successfully'
  )

  return {
    auditLogs: auditLogDtos,
    meta: buildMeta(totalCount, page, limit),
  }
}

/**
 * Build pagination metadata
 */
function buildMeta(totalCount: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit)
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
