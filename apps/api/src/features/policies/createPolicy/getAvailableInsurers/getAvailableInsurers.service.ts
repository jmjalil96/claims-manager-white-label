/**
 * Service layer for getting available insurers
 * Returns insurers for policy creation
 */

import { db } from '../../../../lib/db.js'
import { createLogger } from '../../../../lib/logger.js'
import type { InsurerDto } from './getAvailableInsurers.dto.js'

const logger = createLogger('policies:getAvailableInsurers')

/**
 * Get available insurers for policy creation
 *
 * Authorization handled at route level via requireInternalRole
 *
 * @returns List of active insurers
 */
export async function getAvailableInsurers(): Promise<InsurerDto[]> {
  logger.info('Fetching available insurers')

  const insurers = await db.insurer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: 'asc' },
  })

  logger.debug({ count: insurers.length }, 'Returning active insurers')
  return insurers
}
