/**
 * Validation schema for edit client endpoint
 */

import { z } from 'zod'

/**
 * Combined schema for editing a client
 */
export const editClientSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de cliente inválido' }),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    taxId: z.string().min(1).max(50).optional(),
    email: z.string().email({ message: 'Email inválido' }).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
})

/** Inferred types for validated edit client input */
export type EditClientParams = z.infer<typeof editClientSchema>['params']
export type EditClientBody = z.infer<typeof editClientSchema>['body']
