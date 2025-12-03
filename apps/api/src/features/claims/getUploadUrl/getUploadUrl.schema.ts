/**
 * Validation schema for get upload URL endpoint
 */

import { z } from 'zod'
import { isAllowedMimeType, MAX_FILE_SIZE } from '../../../lib/storage.js'

/**
 * Request body schema for getting a presigned upload URL
 */
export const getUploadUrlSchema = z.object({
  body: z.object({
    /** Original filename */
    filename: z
      .string()
      .min(1, { message: 'El nombre del archivo es requerido' })
      .max(255, { message: 'El nombre del archivo no puede exceder 255 caracteres' }),

    /** MIME type of the file */
    mimeType: z.string().refine(isAllowedMimeType, { message: 'Tipo de archivo no permitido' }),

    /** File size in bytes */
    fileSize: z
      .number()
      .int({ message: 'El tamaño debe ser un número entero' })
      .positive({ message: 'El tamaño debe ser mayor a 0' })
      .max(MAX_FILE_SIZE, { message: 'El archivo excede el tamaño máximo permitido (10 MB)' }),
  }),
})

/** Inferred type for validated get upload URL input */
export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>['body']
