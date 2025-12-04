import * as React from 'react'
import { cn } from '@/lib/utils'
import { useInlineEdit } from './use-inline-edit'
import { EditableFieldWrapper } from './editable-field-wrapper'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface EditableTextareaProps {
  label: string
  value: string | null
  onSave: (value: string) => Promise<void>
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  maxLength?: number
  /** Custom validation - schema-based */
  validate?: (value: string) => string | null
  className?: string
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export const EditableTextarea = React.forwardRef<HTMLDivElement, EditableTextareaProps>(
  (
    {
      label,
      value,
      onSave,
      placeholder = 'Ingrese un valor...',
      emptyText = '—',
      disabled = false,
      required: _required = false,
      rows = 3,
      maxLength,
      validate: customValidate,
      className,
    },
    ref
  ) => {
    // Generate stable IDs for a11y
    const id = React.useId()
    const textareaId = `${id}-textarea`
    const errorId = `${id}-error`

    // Own ref for textarea (hook's inputRef is for HTMLInputElement)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Normalize null to empty string for internal handling
    const normalizedValue = value ?? ''

    // Validation via custom validate prop (schema-based)
    const validate = React.useCallback(
      (draft: string): string | null => {
        return customValidate ? customValidate(draft) : null
      },
      [customValidate]
    )

    const {
      isEditing,
      draft,
      isPending,
      error,
      startEdit: baseStartEdit,
      setDraft,
      save,
      cancel,
    } = useInlineEdit({
      value: normalizedValue,
      onSave,
      validate,
    })

    // Custom startEdit that focuses textarea
    const startEdit = React.useCallback(() => {
      baseStartEdit()
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
      })
    }, [baseStartEdit])

    // Handle textarea change
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value)
    }

    // Display value: show emptyText when null/empty, preserve line breaks
    const displayValue =
      normalizedValue.trim() === '' ? (
        <span className="text-slate-400">{emptyText}</span>
      ) : (
        <span className="whitespace-pre-wrap">{normalizedValue}</span>
      )

    return (
      <EditableFieldWrapper
        ref={ref}
        label={label}
        labelFor={textareaId}
        isEditing={isEditing}
        isPending={isPending}
        error={error}
        errorId={errorId}
        onStartEdit={startEdit}
        onSave={save}
        onCancel={cancel}
        disabled={disabled}
        displayValue={displayValue}
        className={className}
      >
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={draft}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={isPending || disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full bg-transparent text-sm text-slate-900',
            'resize-y min-h-[60px]',
            'placeholder:text-slate-400',
            'focus:outline-none',
            'disabled:opacity-50'
          )}
        />
      </EditableFieldWrapper>
    )
  }
)

EditableTextarea.displayName = 'EditableTextarea'
