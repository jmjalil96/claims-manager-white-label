/**
 * Validation schema for get available owners endpoint
 */

import { z } from 'zod'

/**
 * Params schema for getting available owners
 */
export const getAvailableOwnersSchema = z.object({
  params: z.object({
    clientId: z.string().cuid({ message: 'ID de cliente inválido' }),
  }),
})

/** Inferred type for validated get available owners params */
export type GetAvailableOwnersInput = z.infer<typeof getAvailableOwnersSchema>['params']
