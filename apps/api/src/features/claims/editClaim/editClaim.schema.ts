/**
 * Validation schema for edit claim endpoint
 */

import { z } from 'zod'
import { ClaimStatus, CareType } from '@prisma/client'

/**
 * Schema for editing a claim
 * All fields are optional - only provided fields will be updated
 * The state machine validates which fields are editable per status
 */
export const editClaimSchema = z.object({
  params: z.object({
    id: z.string().cuid({ message: 'ID de reclamo inválido' }),
  }),
  body: z
    .object({
      // Status transition
      status: z.nativeEnum(ClaimStatus).optional(),

      // DRAFT editable fields
      policyId: z.string().cuid().nullable().optional(),
      description: z.string().max(1000).nullable().optional(),
      careType: z.nativeEnum(CareType).nullable().optional(),
      diagnosisCode: z.string().max(20).nullable().optional(),
      diagnosisDescription: z.string().max(500).nullable().optional(),
      incidentDate: z.string().date().nullable().optional(),

      // VALIDATION editable fields
      amountSubmitted: z.number().nonnegative().nullable().optional(),
      submittedDate: z.string().date().nullable().optional(),

      // SUBMITTED/SETTLEMENT editable fields
      amountApproved: z.number().nonnegative().nullable().optional(),
      amountDenied: z.number().nonnegative().nullable().optional(),
      amountUnprocessed: z.number().nonnegative().nullable().optional(),
      deductibleApplied: z.number().nonnegative().nullable().optional(),
      copayApplied: z.number().nonnegative().nullable().optional(),
      settlementDate: z.string().date().nullable().optional(),
      settlementNumber: z.string().max(50).nullable().optional(),
      settlementNotes: z.string().max(2000).nullable().optional(),

      // Transition-specific fields
      pendingReason: z.string().max(1000).optional(),
      returnReason: z.string().max(1000).optional(),
      cancellationReason: z.string().max(1000).optional(),
      reprocessDate: z.string().date().optional(),
      reprocessDescription: z.string().max(1000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Al menos un campo debe ser proporcionado',
    }),
})

/** Inferred type for validated edit claim params */
export type EditClaimParams = z.infer<typeof editClaimSchema>['params']

/** Inferred type for validated edit claim input */
export type EditClaimInput = z.infer<typeof editClaimSchema>['body']
