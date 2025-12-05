/**
 * Validation schema for list claim policies endpoint
 * GET /api/claims/:claimId/policies
 */

import { z } from 'zod'

export const listClaimPoliciesSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
})

export type ListClaimPoliciesParams = z.infer<typeof listClaimPoliciesSchema>['params']
