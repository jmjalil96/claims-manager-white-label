/**
 * Validation schema for get client endpoint
 */

import { z } from 'zod'

/**
 * Path params schema for getting a single client
 */
export const getClientSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de cliente inválido' }),
  }),
})

/** Inferred type for validated get client input */
export type GetClientInput = z.infer<typeof getClientSchema>['params']
