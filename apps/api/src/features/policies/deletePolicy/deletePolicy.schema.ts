/**
 * Validation schema for delete policy endpoint
 * DELETE /api/policies/:id
 */

import { z } from 'zod'

export const deletePolicySchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de póliza inválido' }),
  }),
})

export type DeletePolicyParams = z.infer<typeof deletePolicySchema>['params']
