/**
 * Validation schema for delete claim endpoint
 * DELETE /api/claims/:id
 */

import { z } from 'zod'

export const deleteClaimSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
})

export type DeleteClaimParams = z.infer<typeof deleteClaimSchema>['params']
