/**
 * Validation schema for delete invoice endpoint
 * DELETE /api/claims/:claimId/invoices/:invoiceId
 */

import { z } from 'zod'

export const deleteInvoiceSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
    invoiceId: z.string().cuid({ message: 'ID de factura inválido' }),
  }),
})

export type DeleteInvoiceParams = z.infer<typeof deleteInvoiceSchema>['params']
