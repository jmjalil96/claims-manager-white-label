/**
 * Validation schema for delete affiliate endpoint
 */

import { z } from 'zod'

/**
 * Params schema for deleting an affiliate
 */
export const deleteAffiliateSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de afiliado inválido' }),
  }),
})

/** Inferred type for validated delete affiliate params */
export type DeleteAffiliateParams = z.infer<typeof deleteAffiliateSchema>['params']
