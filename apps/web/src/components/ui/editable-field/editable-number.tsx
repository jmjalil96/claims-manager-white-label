import * as React from 'react'
import { cn } from '@/lib/utils'
import { useInlineEdit } from './use-inline-edit'
import { EditableFieldWrapper } from './editable-field-wrapper'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface EditableNumberProps {
  label: string
  value: number | null
  onSave: (value: number | null) => Promise<void>
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  required?: boolean
  min?: number
  max?: number
  step?: number
  /** Currency/unit prefix shown in display (e.g., "$", "Q") */
  prefix?: string
  /** Currency/unit suffix shown in display (e.g., "USD", "GTQ") */
  suffix?: string
  /** Custom validation - runs after built-in validation */
  validate?: (value: number | null) => string | null
  className?: string
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export const EditableNumber = React.forwardRef<HTMLDivElement, EditableNumberProps>(
  (
    {
      label,
      value,
      onSave,
      placeholder = '0',
      emptyText = '—',
      disabled = false,
      required: _required = false,
      min,
      max,
      step,
      prefix,
      suffix,
      validate: customValidate,
      className,
    },
    ref
  ) => {
    // Generate stable IDs for a11y
    const id = React.useId()
    const inputId = `${id}-input`
    const errorId = `${id}-error`

    // Validation via custom validate prop (schema-based)
    const validate = React.useCallback(
      (draft: number | null): string | null => {
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
    } = useInlineEdit<number | null>({
      value,
      onSave,
      validate,
    })

    // Handle input change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value
      if (inputValue === '') {
        setDraft(null)
      } else {
        const parsed = parseFloat(inputValue)
        if (!isNaN(parsed)) {
          setDraft(parsed)
        }
      }
    }

    // Format display value with prefix/suffix
    const displayValue =
      value === null ? (
        <span className="text-slate-400">{emptyText}</span>
      ) : (
        <span className="tabular-nums">
          {prefix ?? ''}
          {value.toLocaleString()}
          {suffix ? ` ${suffix}` : ''}
        </span>
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
          type="number"
          value={draft ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={isPending || disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full bg-transparent text-sm text-slate-900 tabular-nums',
            'placeholder:text-slate-400',
            'focus:outline-none',
            'disabled:opacity-50',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
        />
      </EditableFieldWrapper>
    )
  }
)

EditableNumber.displayName = 'EditableNumber'
