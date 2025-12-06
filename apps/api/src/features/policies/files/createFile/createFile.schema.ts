/**
 * Validation schema for create file endpoint
 */

import { z } from 'zod'
import { PolicyFileCategory } from '@claims/shared'

/**
 * Request schema for creating a file record on existing policy
 */
export const createFileSchema = z.object({
  params: z.object({
    policyId: z.string().cuid({ message: 'ID de póliza inválido' }),
  }),
  body: z.object({
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
    category: z.nativeEnum(PolicyFileCategory).optional(),

    /** File description */
    description: z
      .string()
      .max(500, { message: 'La descripción no puede exceder 500 caracteres' })
      .optional(),
  }),
})

/** Inferred type for params */
export type CreateFileParams = z.infer<typeof createFileSchema>['params']

/** Inferred type for body */
export type CreateFileInput = z.infer<typeof createFileSchema>['body']
