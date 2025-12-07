/**
 * Service layer for deleting an affiliate
 * Contains business logic and cascade checks
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { DeleteAffiliateResponse } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('affiliates:deleteAffiliate')

/**
 * Delete an affiliate (hard delete)
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * Restrictions:
 * - Cannot delete if has dependents
 * - Cannot delete if has claims
 * - Cannot delete if has enrollments
 *
 * @param id - Affiliate ID
 * @param user - Authenticated user context
 * @returns Deleted affiliate ID
 */
export async function deleteAffiliate(id: string, user: AuthUser): Promise<DeleteAffiliateResponse> {
  logger.info({ userId: user.id, affiliateId: id }, 'Deleting affiliate')

  // 1. Fetch affiliate with counts
  const affiliate = await db.affiliate.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      clientId: true,
      _count: {
        select: {
          dependents: true,
          enrollments: true,
          claimsAsAffiliate: true,
          claimsAsPatient: true,
          files: true,
        },
      },
    },
  })

  if (!affiliate) {
    throw AppError.notFound('Afiliado')
  }

  // 2. Check for related records
  const relatedRecords: string[] = []

  if (affiliate._count.dependents > 0) {
    relatedRecords.push(`${affiliate._count.dependents} dependiente(s)`)
  }

  if (affiliate._count.enrollments > 0) {
    relatedRecords.push(`${affiliate._count.enrollments} inscripción(es)`)
  }

  if (affiliate._count.claimsAsAffiliate > 0) {
    relatedRecords.push(`${affiliate._count.claimsAsAffiliate} reclamo(s) como afiliado`)
  }

  if (affiliate._count.claimsAsPatient > 0) {
    relatedRecords.push(`${affiliate._count.claimsAsPatient} reclamo(s) como paciente`)
  }

  if (relatedRecords.length > 0) {
    throw AppError.conflict(
      `No se puede eliminar el afiliado porque tiene registros relacionados: ${relatedRecords.join(', ')}`
    )
  }

  // 3. Delete files first (if any)
  if (affiliate._count.files > 0) {
    await db.affiliateFile.deleteMany({
      where: { affiliateId: id },
    })
  }

  // 4. Delete invitation if exists
  await db.invitation.deleteMany({
    where: { affiliateId: id },
  })

  // 5. Delete affiliate
  await db.affiliate.delete({
    where: { id },
  })

  // 6. Audit log
  audit({
    action: 'DELETE',
    resourceType: 'Affiliate',
    resourceId: id,
    userId: user.id,
    clientId: affiliate.clientId,
    metadata: {
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
    },
  })

  logger.info({ affiliateId: id }, 'Affiliate deleted successfully')

  return { deleted: { id } }
}
