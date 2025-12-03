/**
 * Validation schema for bulk create invoices endpoint
 * POST /api/claims/:claimId/invoices/bulk
 */

import { z } from 'zod'

const invoiceInput = z.object({
  invoiceNumber: z.string().min(1, 'Número de factura requerido').max(100),
  providerName: z.string().min(1, 'Nombre del proveedor requerido').max(200),
  amountSubmitted: z.number().positive('El monto debe ser positivo'),
})

export const createInvoicesBulkSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
  body: z.object({
    invoices: z
      .array(invoiceInput)
      .min(1, 'Al menos una factura requerida')
      .max(50, 'Máximo 50 facturas por solicitud'),
  }),
})

export type CreateInvoicesBulkParams = z.infer<typeof createInvoicesBulkSchema>['params']
export type CreateInvoicesBulkInput = z.infer<typeof createInvoicesBulkSchema>['body']
export type InvoiceInput = z.infer<typeof invoiceInput>
