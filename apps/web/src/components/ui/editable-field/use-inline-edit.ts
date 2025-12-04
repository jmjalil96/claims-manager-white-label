import * as React from 'react'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface UseInlineEditOptions<T> {
  value: T
  onSave: (value: T) => Promise<void>
  onCancel?: () => void
  validate?: (value: T) => string | null
}

export interface UseInlineEditReturn<T> {
  // State
  isEditing: boolean
  draft: T
  isPending: boolean
  error: string | null

  // Actions
  startEdit: () => void
  setDraft: (value: T) => void
  save: () => Promise<void>
  cancel: () => void
  clearError: () => void

  // Refs
  inputRef: React.RefObject<HTMLInputElement | null>
}

/* -----------------------------------------------------------------------------
 * Hook
 * -------------------------------------------------------------------------- */

export function useInlineEdit<T>({
  value,
  onSave,
  onCancel,
  validate,
}: UseInlineEditOptions<T>): UseInlineEditReturn<T> {
  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState<T>(value)
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Sync draft with external value when not editing
  React.useEffect(() => {
    if (!isEditing) {
      setDraft(value)
    }
  }, [value, isEditing])

  const startEdit = React.useCallback(() => {
    setIsEditing(true)
    setError(null)
    // Focus and select on next tick after render
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    })
  }, [])

  const cancel = React.useCallback(() => {
    setDraft(value)
    setIsEditing(false)
    setError(null)
    onCancel?.()
  }, [value, onCancel])

  const save = React.useCallback(async () => {
    // Guard: prevent duplicate saves while pending
    if (isPending) return

    // Run validation if provided
    if (validate) {
      const validationError = validate(draft)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setIsPending(true)
    setError(null)

    try {
      await onSave(draft)
      setIsEditing(false)
    } catch (err) {
      // Handle API errors
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al guardar')
      }
    } finally {
      setIsPending(false)
    }
  }, [draft, isPending, onSave, validate])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  // Handle draft changes - clear error when user types
  const setDraftWithClear = React.useCallback((newValue: T) => {
    setDraft(newValue)
    if (error) {
      setError(null)
    }
  }, [error])

  return {
    isEditing,
    draft,
    isPending,
    error,
    startEdit,
    setDraft: setDraftWithClear,
    save,
    cancel,
    clearError,
    inputRef,
  }
}
