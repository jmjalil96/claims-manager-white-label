/**
 * Validation schema for create client endpoint
 */

import { z } from 'zod'

/**
 * Body schema for creating a client
 */
export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'El nombre es requerido' }).max(255),
    taxId: z.string().min(1, { message: 'El NIT/RUC es requerido' }).max(50),
    email: z.string().email({ message: 'Email inválido' }).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
  }),
})

/** Inferred type for validated create client input */
export type CreateClientInput = z.infer<typeof createClientSchema>['body']
