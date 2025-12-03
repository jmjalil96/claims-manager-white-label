/**
 * Validation schema for get claim audit endpoint
 * GET /api/claims/:id/audit
 */

import { z } from 'zod'

export const getClaimAuditSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
})

export type GetClaimAuditParams = z.infer<typeof getClaimAuditSchema>['params']
export type GetClaimAuditQuery = z.infer<typeof getClaimAuditSchema>['query']
