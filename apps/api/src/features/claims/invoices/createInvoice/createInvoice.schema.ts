/**
 * Validation schema for create invoice endpoint
 * POST /api/claims/:claimId/invoices
 */

import { z } from 'zod'

export const createInvoiceSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
  body: z.object({
    invoiceNumber: z.string().min(1, 'Número de factura requerido').max(100),
    providerName: z.string().min(1, 'Nombre del proveedor requerido').max(200),
    amountSubmitted: z.number().positive('El monto debe ser positivo'),
  }),
})

export type CreateInvoiceParams = z.infer<typeof createInvoiceSchema>['params']
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body']
