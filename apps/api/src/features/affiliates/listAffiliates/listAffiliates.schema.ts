/**
 * Validation schema for list affiliates endpoint
 */

import { z } from 'zod'
import { AffiliatesSortBy } from '@claims/shared'

const sortByValues = Object.values(AffiliatesSortBy) as [string, ...string[]]

/**
 * Query params schema for listing affiliates
 */
export const listAffiliatesSchema = z.object({
  query: z.object({
    // Client filter
    clientId: z.string().cuid().optional(),

    // Boolean filters
    isActive: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      }),

    isOwner: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      }),

    // Filter dependents of specific owner
    primaryAffiliateId: z.string().cuid().optional(),

    // Search (free-text)
    search: z.string().max(100).optional(),

    // Grouping mode
    groupBy: z.enum(['family']).optional(),

    // Sorting
    sortBy: z.enum(sortByValues).default('lastName'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),

    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
})

/** Inferred type for validated list affiliates input */
export type ListAffiliatesInput = z.infer<typeof listAffiliatesSchema>['query']
