/**
 * Service layer for getting policy details
 * Contains business logic and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { PolicyDetailDto } from './getPolicy.dto.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('policies:getPolicy')

/**
 * Get policy details by ID
 *
 * Authorization matrix:
 * - Internal roles (broker employees): Full access
 * - Client admins/agents: Scoped to accessible clients
 * - Affiliates: No access to policies
 *
 * @param id - Policy ID
 * @param user - Authenticated user context
 * @returns Policy details
 */
export async function getPolicy(id: string, user: AuthUser): Promise<PolicyDetailDto> {
  logger.info({ policyId: id, userId: user.id }, 'Getting policy details')

  // 1. Fetch policy with relationships
  const policy = await db.policy.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      insurer: { select: { name: true } },
      expirations: {
        orderBy: { expiredAt: 'desc' },
        take: 1,
        select: { expirationReason: true },
      },
    },
  })

  if (!policy) {
    logger.warn({ policyId: id, userId: user.id }, 'Policy not found')
    throw AppError.notFound('Póliza')
  }

  // 2. Authorization check
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    if (user.role === 'client_affiliate') {
      // Affiliates cannot access policies
      logger.warn({ policyId: id, userId: user.id }, 'Affiliate access denied')
      throw AppError.forbidden('Afiliados no tienen acceso a pólizas')
    }

    // Client admins/agents: check client access
    const hasAccess = await db.userClient.findUnique({
      where: {
        userId_clientId: { userId: user.id, clientId: policy.clientId },
        isActive: true,
      },
    })

    if (!hasAccess) {
      logger.warn(
        { policyId: id, userId: user.id, clientId: policy.clientId },
        'Client access denied'
      )
      throw AppError.forbidden('Sin acceso a esta póliza')
    }
  }

  logger.info({ policyId: id, policyNumber: policy.policyNumber }, 'Policy retrieved successfully')

  // 3. Transform to DTO
  const policyDto: PolicyDetailDto = {
    id: policy.id,
    policyNumber: policy.policyNumber,
    clientId: policy.clientId,
    clientName: policy.client.name,
    insurerId: policy.insurerId,
    insurerName: policy.insurer.name,
    type: policy.type,
    status: policy.status,
    startDate: formatDate(policy.startDate),
    endDate: formatDate(policy.endDate),
    ambCopay: policy.ambCopay,
    hospCopay: policy.hospCopay,
    maternity: policy.maternity,
    tPremium: policy.tPremium,
    tplus1Premium: policy.tplus1Premium,
    tplusfPremium: policy.tplusfPremium,
    benefitsCost: policy.benefitsCost,
    isActive: policy.isActive,
    expirationReason: policy.expirations[0]?.expirationReason ?? null,
    cancellationReason: policy.cancellationReason,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  }

  return policyDto
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
