/**
 * Validation schema for list policies endpoint
 */

import { z } from 'zod'
import { PolicyStatus, PolicyType } from '@prisma/client'
import { PoliciesSortBy } from '@claims/shared'

const sortByValues = Object.values(PoliciesSortBy) as [string, ...string[]]

/**
 * Query params schema for listing policies
 */
export const listPoliciesSchema = z.object({
  query: z.object({
    // ID filters (for programmatic linking)
    clientId: z.string().cuid().optional(),
    insurerId: z.string().cuid().optional(),

    // Enum filters (comma-separated)
    status: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',').filter(Boolean) : undefined))
      .pipe(z.array(z.nativeEnum(PolicyStatus)).optional()),
    type: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',').filter(Boolean) : undefined))
      .pipe(z.array(z.nativeEnum(PolicyType)).optional()),

    // Boolean filter
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),

    // Date filters (ISO date strings)
    startDateFrom: z.string().date().optional(),
    startDateTo: z.string().date().optional(),
    endDateFrom: z.string().date().optional(),
    endDateTo: z.string().date().optional(),
    createdAtFrom: z.string().datetime().optional(),
    createdAtTo: z.string().datetime().optional(),

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

/** Inferred type for validated list policies input */
export type ListPoliciesInput = z.infer<typeof listPoliciesSchema>['query']
