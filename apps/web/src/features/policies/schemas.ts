import { z } from 'zod'
import { PolicyStatus, PolicyType } from '@claims/shared'

/**
 * Individual field schemas for inline edit validation.
 * Copied from API editPolicy.schema.ts - should be kept in sync.
 */
export const policyFieldSchemas = {
  // Status
  status: z.nativeEnum(PolicyStatus),

  // Required fields (only editable in PENDING)
  policyNumber: z.string().min(1, 'Requerido').max(50, 'Máximo 50 caracteres'),
  startDate: z.string().date('Fecha inválida'),
  endDate: z.string().date('Fecha inválida'),

  // Type (always editable)
  type: z.nativeEnum(PolicyType).nullable(),

  // Copay fields (always editable)
  ambCopay: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  hospCopay: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  maternity: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),

  // Premium fields (always editable)
  tPremium: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  tplus1Premium: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  tplusfPremium: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  benefitsCost: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),

  // Transition-specific fields
  cancellationReason: z.string().min(1, 'Requerido').max(1000, 'Máximo 1000 caracteres'),
  expirationReason: z.string().min(1, 'Requerido').max(1000, 'Máximo 1000 caracteres'),
}

/**
 * Full edit policy schema for RHF forms.
 * All fields optional - only provided fields will be updated.
 */
export const editPolicySchema = z.object({
  status: policyFieldSchemas.status.optional(),
  policyNumber: policyFieldSchemas.policyNumber.optional(),
  startDate: policyFieldSchemas.startDate.optional(),
  endDate: policyFieldSchemas.endDate.optional(),
  type: policyFieldSchemas.type.optional(),
  ambCopay: policyFieldSchemas.ambCopay.optional(),
  hospCopay: policyFieldSchemas.hospCopay.optional(),
  maternity: policyFieldSchemas.maternity.optional(),
  tPremium: policyFieldSchemas.tPremium.optional(),
  tplus1Premium: policyFieldSchemas.tplus1Premium.optional(),
  tplusfPremium: policyFieldSchemas.tplusfPremium.optional(),
  benefitsCost: policyFieldSchemas.benefitsCost.optional(),
  cancellationReason: policyFieldSchemas.cancellationReason.optional(),
  expirationReason: policyFieldSchemas.expirationReason.optional(),
})

export type EditPolicyInput = z.infer<typeof editPolicySchema>
