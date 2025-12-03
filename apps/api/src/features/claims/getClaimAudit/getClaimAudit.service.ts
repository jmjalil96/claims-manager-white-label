/**
 * Service layer for getting claim audit trail
 * Contains business logic and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { GetClaimAuditQuery } from './getClaimAudit.schema.js'
import type { GetClaimAuditResponse, AuditLogItemDto, PaginationMeta } from './getClaimAudit.dto.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('claims:getClaimAudit')

/**
 * Get audit trail for a claim by ID
 *
 * Authorization matrix:
 * - Internal roles: Full access to all claims' audit logs
 * - External roles with client access: Claims for accessible clients only
 * - Affiliates (client_affiliate): Only claims where they are the affiliate
 *
 * @param claimId - Claim ID
 * @param query - Pagination parameters
 * @param user - Authenticated user context
 * @returns Paginated audit logs
 */
export async function getClaimAudit(
  claimId: string,
  query: GetClaimAuditQuery,
  user: AuthUser
): Promise<GetClaimAuditResponse> {
  const { page, limit } = query

  logger.info({ claimId, userId: user.id, page, limit }, 'Getting claim audit trail')

  // 1. Fetch claim to verify existence and authorization
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true, clientId: true, affiliateId: true, claimNumber: true },
  })

  if (!claim) {
    logger.warn({ claimId, userId: user.id }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Authorization check
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    if (user.role === 'client_affiliate') {
      // Affiliates can only see claims where they are the affiliate
      const affiliate = await db.affiliate.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!affiliate || claim.affiliateId !== affiliate.id) {
        logger.warn({ claimId, userId: user.id }, 'Affiliate access denied')
        throw AppError.forbidden('Sin acceso a este reclamo')
      }
    } else {
      // External roles: check client access
      const hasAccess = await db.userClient.findUnique({
        where: {
          userId_clientId: { userId: user.id, clientId: claim.clientId },
          isActive: true,
        },
      })

      if (!hasAccess) {
        logger.warn({ claimId, userId: user.id, clientId: claim.clientId }, 'Client access denied')
        throw AppError.forbidden('Sin acceso a este reclamo')
      }
    }
  }

  // 3. Count total audit logs for this claim
  const totalCount = await db.auditLog.count({
    where: {
      resourceType: 'Claim',
      resourceId: claimId,
    },
  })

  // 4. Fetch paginated audit logs with user details
  const skip = (page - 1) * limit

  const auditLogs = await db.auditLog.findMany({
    where: {
      resourceType: 'Claim',
      resourceId: claimId,
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
    { claimId, claimNumber: claim.claimNumber, totalCount, returned: auditLogDtos.length },
    'Claim audit trail retrieved successfully'
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
