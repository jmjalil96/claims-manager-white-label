import * as React from 'react'
import { cn } from '@/lib/utils'
import { useInlineEdit } from './use-inline-edit'
import { EditableFieldWrapper } from './editable-field-wrapper'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface EditableTextProps {
  label: string
  value: string | null
  onSave: (value: string) => Promise<void>
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  required?: boolean
  maxLength?: number
  /** Custom validation - runs after built-in validation */
  validate?: (value: string) => string | null
  className?: string
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export const EditableText = React.forwardRef<HTMLDivElement, EditableTextProps>(
  (
    {
      label,
      value,
      onSave,
      placeholder = 'Ingrese un valor...',
      emptyText = '—',
      disabled = false,
      required: _required = false,
      maxLength,
      validate: customValidate,
      className,
    },
    ref
  ) => {
    // Generate stable IDs for a11y
    const id = React.useId()
    const inputId = `${id}-input`
    const errorId = `${id}-error`

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
      startEdit,
      setDraft,
      save,
      cancel,
      inputRef,
    } = useInlineEdit({
      value: normalizedValue,
      onSave,
      validate,
    })

    // Handle input change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value)
    }

    // Display value: show emptyText when null/empty
    const displayValue = normalizedValue.trim() === '' ? (
      <span className="text-slate-400">{emptyText}</span>
    ) : (
      normalizedValue
    )

    return (
      <EditableFieldWrapper
        ref={ref}
        label={label}
        labelFor={inputId}
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
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={draft}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isPending || disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full bg-transparent text-sm text-slate-900',
            'placeholder:text-slate-400',
            'focus:outline-none',
            'disabled:opacity-50'
          )}
        />
      </EditableFieldWrapper>
    )
  }
)

EditableText.displayName = 'EditableText'
