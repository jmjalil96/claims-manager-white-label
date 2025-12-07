/**
 * Service layer for getting available clients
 * Returns all active clients for affiliate creation
 */

import { db } from '../../../lib/db.js'
import { createLogger } from '../../../lib/logger.js'
import type { ClientDto } from './getAvailableClients.dto.js'

const logger = createLogger('affiliates:getAvailableClients')

/**
 * Get available clients for affiliate creation
 *
 * Authorization: Internal roles only (enforced by middleware)
 * No scoping required - returns all active clients
 *
 * @returns List of available clients
 */
export async function getAvailableClients(): Promise<ClientDto[]> {
  logger.info('Fetching available clients for affiliate creation')

  const clients = await db.client.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      taxId: true,
    },
    orderBy: { name: 'asc' },
  })

  logger.debug({ count: clients.length }, 'Returning all active clients')
  return clients
}
