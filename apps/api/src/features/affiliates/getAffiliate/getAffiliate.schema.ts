/**
 * Validation schema for get affiliate endpoint
 */

import { z } from 'zod'

/**
 * Params schema for getting a single affiliate
 */
export const getAffiliateSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de afiliado inválido' }),
  }),
})

/** Inferred type for validated get affiliate params */
export type GetAffiliateParams = z.infer<typeof getAffiliateSchema>['params']
