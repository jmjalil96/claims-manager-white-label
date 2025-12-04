import { z } from 'zod'
import { ClaimStatus, CareType } from '@claims/shared'

/**
 * Individual field schemas for inline edit validation.
 * Copied from API editClaim.schema.ts - should be kept in sync.
 * TODO: Refactor to shared package for single source of truth.
 */
export const claimFieldSchemas = {
  // Status
  status: z.nativeEnum(ClaimStatus),

  // DRAFT editable fields
  description: z.string().max(1000, 'Máximo 1000 caracteres').nullable(),
  careType: z.nativeEnum(CareType).nullable(),
  diagnosisCode: z.string().max(20, 'Máximo 20 caracteres').nullable(),
  diagnosisDescription: z.string().max(500, 'Máximo 500 caracteres').nullable(),
  incidentDate: z.string().date('Fecha inválida').nullable(),

  // VALIDATION editable fields
  amountSubmitted: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  submittedDate: z.string().date('Fecha inválida').nullable(),

  // SUBMITTED/SETTLEMENT editable fields
  amountApproved: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  amountDenied: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  amountUnprocessed: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  deductibleApplied: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  copayApplied: z.number().nonnegative('Debe ser mayor o igual a 0').nullable(),
  settlementDate: z.string().date('Fecha inválida').nullable(),
  settlementNumber: z.string().max(50, 'Máximo 50 caracteres').nullable(),
  settlementNotes: z.string().max(2000, 'Máximo 2000 caracteres').nullable(),

  // Transition-specific fields
  pendingReason: z.string().max(1000, 'Máximo 1000 caracteres'),
  returnReason: z.string().max(1000, 'Máximo 1000 caracteres'),
  cancellationReason: z.string().max(1000, 'Máximo 1000 caracteres'),
  reprocessDate: z.string().date('Fecha inválida'),
  reprocessDescription: z.string().max(1000, 'Máximo 1000 caracteres'),
}

/**
 * Full edit claim schema for RHF forms.
 * All fields optional - only provided fields will be updated.
 */
export const editClaimSchema = z.object({
  status: claimFieldSchemas.status.optional(),
  description: claimFieldSchemas.description.optional(),
  careType: claimFieldSchemas.careType.optional(),
  diagnosisCode: claimFieldSchemas.diagnosisCode.optional(),
  diagnosisDescription: claimFieldSchemas.diagnosisDescription.optional(),
  incidentDate: claimFieldSchemas.incidentDate.optional(),
  amountSubmitted: claimFieldSchemas.amountSubmitted.optional(),
  submittedDate: claimFieldSchemas.submittedDate.optional(),
  amountApproved: claimFieldSchemas.amountApproved.optional(),
  amountDenied: claimFieldSchemas.amountDenied.optional(),
  amountUnprocessed: claimFieldSchemas.amountUnprocessed.optional(),
  deductibleApplied: claimFieldSchemas.deductibleApplied.optional(),
  copayApplied: claimFieldSchemas.copayApplied.optional(),
  settlementDate: claimFieldSchemas.settlementDate.optional(),
  settlementNumber: claimFieldSchemas.settlementNumber.optional(),
  settlementNotes: claimFieldSchemas.settlementNotes.optional(),
  pendingReason: claimFieldSchemas.pendingReason.optional(),
  returnReason: claimFieldSchemas.returnReason.optional(),
  cancellationReason: claimFieldSchemas.cancellationReason.optional(),
  reprocessDate: claimFieldSchemas.reprocessDate.optional(),
  reprocessDescription: claimFieldSchemas.reprocessDescription.optional(),
})

export type EditClaimInput = z.infer<typeof editClaimSchema>
