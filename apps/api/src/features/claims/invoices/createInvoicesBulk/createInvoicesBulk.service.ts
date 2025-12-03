/**
 * Service layer for bulk creating invoices
 * Contains business logic
 */

import { db } from '../../../../lib/db.js'
import { AppError } from '../../../../lib/errors.js'
import { createLogger } from '../../../../lib/logger.js'
import { audit } from '../../../../lib/audit.js'
import type { CreateInvoicesBulkInput } from './createInvoicesBulk.schema.js'
import type { CreateInvoicesBulkResponse } from './createInvoicesBulk.dto.js'
import type { InvoiceDto } from '../listInvoices/listInvoices.dto.js'
import type { AuthUser } from '../../../../middleware/auth.js'

const logger = createLogger('claims:createInvoicesBulk')

/**
 * Create multiple invoices for a claim (append)
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param claimId - Claim ID
 * @param input - Array of invoice data
 * @param user - Authenticated user context
 * @returns Created invoices
 */
export async function createInvoicesBulk(
  claimId: string,
  input: CreateInvoicesBulkInput,
  user: AuthUser
): Promise<CreateInvoicesBulkResponse> {
  logger.info(
    { claimId, userId: user.id, count: input.invoices.length },
    'Creating invoices in bulk'
  )

  // 1. Verify claim exists
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true, claimNumber: true, clientId: true },
  })

  if (!claim) {
    logger.warn({ claimId, userId: user.id }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Create invoices
  const invoices = await db.claimInvoice.createManyAndReturn({
    data: input.invoices.map((inv) => ({
      claimId,
      invoiceNumber: inv.invoiceNumber,
      providerName: inv.providerName,
      amountSubmitted: inv.amountSubmitted,
      createdById: user.id,
    })),
  })

  logger.info({ claimId, created: invoices.length }, 'Invoices created successfully')

  // 3. Audit each creation
  for (const invoice of invoices) {
    audit({
      action: 'CREATE',
      resourceType: 'ClaimInvoice',
      resourceId: invoice.id,
      userId: user.id,
      clientId: claim.clientId,
      metadata: {
        claimId,
        claimNumber: claim.claimNumber,
        invoiceNumber: invoice.invoiceNumber,
        bulk: true,
      },
    })
  }

  // 4. Transform to DTO
  const invoiceDtos: InvoiceDto[] = invoices.map((inv) => ({
    id: inv.id,
    claimId: inv.claimId,
    invoiceNumber: inv.invoiceNumber,
    providerName: inv.providerName,
    amountSubmitted: inv.amountSubmitted,
    createdById: inv.createdById,
    createdAt: inv.createdAt.toISOString(),
  }))

  return {
    invoices: invoiceDtos,
    created: invoiceDtos.length,
  }
}
