/**
 * Service layer for getting claim details
 * Contains business logic and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { ClaimDetailDto } from './getClaim.dto.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('claims:getClaim')

/**
 * Get claim details by ID
 *
 * Authorization matrix:
 * - Internal roles: Full access to all claims
 * - External roles with client access: Claims for accessible clients only
 * - Affiliates (client_affiliate): Only claims where they are the affiliate
 *
 * @param id - Claim ID
 * @param user - Authenticated user context
 * @returns Claim details
 */
export async function getClaim(id: string, user: AuthUser): Promise<ClaimDetailDto> {
  logger.info({ claimId: id, userId: user.id }, 'Getting claim details')

  // 1. Fetch claim with relationships
  const claim = await db.claim.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      affiliate: { select: { firstName: true, lastName: true } },
      patient: { select: { firstName: true, lastName: true } },
      policy: { select: { policyNumber: true } },
    },
  })

  if (!claim) {
    logger.warn({ claimId: id, userId: user.id }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Authorization check
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    if (user.role === 'client_affiliate') {
      // Affiliates can only see claims where they are the affiliate
      const affiliate = await db.affiliate.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })

      if (!affiliate || claim.affiliateId !== affiliate.id) {
        logger.warn({ claimId: id, userId: user.id }, 'Affiliate access denied')
        throw AppError.forbidden('Sin acceso a este reclamo')
      }
    } else {
      // External roles: check client access
      const hasAccess = await db.userClient.findUnique({
        where: {
          userId_clientId: { userId: user.id, clientId: claim.clientId },
          isActive: true,
        },
      })

      if (!hasAccess) {
        logger.warn(
          { claimId: id, userId: user.id, clientId: claim.clientId },
          'Client access denied'
        )
        throw AppError.forbidden('Sin acceso a este reclamo')
      }
    }
  }

  logger.info({ claimId: id, claimNumber: claim.claimNumber }, 'Claim retrieved successfully')

  // 3. Transform to DTO
  const claimDto: ClaimDetailDto = {
    id: claim.id,
    claimNumber: claim.claimNumber,
    claimSequence: claim.claimSequence,
    status: claim.status,
    clientId: claim.clientId,
    affiliateId: claim.affiliateId,
    patientId: claim.patientId,
    policyId: claim.policyId,
    // Denormalized names
    clientName: claim.client.name,
    affiliateName: `${claim.affiliate.firstName} ${claim.affiliate.lastName}`,
    patientName: `${claim.patient.firstName} ${claim.patient.lastName}`,
    policyNumber: claim.policy?.policyNumber ?? null,
    careType: claim.careType,
    description: claim.description,
    diagnosisCode: claim.diagnosisCode,
    diagnosisDescription: claim.diagnosisDescription,
    amountSubmitted: claim.amountSubmitted,
    amountApproved: claim.amountApproved,
    amountDenied: claim.amountDenied,
    amountUnprocessed: claim.amountUnprocessed,
    deductibleApplied: claim.deductibleApplied,
    copayApplied: claim.copayApplied,
    incidentDate: claim.incidentDate?.toISOString().split('T')[0] ?? null,
    submittedDate: claim.submittedDate?.toISOString().split('T')[0] ?? null,
    settlementDate: claim.settlementDate?.toISOString().split('T')[0] ?? null,
    businessDays: claim.businessDays,
    settlementNumber: claim.settlementNumber,
    settlementNotes: claim.settlementNotes,
    returnReason: claim.returnReason,
    cancellationReason: claim.cancellationReason,
    pendingReason: claim.pendingReason,
    createdById: claim.createdById,
    updatedById: claim.updatedById,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
  }

  return claimDto
}
