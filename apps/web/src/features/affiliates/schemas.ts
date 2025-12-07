import { z } from 'zod'

/**
 * Individual field schemas for inline edit validation.
 * Copied from API editAffiliate.schema.ts - should be kept in sync.
 */
export const affiliateFieldSchemas = {
  // Required fields
  firstName: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  lastName: z.string().min(1, 'Apellido requerido').max(100, 'Máximo 100 caracteres'),

  // Optional fields
  documentType: z.string().max(20, 'Máximo 20 caracteres').nullable().optional(),
  documentNumber: z.string().max(50, 'Máximo 50 caracteres').nullable().optional(),
  email: z.string().email('Email inválido').max(255).nullable().optional().or(z.literal('')),
  phone: z.string().max(50, 'Máximo 50 caracteres').nullable().optional(),
  dateOfBirth: z.string().nullable().optional(), // ISO date string
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'DOMESTIC_PARTNER']).nullable().optional(),
  relationship: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'DOMESTIC_PARTNER', 'SIBLING', 'OTHER']).nullable().optional(),

  // Status
  isActive: z.boolean(),
}

/**
 * Full edit affiliate schema for RHF forms.
 * All fields optional - only provided fields will be updated.
 */
export const editAffiliateSchema = z.object({
  firstName: affiliateFieldSchemas.firstName.optional(),
  lastName: affiliateFieldSchemas.lastName.optional(),
  documentType: affiliateFieldSchemas.documentType,
  documentNumber: affiliateFieldSchemas.documentNumber,
  email: affiliateFieldSchemas.email,
  phone: affiliateFieldSchemas.phone,
  dateOfBirth: affiliateFieldSchemas.dateOfBirth,
  gender: affiliateFieldSchemas.gender,
  maritalStatus: affiliateFieldSchemas.maritalStatus,
  relationship: affiliateFieldSchemas.relationship,
  isActive: affiliateFieldSchemas.isActive.optional(),
})

export type EditAffiliateInput = z.infer<typeof editAffiliateSchema>
