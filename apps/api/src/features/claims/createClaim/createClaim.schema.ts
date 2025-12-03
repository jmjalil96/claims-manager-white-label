/**
 * Validation schema for create claim endpoint
 */

import { z } from 'zod'
import { ClaimFileCategory } from '@claims/shared'

/**
 * Schema for file metadata in claim creation
 */
const claimFileSchema = z.object({
  /** Storage key returned from upload-url endpoint */
  storageKey: z.string().min(1, { message: 'La clave de almacenamiento es requerida' }),

  /** Original filename */
  originalName: z
    .string()
    .min(1, { message: 'El nombre del archivo es requerido' })
    .max(255, { message: 'El nombre del archivo no puede exceder 255 caracteres' }),

  /** MIME type of the file */
  mimeType: z.string().min(1, { message: 'El tipo de archivo es requerido' }),

  /** File size in bytes */
  fileSize: z
    .number()
    .int({ message: 'El tamaño debe ser un número entero' })
    .positive({ message: 'El tamaño debe ser mayor a 0' }),

  /** File category */
  category: z.nativeEnum(ClaimFileCategory).optional(),

  /** File description */
  description: z
    .string()
    .max(500, { message: 'La descripción no puede exceder 500 caracteres' })
    .optional(),
})

/**
 * Request body schema for creating a new claim
 */
export const createClaimSchema = z.object({
  body: z.object({
    /** Client ID the claim belongs to */
    clientId: z.string().cuid({ message: 'ID de cliente inválido' }),

    /** Affiliate (policyholder) creating the claim */
    affiliateId: z.string().cuid({ message: 'ID de afiliado inválido' }),

    /** Patient who received care (can be affiliate or dependent) */
    patientId: z.string().cuid({ message: 'ID de paciente inválido' }),

    /** Description of the claim */
    description: z
      .string()
      .min(1, { message: 'La descripción es requerida' })
      .max(1000, { message: 'La descripción no puede exceder 1000 caracteres' }),

    /** Files to attach to the claim (optional) */
    files: z
      .array(claimFileSchema)
      .max(10, { message: 'No puede adjuntar más de 10 archivos' })
      .optional(),
  }),
})

/** Inferred type for validated create claim input */
export type CreateClaimInput = z.infer<typeof createClaimSchema>['body']

/** Inferred type for file input */
export type ClaimFileInput = z.infer<typeof claimFileSchema>
