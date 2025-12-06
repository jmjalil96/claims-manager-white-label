/**
 * Validation schema for get policy audit endpoint
 * GET /api/policies/:id/audit
 */

import { z } from 'zod'

export const getPolicyAuditSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de póliza inválido' }),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
})

export type GetPolicyAuditParams = z.infer<typeof getPolicyAuditSchema>['params']
export type GetPolicyAuditQuery = z.infer<typeof getPolicyAuditSchema>['query']
