/**
 * Service layer for editing an invoice
 * Contains business logic
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit, diff } from '../../../../lib/audit.js'
import type { EditInvoiceInput } from './editInvoice.schema.js'
import type { InvoiceDto } from '../listInvoices/listInvoices.dto.js'
import type { AuthUser } from '../../../../middleware/auth.js'

const logger = createLogger('claims:editInvoice')

/**
 * Edit an existing invoice
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param claimId - Claim ID
 * @param invoiceId - Invoice ID
 * @param input - Fields to update
 * @param user - Authenticated user context
 * @returns Updated invoice
 */
export async function editInvoice(
  claimId: string,
  invoiceId: string,
  input: EditInvoiceInput,
  user: AuthUser
): Promise<InvoiceDto> {
  logger.info({ claimId, invoiceId, userId: user.id }, 'Editing invoice')

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

  // 3. Build update data
  const updateData: Record<string, unknown> = {}
  if (input.invoiceNumber !== undefined) updateData.invoiceNumber = input.invoiceNumber
  if (input.providerName !== undefined) updateData.providerName = input.providerName
  if (input.amountSubmitted !== undefined) updateData.amountSubmitted = input.amountSubmitted

  // 4. Update invoice
  const updatedInvoice = await db.claimInvoice.update({
    where: { id: invoiceId },
    data: updateData,
  })

  logger.info(
    { claimId, invoiceId, updates: Object.keys(updateData) },
    'Invoice updated successfully'
  )

  audit({
    action: 'UPDATE',
    resourceType: 'ClaimInvoice',
    resourceId: invoiceId,
    userId: user.id,
    clientId: claim.clientId,
    changes: diff(invoice as unknown as Record<string, unknown>, updateData),
    metadata: {
      claimId,
      claimNumber: claim.claimNumber,
      invoiceNumber: updatedInvoice.invoiceNumber,
    },
  })

  return {
    id: updatedInvoice.id,
    claimId: updatedInvoice.claimId,
    invoiceNumber: updatedInvoice.invoiceNumber,
    providerName: updatedInvoice.providerName,
    amountSubmitted: updatedInvoice.amountSubmitted,
    createdById: updatedInvoice.createdById,
    createdAt: updatedInvoice.createdAt.toISOString(),
  }
}
