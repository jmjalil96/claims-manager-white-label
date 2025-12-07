/**
 * Validation schema for delete client endpoint
 */

import { z } from 'zod'

/**
 * Path params schema for deleting a client
 */
export const deleteClientSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de cliente inválido' }),
  }),
})

/** Inferred type for validated delete client input */
export type DeleteClientParams = z.infer<typeof deleteClientSchema>['params']
