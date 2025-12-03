/**
 * Validation schema for get available patients endpoint
 */

import { z } from 'zod'

/**
 * Schema for get available patients request
 */
export const getAvailablePatientsSchema = z.object({
  params: z.object({
    /** Affiliate ID to get patients for (self + dependents) */
    affiliateId: z.string().cuid({ message: 'ID de afiliado inválido' }),
  }),
})

/** Inferred type for validated input */
export type GetAvailablePatientsInput = z.infer<typeof getAvailablePatientsSchema>['params']
