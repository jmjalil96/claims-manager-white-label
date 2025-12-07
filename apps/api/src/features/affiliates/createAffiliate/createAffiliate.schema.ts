/**
 * Validation schema for create affiliate endpoint
 */

import { z } from 'zod'
import { Gender, MaritalStatus, DependentRelationship } from '@claims/shared'

const genderValues = Object.values(Gender) as [string, ...string[]]
const maritalStatusValues = Object.values(MaritalStatus) as [string, ...string[]]
const relationshipValues = Object.values(DependentRelationship) as [string, ...string[]]

/**
 * Body schema for creating an affiliate
 */
export const createAffiliateSchema = z.object({
  body: z
    .object({
      // Required
      clientId: z.string().cuid({ message: 'ID de cliente inválido' }),
      firstName: z.string().min(1, { message: 'El nombre es requerido' }).max(100),
      lastName: z.string().min(1, { message: 'El apellido es requerido' }).max(100),

      // Optional identity
      documentType: z.string().max(20).optional().nullable(),
      documentNumber: z.string().max(50).optional().nullable(),

      // Optional contact
      email: z.string().email({ message: 'Email inválido' }).optional().nullable(),
      phone: z.string().max(50).optional().nullable(),

      // Optional demographics
      dateOfBirth: z.string().datetime().optional().nullable(),
      gender: z.enum(genderValues).optional().nullable(),
      maritalStatus: z.enum(maritalStatusValues).optional().nullable(),

      // Dependent relationship (if creating a dependent)
      primaryAffiliateId: z.string().cuid({ message: 'ID de titular inválido' }).optional().nullable(),
      relationship: z.enum(relationshipValues).optional().nullable(),
    })
    .refine(
      (data) => {
        // If primaryAffiliateId is set, relationship is required
        if (data.primaryAffiliateId && !data.relationship) return false
        // If relationship is set, primaryAffiliateId is required
        if (data.relationship && !data.primaryAffiliateId) return false
        return true
      },
      { message: 'Para dependientes, se requiere tanto el titular como la relación' }
    ),
})

/** Inferred type for validated create affiliate input */
export type CreateAffiliateInput = z.infer<typeof createAffiliateSchema>['body']
