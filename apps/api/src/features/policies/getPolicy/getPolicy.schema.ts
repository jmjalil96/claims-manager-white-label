/**
 * Validation schema for get policy endpoint
 * GET /api/policies/:id
 */

import { z } from 'zod'

export const getPolicySchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de póliza inválido' }),
  }),
})

export type GetPolicyParams = z.infer<typeof getPolicySchema>['params']
