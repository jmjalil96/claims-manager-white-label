/**
 * Service layer for getting a single client
 * Contains business logic and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { GetClientResponse, ClientDetailDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('clients:getClient')

/**
 * Get a single client by ID
 *
 * Authorization matrix:
 * - Internal roles: Can access any client
 * - External roles: Must have UserClient access
 *
 * @param id - Client ID
 * @param user - Authenticated user context
 * @returns Client detail
 */
export async function getClient(
  id: string,
  user: AuthUser
): Promise<GetClientResponse> {
  logger.info({ clientId: id, userId: user.id }, 'Getting client')

  // 1. Fetch client with counts
  const client = await db.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          policies: true,
          affiliates: true,
        },
      },
    },
  })

  if (!client) {
    logger.warn({ clientId: id, userId: user.id }, 'Client not found')
    throw AppError.notFound('Cliente')
  }

  // 2. Authorization check
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    // External roles must have UserClient access
    const access = await db.userClient.findUnique({
      where: {
        userId_clientId: { userId: user.id, clientId: id },
        isActive: true,
      },
    })

    if (!access) {
      logger.warn({ clientId: id, userId: user.id }, 'Client access denied')
      throw AppError.forbidden('Sin acceso a este cliente')
    }
  }

  // 3. Transform to DTO
  const clientDto: ClientDetailDto = {
    id: client.id,
    name: client.name,
    taxId: client.taxId,
    email: client.email,
    phone: client.phone,
    address: client.address,
    isActive: client.isActive,
    policyCount: client._count.policies,
    affiliateCount: client._count.affiliates,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  }

  logger.info({ clientId: id }, 'Client retrieved successfully')

  return { client: clientDto }
}
