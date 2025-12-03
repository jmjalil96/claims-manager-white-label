/**
 * Validation schema for get claim SLA endpoint
 * GET /api/claims/:id/sla
 */

import { z } from 'zod'

export const getClaimSlaSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
})

export type GetClaimSlaParams = z.infer<typeof getClaimSlaSchema>['params']
