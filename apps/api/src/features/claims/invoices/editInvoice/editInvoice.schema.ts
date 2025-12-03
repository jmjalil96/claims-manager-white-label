/**
 * Validation schema for edit invoice endpoint
 * PATCH /api/claims/:claimId/invoices/:invoiceId
 */

import { z } from 'zod'

export const editInvoiceSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
    invoiceId: z.string().cuid({ message: 'ID de factura inválido' }),
  }),
  body: z
    .object({
      invoiceNumber: z.string().min(1).max(100).optional(),
      providerName: z.string().min(1).max(200).optional(),
      amountSubmitted: z.number().positive('El monto debe ser positivo').optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Al menos un campo debe ser proporcionado',
    }),
})

export type EditInvoiceParams = z.infer<typeof editInvoiceSchema>['params']
export type EditInvoiceInput = z.infer<typeof editInvoiceSchema>['body']
