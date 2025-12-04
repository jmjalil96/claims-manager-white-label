import * as React from 'react'
import { cn } from '@/lib/utils'
import { useInlineEdit } from './use-inline-edit'
import { EditableFieldWrapper } from './editable-field-wrapper'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface SelectOption<T = string> {
  value: T
  label: string
}

export interface EditableSelectProps<T = string> {
  label: string
  value: T | null
  options: SelectOption<T>[]
  onSave: (value: T | null) => Promise<void>
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  required?: boolean
  /** Custom validation - schema-based */
  validate?: (value: T | null) => string | null
  className?: string
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

function EditableSelectInner<T = string>(
  {
    label,
    value,
    options,
    onSave,
    placeholder = 'Seleccione...',
    emptyText = '—',
    disabled = false,
    required: _required = false,
    validate: customValidate,
    className,
  }: EditableSelectProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Generate stable IDs for a11y
  const id = React.useId()
  const selectId = `${id}-select`
  const errorId = `${id}-error`

  // Validation via custom validate prop (schema-based)
  const validate = React.useCallback(
    (draft: T | null): string | null => {
      return customValidate ? customValidate(draft) : null
    },
    [customValidate]
  )

  const selectRef = React.useRef<HTMLSelectElement>(null)

  const {
    isEditing,
    draft,
    isPending,
    error,
    startEdit: baseStartEdit,
    setDraft,
    save,
    cancel,
  } = useInlineEdit<T | null>({
    value,
    onSave,
    validate,
  })

  // Custom startEdit that focuses select element
  const startEdit = React.useCallback(() => {
    baseStartEdit()
    requestAnimationFrame(() => {
      selectRef.current?.focus()
    })
  }, [baseStartEdit])

  // Handle select change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    if (selectedValue === '') {
      setDraft(null)
    } else {
      // Find the option with matching value
      const option = options.find((o) => String(o.value) === selectedValue)
      if (option) {
        setDraft(option.value)
      }
    }
  }

  // Find label for current value
  const selectedOption = value !== null ? options.find((o) => o.value === value) : null

  // Display value: show option label or emptyText
  const displayValue =
    selectedOption === null || selectedOption === undefined ? (
      <span className="text-slate-400">{emptyText}</span>
    ) : (
      selectedOption.label
    )

  return (
    <EditableFieldWrapper
      ref={ref}
      label={label}
      labelFor={selectId}
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
      <select
        ref={selectRef}
        id={selectId}
        value={draft === null ? '' : String(draft)}
        onChange={handleChange}
        disabled={isPending || disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full bg-transparent text-sm text-slate-900',
          'focus:outline-none',
          'disabled:opacity-50',
          'cursor-pointer'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </EditableFieldWrapper>
  )
}

export const EditableSelect = React.forwardRef(EditableSelectInner) as <T = string>(
  props: EditableSelectProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement

// @ts-expect-error - displayName for generic forwardRef
EditableSelect.displayName = 'EditableSelect'
