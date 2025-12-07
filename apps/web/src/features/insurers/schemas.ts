import { z } from 'zod'

/**
 * Individual field schemas for inline edit validation.
 * Copied from API editInsurer.schema.ts - should be kept in sync.
 */
export const insurerFieldSchemas = {
  // Required fields
  name: z.string().min(1, 'Nombre requerido').max(255, 'Máximo 255 caracteres'),

  // Optional fields
  code: z.string().max(50, 'Máximo 50 caracteres').nullable().optional(),
  email: z.string().email('Email inválido').max(255).nullable().optional(),
  phone: z.string().max(50, 'Máximo 50 caracteres').nullable().optional(),
  website: z.string().url('URL inválida').max(255).nullable().optional().or(z.literal('')),
  taxRate: z.number().min(0, 'Mínimo 0').max(100, 'Máximo 100').nullable().optional(),

  // Status
  isActive: z.boolean(),
}

/**
 * Full edit insurer schema for RHF forms.
 * All fields optional - only provided fields will be updated.
 */
export const editInsurerSchema = z.object({
  name: insurerFieldSchemas.name.optional(),
  code: insurerFieldSchemas.code.optional(),
  email: insurerFieldSchemas.email.optional(),
  phone: insurerFieldSchemas.phone.optional(),
  website: insurerFieldSchemas.website.optional(),
  taxRate: insurerFieldSchemas.taxRate.optional(),
  isActive: insurerFieldSchemas.isActive.optional(),
})

export type EditInsurerInput = z.infer<typeof editInsurerSchema>
