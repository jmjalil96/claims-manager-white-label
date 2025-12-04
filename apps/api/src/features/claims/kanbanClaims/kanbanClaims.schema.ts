/**
 * Validation schema for kanban claims endpoint
 */

import { z } from 'zod'
import { CareType, ClaimStatus } from '@prisma/client'

/**
 * Query params schema for kanban claims
 * Similar to listClaims but without status[] (we return all statuses)
 * and without pagination (we use limitPerColumn instead)
 */
export const kanbanClaimsSchema = z.object({
  query: z.object({
    // ID filters
    clientId: z.string().cuid().optional(),
    affiliateId: z.string().cuid().optional(),
    patientId: z.string().cuid().optional(),
    policyId: z.string().cuid().optional(),
    createdById: z.string().cuid().optional(),

    // Enum filters (comma-separated)
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

    // Items per column (default: 10, max: 50)
    limitPerColumn: z.coerce.number().int().min(1).max(50).default(10),

    // Single-column expansion
    expandStatus: z.nativeEnum(ClaimStatus).optional(),
    expandLimit: z.coerce.number().int().min(1).max(100).optional(),
  }),
})

/** Inferred type for validated kanban claims input */
export type KanbanClaimsInput = z.infer<typeof kanbanClaimsSchema>['query']
