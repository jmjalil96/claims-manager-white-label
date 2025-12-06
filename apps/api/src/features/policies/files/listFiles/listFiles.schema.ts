/**
 * Validation schema for list files endpoint
 */

import { z } from 'zod'

/**
 * Request schema for listing policy files
 */
export const listFilesSchema = z.object({
  params: z.object({
    policyId: z.string().cuid({ message: 'ID de póliza inválido' }),
  }),
})

/** Inferred type for params */
export type ListFilesParams = z.infer<typeof listFilesSchema>['params']
