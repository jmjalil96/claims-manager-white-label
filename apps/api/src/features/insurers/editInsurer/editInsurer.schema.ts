/**
 * Validation schema for edit insurer endpoint
 */

import { z } from 'zod'

/**
 * Combined schema for editing an insurer
 */
export const editInsurerSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de aseguradora inválido' }),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    code: z.string().max(50).optional().nullable(),
    email: z.string().email({ message: 'Email inválido' }).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),
    website: z.string().url({ message: 'URL inválida' }).max(255).optional().nullable(),
    taxRate: z.number().min(0).max(100).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
})

/** Inferred types for validated edit insurer input */
export type EditInsurerParams = z.infer<typeof editInsurerSchema>['params']
export type EditInsurerBody = z.infer<typeof editInsurerSchema>['body']
