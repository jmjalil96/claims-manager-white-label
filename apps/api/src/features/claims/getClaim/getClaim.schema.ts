/**
 * Validation schema for get claim endpoint
 * GET /api/claims/:id
 */

import { z } from 'zod'

export const getClaimSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
})

export type GetClaimParams = z.infer<typeof getClaimSchema>['params']
