/**
 * Validation schema for kanban policies endpoint
 * GET /api/policies/kanban
 */

import { z } from 'zod'
import { PolicyStatus, PolicyType } from '@prisma/client'

/**
 * Query params schema for kanban policies
 * Same filters as listPolicies (minus status since we group by it)
 * plus limitPerColumn and expand options
 */
export const kanbanPoliciesSchema = z.object({
  query: z.object({
    // ID filters
    clientId: z.string().cuid().optional(),
    insurerId: z.string().cuid().optional(),

    // Enum filter (comma-separated)
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

    // Items per column (default: 10, max: 50)
    limitPerColumn: z.coerce.number().int().min(1).max(50).default(10),

    // Single-column expansion
    expandStatus: z.nativeEnum(PolicyStatus).optional(),
    expandLimit: z.coerce.number().int().min(1).max(100).optional(),
  }),
})

/** Inferred type for validated kanban policies input */
export type KanbanPoliciesInput = z.infer<typeof kanbanPoliciesSchema>['query']
