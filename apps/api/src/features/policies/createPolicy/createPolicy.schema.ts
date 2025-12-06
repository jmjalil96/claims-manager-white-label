/**
 * Validation schema for create policy endpoint
 */

import { z } from 'zod'
import { PolicyType } from '@claims/shared'

/**
 * Request body schema for creating a new policy
 */
export const createPolicySchema = z.object({
  body: z.object({
    /** Policy number (unique per insurer) */
    policyNumber: z
      .string()
      .min(1, { message: 'El número de póliza es requerido' })
      .max(50, { message: 'El número de póliza no puede exceder 50 caracteres' }),

    /** Client ID the policy belongs to */
    clientId: z.string().cuid({ message: 'ID de cliente inválido' }),

    /** Insurer ID */
    insurerId: z.string().cuid({ message: 'ID de aseguradora inválido' }),

    /** Policy type */
    type: z.nativeEnum(PolicyType).optional(),

    /** Policy start date (ISO string) */
    startDate: z.string().date({ message: 'Fecha de inicio inválida' }),

    /** Policy end date (ISO string) */
    endDate: z.string().date({ message: 'Fecha de fin inválida' }),

    /** Ambulatory copay amount */
    ambCopay: z.number().nonnegative({ message: 'El copago ambulatorio debe ser >= 0' }).optional(),

    /** Hospitalization copay amount */
    hospCopay: z
      .number()
      .nonnegative({ message: 'El copago hospitalario debe ser >= 0' })
      .optional(),

    /** Maternity copay amount */
    maternity: z.number().nonnegative({ message: 'El copago maternidad debe ser >= 0' }).optional(),

    /** T premium (individual) */
    tPremium: z.number().nonnegative({ message: 'La prima T debe ser >= 0' }).optional(),

    /** T+1 premium */
    tplus1Premium: z.number().nonnegative({ message: 'La prima T+1 debe ser >= 0' }).optional(),

    /** T+F premium (family) */
    tplusfPremium: z.number().nonnegative({ message: 'La prima T+F debe ser >= 0' }).optional(),

    /** Benefits cost */
    benefitsCost: z
      .number()
      .nonnegative({ message: 'El costo de beneficios debe ser >= 0' })
      .optional(),
  }),
})

/** Inferred type for validated create policy input */
export type CreatePolicyInput = z.infer<typeof createPolicySchema>['body']
