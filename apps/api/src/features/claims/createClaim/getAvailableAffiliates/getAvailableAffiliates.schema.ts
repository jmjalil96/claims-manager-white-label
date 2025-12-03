/**
 * Validation schema for get available affiliates endpoint
 */

import { z } from 'zod'

/**
 * Schema for get available affiliates request
 */
export const getAvailableAffiliatesSchema = z.object({
  params: z.object({
    /** Client ID to get affiliates for */
    clientId: z.string().cuid({ message: 'ID de cliente inválido' }),
  }),
})

/** Inferred type for validated input */
export type GetAvailableAffiliatesInput = z.infer<typeof getAvailableAffiliatesSchema>['params']
