/**
 * Validation schema for list claims endpoint
 */

import { z } from 'zod'
import { ClaimStatus, CareType } from '@prisma/client'
import { ClaimsSortBy } from '@claims/shared'

const sortByValues = Object.values(ClaimsSortBy) as [string, ...string[]]

/**
 * Query params schema for listing claims
 */
export const listClaimsSchema = z.object({
  query: z.object({
    // ID filters (for programmatic linking)
    clientId: z.string().cuid().optional(),
    affiliateId: z.string().cuid().optional(),
    patientId: z.string().cuid().optional(),
    policyId: z.string().cuid().optional(),
    createdById: z.string().cuid().optional(),

    // Enum filters (comma-separated)
    status: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',').filter(Boolean) : undefined))
      .pipe(z.array(z.nativeEnum(ClaimStatus)).optional()),
    careType: z
      .string()
      .optional()
      .transform((val) => (val ? val.split(',').filter(Boolean) : undefined))
      .pipe(z.array(z.nativeEnum(CareType)).optional()),

    // Date filters (ISO date strings)
    incidentDateFrom: z.string().date().optional(),
    incidentDateTo: z.string().date().optional(),
    submittedDateFrom: z.string().date().optional(),
    submittedDateTo: z.string().date().optional(),
    settlementDateFrom: z.string().date().optional(),
    settlementDateTo: z.string().date().optional(),
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

/** Inferred type for validated list claims input */
export type ListClaimsInput = z.infer<typeof listClaimsSchema>['query']
