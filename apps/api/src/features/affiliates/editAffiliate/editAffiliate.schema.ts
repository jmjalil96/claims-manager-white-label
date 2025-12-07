/**
 * Validation schema for edit affiliate endpoint
 */

import { z } from 'zod'
import { Gender, MaritalStatus, DependentRelationship } from '@claims/shared'

const genderValues = Object.values(Gender) as [string, ...string[]]
const maritalStatusValues = Object.values(MaritalStatus) as [string, ...string[]]
const relationshipValues = Object.values(DependentRelationship) as [string, ...string[]]

/**
 * Combined params + body schema for editing an affiliate
 */
export const editAffiliateSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de afiliado inválido' }),
  }),
  body: z.object({
    // Identity
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    documentType: z.string().max(20).optional().nullable(),
    documentNumber: z.string().max(50).optional().nullable(),

    // Contact
    email: z.string().email({ message: 'Email inválido' }).optional().nullable(),
    phone: z.string().max(50).optional().nullable(),

    // Demographics
    dateOfBirth: z.string().datetime().optional().nullable(),
    gender: z.enum(genderValues).optional().nullable(),
    maritalStatus: z.enum(maritalStatusValues).optional().nullable(),

    // Dependent relationship (only for dependents)
    relationship: z.enum(relationshipValues).optional().nullable(),

    // Status
    isActive: z.boolean().optional(),
  }),
})

/** Inferred types for validated edit affiliate input */
export type EditAffiliateParams = z.infer<typeof editAffiliateSchema>['params']
export type EditAffiliateBody = z.infer<typeof editAffiliateSchema>['body']
