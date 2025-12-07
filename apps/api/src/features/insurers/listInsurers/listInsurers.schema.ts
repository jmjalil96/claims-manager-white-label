/**
 * Validation schema for list insurers endpoint
 */

import { z } from 'zod'
import { InsurersSortBy } from '@claims/shared'

const sortByValues = Object.values(InsurersSortBy) as [string, ...string[]]

/**
 * Query params schema for listing insurers
 */
export const listInsurersSchema = z.object({
  query: z.object({
    // Boolean filter
    isActive: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true
        if (val === 'false') return false
        return undefined
      }),

    // Search (free-text)
    search: z.string().max(100).optional(),

    // Sorting
    sortBy: z.enum(sortByValues).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),

    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
})

/** Inferred type for validated list insurers input */
export type ListInsurersInput = z.infer<typeof listInsurersSchema>['query']
