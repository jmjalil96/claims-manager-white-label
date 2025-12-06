/**
 * Validation schema for get available clients endpoint
 * No input required - uses auth context only
 */

import { z } from 'zod'

/**
 * Schema for get available clients request (no params/body needed)
 */
export const getAvailableClientsSchema = z.object({})

/** Inferred type for validated input */
export type GetAvailableClientsInput = z.infer<typeof getAvailableClientsSchema>
