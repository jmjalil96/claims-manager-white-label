import type { ZodType, ZodError } from 'zod'

/**
 * Extracts the first error message from a ZodError.
 */
function getFirstZodErrorMessage(error: ZodError): string {
  const firstIssue = error.issues[0]
  return firstIssue?.message ?? 'Valor inválido'
}

/**
 * Creates a validation function from a Zod schema for use with editable fields.
 *
 * @example
 * ```tsx
 * import { claimFieldSchemas } from '@/features/claims/schemas'
 *
 * <EditableText
 *   validate={zodFieldValidator(claimFieldSchemas.description)}
 *   ...
 * />
 * ```
 */
export function zodFieldValidator<T>(schema: ZodType<T>) {
  return (value: T): string | null => {
    const result = schema.safeParse(value)
    if (result.success) return null
    return getFirstZodErrorMessage(result.error)
  }
}
