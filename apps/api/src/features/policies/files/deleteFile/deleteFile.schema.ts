/**
 * Validation schema for delete file endpoint
 */

import { z } from 'zod'

/**
 * Request schema for deleting a policy file
 */
export const deleteFileSchema = z.object({
  params: z.object({
    policyId: z.string().cuid({ message: 'ID de póliza inválido' }),
    fileId: z.string().cuid({ message: 'ID de archivo inválido' }),
  }),
})

/** Inferred type for params */
export type DeleteFileParams = z.infer<typeof deleteFileSchema>['params']
