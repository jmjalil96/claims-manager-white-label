/**
 * Service layer for getting available patients
 * Returns the affiliate and their dependents for claim creation
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { isInternalRole } from '../../../../lib/constants.js'
import type { PatientDto } from './getAvailablePatients.dto.js'
import type { AuthUser } from '../../../../middleware/auth.js'

const logger = createLogger('claims:getAvailablePatients')

/**
 * Get available patients for an affiliate (self + dependents)
 *
 * Authorization:
 * - Internal roles: Can view patients for any affiliate
 * - External roles with client access: Can view patients for affiliates in their clients
 * - Affiliates: Can only view patients for themselves
 *
 * @param affiliateId - Affiliate ID to get patients for
 * @param user - Authenticated user context
 * @returns List of available patients (affiliate + dependents)
 * @throws AppError for authorization or validation failures
 */
export async function getAvailablePatients(
  affiliateId: string,
  user: AuthUser
): Promise<PatientDto[]> {
  logger.info({ affiliateId, userId: user.id }, 'Fetching available patients')

  // 1. Validate affiliate exists and is active
  const affiliate = await db.affiliate.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      documentNumber: true,
      clientId: true,
      userId: true,
      isActive: true,
    },
  })

  if (!affiliate) {
    throw AppError.notFound('Afiliado')
  }

  if (!affiliate.isActive) {
    throw AppError.badRequest('El afiliado no está activo')
  }

  // 2. Check user has access
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    // For affiliates: must be themselves
    if (user.role === 'client_affiliate') {
      if (affiliate.userId !== user.id) {
        logger.warn(
          { userId: user.id, affiliateId, affiliateUserId: affiliate.userId },
          'Affiliate attempted to view patients for different affiliate'
        )
        throw AppError.forbidden('Solo puede ver pacientes para su propia cuenta')
      }
    } else {
      // For other external roles: check client access
      const hasClientAccess = await db.userClient.findUnique({
        where: {
          userId_clientId: { userId: user.id, clientId: affiliate.clientId },
          isActive: true,
        },
      })

      if (!hasClientAccess) {
        logger.warn(
          { userId: user.id, clientId: affiliate.clientId },
          'User does not have access to client'
        )
        throw AppError.forbidden('Sin acceso a este cliente')
      }
    }
  }

  // 3. Get dependents
  const dependents = await db.affiliate.findMany({
    where: {
      primaryAffiliateId: affiliateId,
      isActive: true,
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

  // 4. Build response with affiliate first, then dependents
  const patients: PatientDto[] = [
    {
      id: affiliate.id,
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
      email: affiliate.email,
      documentNumber: affiliate.documentNumber,
      isDependent: false,
    },
    ...dependents.map((dep) => ({
      ...dep,
      isDependent: true,
    })),
  ]

  logger.debug(
    { affiliateId, dependentCount: dependents.length },
    'Returning patients for affiliate'
  )

  return patients
}
