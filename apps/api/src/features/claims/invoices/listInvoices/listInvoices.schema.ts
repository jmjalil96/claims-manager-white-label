/**
 * Validation schema for list invoices endpoint
 * GET /api/claims/:claimId/invoices
 */

import { z } from 'zod'

export const listInvoicesSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
})

export type ListInvoicesParams = z.infer<typeof listInvoicesSchema>['params']
