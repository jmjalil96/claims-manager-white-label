/**
 * Service layer for getting available clients
 * Returns clients for policy creation
 */

import { db } from '../../../../lib/db.js'
import { createLogger } from '../../../../lib/logger.js'
import type { ClientDto } from './getAvailableClients.dto.js'

const logger = createLogger('policies:getAvailableClients')

/**
 * Get available clients for policy creation
 *
 * Authorization handled at route level via requireInternalRole
 * Returns ALL active clients (broker employees can see all)
 *
 * @returns List of active clients
 */
export async function getAvailableClients(): Promise<ClientDto[]> {
  logger.info('Fetching available clients')

  const clients = await db.client.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      taxId: true,
    },
    orderBy: { name: 'asc' },
  })

  logger.debug({ count: clients.length }, 'Returning active clients')
  return clients
}
