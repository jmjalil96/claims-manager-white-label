/**
 * Validation schema for editing a policy
 * Supports field edits and status transitions
 */

import { z } from 'zod'
import { PolicyStatus, PolicyType } from '@claims/shared'

export const editPolicySchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de póliza inválido' }),
  }),
  body: z
    .object({
      // Status transition
      status: z.nativeEnum(PolicyStatus).optional(),

      // Required fields (only editable in PENDING)
      policyNumber: z.string().min(1).max(50).optional(),
      startDate: z.string().date().optional(),
      endDate: z.string().date().optional(),

      // Optional fields (always editable)
      type: z.nativeEnum(PolicyType).nullable().optional(),
      ambCopay: z.number().nonnegative().nullable().optional(),
      hospCopay: z.number().nonnegative().nullable().optional(),
      maternity: z.number().nonnegative().nullable().optional(),
      tPremium: z.number().nonnegative().nullable().optional(),
      tplus1Premium: z.number().nonnegative().nullable().optional(),
      tplusfPremium: z.number().nonnegative().nullable().optional(),
      benefitsCost: z.number().nonnegative().nullable().optional(),

      // Transition-specific fields
      cancellationReason: z.string().min(1).optional(),
      expirationReason: z.string().min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar',
    }),
})

export type EditPolicyParams = z.infer<typeof editPolicySchema>['params']
export type EditPolicyInput = z.infer<typeof editPolicySchema>['body']
