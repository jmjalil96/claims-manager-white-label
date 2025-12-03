/**
 * Service layer for creating an invoice
 * Contains business logic
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit } from '../../../../lib/audit.js'
import type { CreateInvoiceInput } from './createInvoice.schema.js'
import type { InvoiceDto } from '../listInvoices/listInvoices.dto.js'
import type { AuthUser } from '../../../../middleware/auth.js'

const logger = createLogger('claims:createInvoice')

/**
 * Create a new invoice for a claim
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param claimId - Claim ID
 * @param input - Invoice data
 * @param user - Authenticated user context
 * @returns Created invoice
 */
export async function createInvoice(
  claimId: string,
  input: CreateInvoiceInput,
  user: AuthUser
): Promise<InvoiceDto> {
  logger.info({ claimId, userId: user.id }, 'Creating invoice')

  // 1. Verify claim exists
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true, claimNumber: true, clientId: true },
  })

  if (!claim) {
    logger.warn({ claimId, userId: user.id }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Create invoice
  const invoice = await db.claimInvoice.create({
    data: {
      claimId,
      invoiceNumber: input.invoiceNumber,
      providerName: input.providerName,
      amountSubmitted: input.amountSubmitted,
      createdById: user.id,
    },
  })

  logger.info(
    { claimId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
    'Invoice created successfully'
  )

  audit({
    action: 'CREATE',
    resourceType: 'ClaimInvoice',
    resourceId: invoice.id,
    userId: user.id,
    clientId: claim.clientId,
    metadata: { claimId, claimNumber: claim.claimNumber, invoiceNumber: invoice.invoiceNumber },
  })

  return {
    id: invoice.id,
    claimId: invoice.claimId,
    invoiceNumber: invoice.invoiceNumber,
    providerName: invoice.providerName,
    amountSubmitted: invoice.amountSubmitted,
    createdById: invoice.createdById,
    createdAt: invoice.createdAt.toISOString(),
  }
}
