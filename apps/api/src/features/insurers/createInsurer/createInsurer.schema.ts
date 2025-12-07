/**
 * Validation schema for create insurer endpoint
 */

import { z } from 'zod'

/**
 * Body schema for creating an insurer
 */
export const createInsurerSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: 'El nombre es requerido' }).max(255),
    code: z.string().max(50).optional().nullable(),
    email: z.string().email({ message: 'Email inválido' }).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    website: z.string().url({ message: 'URL inválida' }).max(255).optional().nullable(),
    taxRate: z.number().min(0).max(100).optional().nullable(),
  }),
})

/** Inferred type for validated create insurer input */
export type CreateInsurerInput = z.infer<typeof createInsurerSchema>['body']
