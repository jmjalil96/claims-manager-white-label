/**
 * Validation schema for get insurer endpoint
 */

import { z } from 'zod'

/**
 * Path params schema for getting a single insurer
 */
export const getInsurerSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de aseguradora inválido' }),
  }),
})

/** Inferred type for validated get insurer input */
export type GetInsurerInput = z.infer<typeof getInsurerSchema>['params']
