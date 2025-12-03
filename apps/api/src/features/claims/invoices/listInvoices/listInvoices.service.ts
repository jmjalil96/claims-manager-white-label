/**
 * Service layer for listing invoices
 * Contains business logic
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import type { ListInvoicesResponse, InvoiceDto } from './listInvoices.dto.js'

const logger = createLogger('claims:listInvoices')

/**
 * List all invoices for a claim
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param claimId - Claim ID
 * @returns List of invoices
 */
export async function listInvoices(claimId: string): Promise<ListInvoicesResponse> {
  logger.info({ claimId }, 'Listing invoices for claim')

  // 1. Verify claim exists
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true },
  })

  if (!claim) {
    logger.warn({ claimId }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Fetch invoices
  const invoices = await db.claimInvoice.findMany({
    where: { claimId },
    orderBy: { createdAt: 'desc' },
  })

  // 3. Transform to DTO
  const invoiceDtos: InvoiceDto[] = invoices.map((inv) => ({
    id: inv.id,
    claimId: inv.claimId,
    invoiceNumber: inv.invoiceNumber,
    providerName: inv.providerName,
    amountSubmitted: inv.amountSubmitted,
    createdById: inv.createdById,
    createdAt: inv.createdAt.toISOString(),
  }))

  logger.info({ claimId, count: invoiceDtos.length }, 'Invoices listed successfully')

  return { invoices: invoiceDtos }
}
