/**
 * Service layer for getting available owners
 * Returns owner affiliates for dependent creation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import type { OwnerDto } from './getAvailableOwners.dto.js'

const logger = createLogger('affiliates:getAvailableOwners')

/**
 * Get available owner affiliates for a client
 *
 * Authorization: Internal roles only (enforced by middleware)
 * Returns all active owner affiliates (those without primaryAffiliateId)
 *
 * @param clientId - Client ID to get owners for
 * @returns List of available owner affiliates
 * @throws AppError if client not found or inactive
 */
export async function getAvailableOwners(clientId: string): Promise<OwnerDto[]> {
  logger.info({ clientId }, 'Fetching available owners for client')

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

  // 2. Return owner affiliates (those without primaryAffiliateId)
  const owners = await db.affiliate.findMany({
    where: {
      clientId,
      isActive: true,
      primaryAffiliateId: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      documentNumber: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  logger.debug({ count: owners.length }, 'Returning owner affiliates for client')
  return owners
}
