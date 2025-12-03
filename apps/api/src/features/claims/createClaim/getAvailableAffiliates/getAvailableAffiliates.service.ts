/**
 * Service layer for getting available affiliates
 * Returns affiliates the user can select for claim creation
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { isInternalRole } from '../../../../lib/constants.js'
import type { AffiliateDto } from './getAvailableAffiliates.dto.js'
import type { AuthUser } from '../../../../middleware/auth.js'

const logger = createLogger('claims:getAvailableAffiliates')

/**
 * Get available affiliates for a client
 *
 * Authorization:
 * - Internal roles: All active OWNER affiliates in the client
 * - External roles with client access: All active OWNER affiliates in the client
 * - Affiliates: Only themselves (must belong to this client)
 *
 * @param clientId - Client ID to get affiliates for
 * @param user - Authenticated user context
 * @returns List of available affiliates
 * @throws AppError for authorization or validation failures
 */
export async function getAvailableAffiliates(
  clientId: string,
  user: AuthUser
): Promise<AffiliateDto[]> {
  logger.info({ clientId, userId: user.id }, 'Fetching available affiliates')

  // 1. Validate client exists and is active
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, isActive: true },
  })

  if (!client) {
    throw AppError.notFound('Cliente')
  }

  if (!client.isActive) {
    throw AppError.badRequest('El cliente no está activo')
  }

  // 2. Check user has access to this client
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    const hasClientAccess = await db.userClient.findUnique({
      where: {
        userId_clientId: { userId: user.id, clientId },
        isActive: true,
      },
    })

    if (!hasClientAccess) {
      logger.warn({ userId: user.id, clientId }, 'User does not have access to client')
      throw AppError.forbidden('Sin acceso a este cliente')
    }
  }

  // 3. For affiliates: return only themselves
  if (user.role === 'client_affiliate') {
    const userAffiliate = await db.affiliate.findFirst({
      where: {
        userId: user.id,
        clientId,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        documentNumber: true,
        affiliateType: true,
      },
    })

    if (!userAffiliate) {
      logger.warn({ userId: user.id, clientId }, 'Affiliate user not found in this client')
      throw AppError.forbidden('No es afiliado de este cliente')
    }

    logger.debug({ affiliateId: userAffiliate.id }, 'Returning self for affiliate role')
    return [userAffiliate]
  }

  // 4. For other roles: return all active OWNER affiliates
  const affiliates = await db.affiliate.findMany({
    where: {
      clientId,
      isActive: true,
      affiliateType: 'OWNER',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      documentNumber: true,
      affiliateType: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  logger.debug({ count: affiliates.length }, 'Returning affiliates for client')
  return affiliates
}
