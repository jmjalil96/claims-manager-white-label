/**
 * Validation schema for delete insurer endpoint
 */

import { z } from 'zod'

/**
 * Path params schema for deleting an insurer
 */
export const deleteInsurerSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de aseguradora inválido' }),
  }),
})

/** Inferred type for validated delete insurer input */
export type DeleteInsurerParams = z.infer<typeof deleteInsurerSchema>['params']
