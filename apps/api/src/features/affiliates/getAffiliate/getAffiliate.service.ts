/**
 * Service layer for getting a single affiliate
 * Contains business logic and authorization
 */

import { db } from '../../../lib/db.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import { AppError } from '../../../lib/errors.js'
import type { GetAffiliateResponse, AffiliateDetailDto, DependentDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('affiliates:getAffiliate')

/**
 * Get a single affiliate by ID with full details
 */
export async function getAffiliate(id: string, user: AuthUser): Promise<GetAffiliateResponse> {
  logger.info({ userId: user.id, affiliateId: id }, 'Getting affiliate')

  // Fetch affiliate with relations
  const affiliate = await db.affiliate.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      maritalStatus: true,
      primaryAffiliateId: true,
      primaryAffiliate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      relationship: true,
      clientId: true,
      client: { select: { name: true } },
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      dependents: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          documentNumber: true,
          dateOfBirth: true,
          gender: true,
          relationship: true,
          isActive: true,
        },
        orderBy: { firstName: 'asc' },
      },
      _count: {
        select: {
          enrollments: { where: { endDate: null } },
          claimsAsAffiliate: true,
          claimsAsPatient: true,
        },
      },
    },
  })

  if (!affiliate) {
    throw AppError.notFound('Afiliado')
  }

  // Authorization check
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    if (user.role === 'client_affiliate') {
      // Affiliates can only see self or own dependents
      const userAffiliate = await db.affiliate.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!userAffiliate) {
        throw AppError.forbidden('Usuario no tiene afiliado asociado')
      }

      const isSelf = affiliate.id === userAffiliate.id
      const isOwnDependent = affiliate.primaryAffiliateId === userAffiliate.id

      if (!isSelf && !isOwnDependent) {
        throw AppError.forbidden('Sin acceso a este afiliado')
      }
    } else {
      // Client admin: must have UserClient access
      const access = await db.userClient.findUnique({
        where: {
          userId_clientId: { userId: user.id, clientId: affiliate.clientId },
          isActive: true,
        },
      })

      if (!access) {
        throw AppError.forbidden('Sin acceso a este cliente')
      }
    }
  }

  // Transform to DTO
  const affiliateDto: AffiliateDetailDto = {
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    email: affiliate.email,
    phone: affiliate.phone,
    dateOfBirth: affiliate.dateOfBirth?.toISOString() ?? null,
    gender: affiliate.gender,
    maritalStatus: affiliate.maritalStatus,
    isOwner: affiliate.primaryAffiliateId === null,
    primaryAffiliateId: affiliate.primaryAffiliateId,
    primaryAffiliate: affiliate.primaryAffiliate,
    relationship: affiliate.relationship,
    dependents: affiliate.dependents.map(
      (d): DependentDto => ({
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        documentNumber: d.documentNumber,
        dateOfBirth: d.dateOfBirth?.toISOString() ?? null,
        gender: d.gender,
        relationship: d.relationship!,
        isActive: d.isActive,
      })
    ),
    clientId: affiliate.clientId,
    clientName: affiliate.client.name,
    userId: affiliate.userId,
    hasPortalAccess: affiliate.userId !== null,
    enrollmentCount: affiliate._count.enrollments,
    claimCount: affiliate._count.claimsAsAffiliate + affiliate._count.claimsAsPatient,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
    updatedAt: affiliate.updatedAt.toISOString(),
  }

  logger.info({ affiliateId: id }, 'Affiliate retrieved successfully')

  return { affiliate: affiliateDto }
}
