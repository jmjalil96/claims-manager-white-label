import { z } from 'zod'

/**
 * Individual field schemas for inline edit validation.
 * Copied from API editClient.schema.ts - should be kept in sync.
 */
export const clientFieldSchemas = {
  // Required fields
  name: z.string().min(1, 'Nombre requerido').max(255, 'Máximo 255 caracteres'),
  taxId: z.string().min(1, 'RNC/Cédula requerido').max(50, 'Máximo 50 caracteres'),

  // Optional fields
  email: z.string().email('Email inválido').max(255).nullable().optional(),
  phone: z.string().max(50, 'Máximo 50 caracteres').nullable().optional(),
  address: z.string().max(500, 'Máximo 500 caracteres').nullable().optional(),

  // Status
  isActive: z.boolean(),
}

/**
 * Full edit client schema for RHF forms.
 * All fields optional - only provided fields will be updated.
 */
export const editClientSchema = z.object({
  name: clientFieldSchemas.name.optional(),
  taxId: clientFieldSchemas.taxId.optional(),
  email: clientFieldSchemas.email.optional(),
  phone: clientFieldSchemas.phone.optional(),
  address: clientFieldSchemas.address.optional(),
  isActive: clientFieldSchemas.isActive.optional(),
})

export type EditClientInput = z.infer<typeof editClientSchema>
