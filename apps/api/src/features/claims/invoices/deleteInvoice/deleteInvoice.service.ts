/**
 * Service layer for deleting an invoice
 * Contains business logic
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit } from '../../../../lib/audit.js'
import type { AuthUser } from '../../../../middleware/auth.js'

const logger = createLogger('claims:deleteInvoice')

/**
 * Delete an invoice
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param claimId - Claim ID
 * @param invoiceId - Invoice ID
 * @param user - Authenticated user context
 * @returns Deleted invoice ID
 */
export async function deleteInvoice(
  claimId: string,
  invoiceId: string,
  user: AuthUser
): Promise<{ id: string }> {
  logger.info({ claimId, invoiceId, userId: user.id }, 'Deleting invoice')

  // 1. Verify claim exists
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true, claimNumber: true, clientId: true },
  })

  if (!claim) {
    logger.warn({ claimId, userId: user.id }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Verify invoice exists and belongs to claim
  const invoice = await db.claimInvoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, claimId: true, invoiceNumber: true },
  })

  if (!invoice) {
    logger.warn({ invoiceId, userId: user.id }, 'Invoice not found')
    throw AppError.notFound('Factura')
  }

  if (invoice.claimId !== claimId) {
    logger.warn(
      { invoiceId, claimId, actualClaimId: invoice.claimId },
      'Invoice does not belong to claim'
    )
    throw AppError.badRequest('La factura no pertenece a este reclamo')
  }

  // 3. Delete invoice
  await db.claimInvoice.delete({
    where: { id: invoiceId },
  })

  logger.info(
    { claimId, invoiceId, invoiceNumber: invoice.invoiceNumber },
    'Invoice deleted successfully'
  )

  audit({
    action: 'DELETE',
    resourceType: 'ClaimInvoice',
    resourceId: invoiceId,
    userId: user.id,
    clientId: claim.clientId,
    metadata: { claimId, claimNumber: claim.claimNumber, invoiceNumber: invoice.invoiceNumber },
  })

  return { id: invoiceId }
}
