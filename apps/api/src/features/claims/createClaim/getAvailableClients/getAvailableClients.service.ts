/**
 * Service layer for getting available clients
 * Returns clients the user can create claims for
 */

import { db } from '../../../../lib/db.js'
import { createLogger } from '../../../../lib/logger.js'
import { isInternalRole } from '../../../../lib/constants.js'
import type { ClientDto } from './getAvailableClients.dto.js'
import type { AuthUser } from '../../../../middleware/auth.js'

const logger = createLogger('claims:getAvailableClients')

/**
 * Get available clients for claim creation
 *
 * Authorization:
 * - Internal roles: All active clients
 * - External roles: Only clients they have access to via UserClient
 * - Affiliates: Only their own client
 *
 * @param user - Authenticated user context
 * @returns List of available clients
 */
export async function getAvailableClients(user: AuthUser): Promise<ClientDto[]> {
  logger.info({ userId: user.id, role: user.role }, 'Fetching available clients')

  const hasInternalRole = isInternalRole(user.role)

  if (hasInternalRole) {
    // Internal roles can access all active clients
    const clients = await db.client.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        taxId: true,
      },
      orderBy: { name: 'asc' },
    })

    logger.debug({ count: clients.length }, 'Returning all active clients for internal role')
    return clients
  }

  // External roles: get clients from UserClient access
  const userClients = await db.userClient.findMany({
    where: {
      userId: user.id,
      isActive: true,
      client: { isActive: true },
    },
    select: {
      client: {
        select: {
          id: true,
          name: true,
          taxId: true,
        },
      },
    },
    orderBy: { client: { name: 'asc' } },
  })

  const clients = userClients.map((uc) => uc.client)

  logger.debug({ count: clients.length }, 'Returning accessible clients for external role')
  return clients
}
