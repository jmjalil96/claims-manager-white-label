import * as React from 'react'
import { cn, formatDate } from '@/lib/utils'
import { useInlineEdit } from './use-inline-edit'
import { EditableFieldWrapper } from './editable-field-wrapper'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface EditableDateProps {
  label: string
  /** ISO date string "YYYY-MM-DD" or null */
  value: string | null
  onSave: (value: string | null) => Promise<void>
  emptyText?: string
  disabled?: boolean
  /** @deprecated No-op, kept for API consistency */
  required?: boolean
  /** ISO date string for min constraint */
  min?: string
  /** ISO date string for max constraint */
  max?: string
  /** Custom validation - schema-based */
  validate?: (value: string | null) => string | null
  className?: string
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export const EditableDate = React.forwardRef<HTMLDivElement, EditableDateProps>(
  function EditableDate(
    {
      label,
      value,
      onSave,
      emptyText = '—',
      disabled = false,
      required: _required = false,
      min,
      max,
      validate: customValidate,
      className,
    },
    ref
  ) {
    // Generate stable IDs for a11y
    const id = React.useId()
    const inputId = `${id}-input`
    const errorId = `${id}-error`

    // Validation via custom validate prop (schema-based)
    const validate = React.useCallback(
      (draft: string | null): string | null => {
        return customValidate ? customValidate(draft) : null
      },
      [customValidate]
    )

    const inputRef = React.useRef<HTMLInputElement>(null)

    const {
      isEditing,
      draft,
      isPending,
      error,
      startEdit: baseStartEdit,
      setDraft,
      save,
      cancel,
    } = useInlineEdit<string | null>({
      value,
      onSave,
      validate,
    })

    // Custom startEdit that focuses input element and opens picker
    const startEdit = React.useCallback(() => {
      baseStartEdit()
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Modern API to open date picker immediately
          if ('showPicker' in inputRef.current && typeof inputRef.current.showPicker === 'function') {
            try {
              inputRef.current.showPicker()
            } catch {
              // Ignore errors (e.g. if not user activation)
            }
          }
        }
      })
    }, [baseStartEdit])

    // Handle input change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      setDraft(newValue || null)
    }

    // Handle key events
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        void save()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        cancel()
      }
    }

    // Display value: use formatDate utility (DD/MM/YYYY)
    const displayValue = value ? (
      formatDate(value)
    ) : (
      <span className="text-slate-400">{emptyText}</span>
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
          type="date"
          id={inputId}
          value={draft ?? ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isPending || disabled}
          min={min}
          max={max}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full bg-transparent text-sm text-slate-900 font-sans',
            'focus:outline-none',
            'disabled:opacity-50',
            'cursor-pointer',
            'appearance-none',
            'h-5 py-0'
          )}
        />
      </EditableFieldWrapper>
    )
  }
)

EditableDate.displayName = 'EditableDate'
