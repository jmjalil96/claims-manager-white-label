/**
 * Validation schema for list files endpoint
 */

import { z } from 'zod'

/**
 * Request schema for listing claim files
 */
export const listFilesSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
})

/** Inferred type for params */
export type ListFilesParams = z.infer<typeof listFilesSchema>['params']
