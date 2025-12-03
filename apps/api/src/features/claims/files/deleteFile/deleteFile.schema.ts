/**
 * Validation schema for delete file endpoint
 */

import { z } from 'zod'

/**
 * Request schema for deleting a claim file
 */
export const deleteFileSchema = z.object({
  params: z.object({
    claimId: z.string().cuid({ message: 'ID de reclamo inválido' }),
    fileId: z.string().cuid({ message: 'ID de archivo inválido' }),
  }),
})

/** Inferred type for params */
export type DeleteFileParams = z.infer<typeof deleteFileSchema>['params']
