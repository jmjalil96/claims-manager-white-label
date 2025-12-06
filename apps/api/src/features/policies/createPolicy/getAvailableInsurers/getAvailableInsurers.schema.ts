/**
 * Validation schema for get available insurers endpoint
 * No input required - uses auth context only
 */

import { z } from 'zod'

/**
 * Schema for get available insurers request (no params/body needed)
 */
export const getAvailableInsurersSchema = z.object({})

/** Inferred type for validated input */
export type GetAvailableInsurersInput = z.infer<typeof getAvailableInsurersSchema>
