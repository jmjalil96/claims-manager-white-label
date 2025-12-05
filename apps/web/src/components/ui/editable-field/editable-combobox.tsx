import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Link } from '@tanstack/react-router'
import { ChevronDown, Check, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInlineEdit } from './use-inline-edit'
import { EditableFieldWrapper } from './editable-field-wrapper'
import type { ComboboxOption } from '../combobox'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface EditableComboboxProps<T extends string = string> {
  label: string
  value: T | null
  options: ComboboxOption<T>[]
  onSave: (value: T | null) => Promise<void>
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  emptyMessage?: string
  clearLabel?: string
  disabled?: boolean
  loading?: boolean
  validate?: (value: T | null) => string | null
  /** Optional function to generate a link href from the current value */
  getHref?: (value: T) => string
  className?: string
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

function EditableComboboxInner<T extends string = string>(
  {
    label,
    value,
    options,
    onSave,
    placeholder = 'Seleccionar...',
    searchPlaceholder = 'Buscar...',
    emptyText = '—',
    emptyMessage = 'No se encontraron resultados',
    clearLabel,
    disabled = false,
    loading = false,
    validate: customValidate,
    getHref,
    className,
  }: EditableComboboxProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Generate stable IDs for a11y
  const id = React.useId()
  const comboboxId = `${id}-combobox`
  const errorId = `${id}-error`

  // Refs
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const selectionMadeRef = React.useRef(false)

  // Combobox state
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  // Validation via custom validate prop (schema-based)
  const validate = React.useCallback(
    (draft: T | null): string | null => {
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
    cancel: baseCancel,
  } = useInlineEdit<T | null>({
    value,
    onSave,
    validate,
  })

  // Custom startEdit that focuses trigger and opens popover
  const startEdit = React.useCallback(() => {
    baseStartEdit()
    requestAnimationFrame(() => {
      triggerRef.current?.focus()
      setOpen(true)
    })
  }, [baseStartEdit])

  // Custom cancel that also closes popover
  const cancel = React.useCallback(() => {
    setOpen(false)
    setSearch('')
    baseCancel()
  }, [baseCancel])

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const query = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    )
  }, [options, search])

  // Handle option selection
  const handleSelect = (optionValue: T | null) => {
    setDraft(optionValue)
    selectionMadeRef.current = true
    setOpen(false)
    setSearch('')
  }

  // Handle popover open change
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSearch('')
      // Only cancel if popover closed without a selection being made
      // (i.e., user clicked outside or pressed escape)
      if (!selectionMadeRef.current) {
        cancel()
      }
      selectionMadeRef.current = false
    }
  }

  // Find label for current value
  const selectedOption = value !== null ? options.find((o) => o.value === value) : null
  const draftOption = draft !== null ? options.find((o) => o.value === draft) : null

  // Compute href if getHref is provided and value exists
  const href = value !== null && getHref ? getHref(value) : null

  // Display value: show option label or emptyText, optionally as a link
  const displayValue =
    selectedOption === null || selectedOption === undefined ? (
      <span className="text-slate-400">{emptyText}</span>
    ) : href ? (
      <Link
        to={href}
        className={cn(
          'text-teal-600 font-medium',
          'hover:text-teal-700 hover:underline',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
          'transition-colors'
        )}
      >
        {selectedOption.label}
      </Link>
    ) : (
      selectedOption.label
    )

  return (
    <EditableFieldWrapper
      ref={ref}
      label={label}
      labelFor={comboboxId}
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
      disableOutsideCancel
    >
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            id={comboboxId}
            ref={triggerRef}
            disabled={isPending || disabled}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'flex w-full items-center justify-between text-sm transition-colors',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              !draftOption && 'text-slate-400',
              draftOption && 'text-slate-900'
            )}
          >
            <span className="truncate">
              {loading ? (
                <span className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando...
                </span>
              ) : draftOption ? (
                draftOption.label
              ) : (
                placeholder
              )}
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-slate-400 transition-transform',
                open && 'rotate-180'
              )}
            />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className={cn(
              'z-50 w-[--radix-popover-trigger-width] min-w-[200px] rounded-lg border border-slate-200 bg-white shadow-lg',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Search className="size-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div role="listbox" className="max-h-[200px] overflow-y-auto p-1">
              {/* Clear option */}
              {clearLabel && (
                <button
                  type="button"
                  role="option"
                  aria-selected={draft === null}
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                    'hover:bg-slate-50',
                    draft === null && 'bg-teal-50'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'truncate italic',
                        draft === null ? 'text-teal-700 font-medium' : 'text-slate-500'
                      )}
                    >
                      {clearLabel}
                    </div>
                  </div>
                  {draft === null && (
                    <Check className="size-4 shrink-0 text-teal-600" />
                  )}
                </button>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === draft
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                        'hover:bg-slate-50',
                        isSelected && 'bg-teal-50'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'truncate',
                            isSelected ? 'text-teal-700 font-medium' : 'text-slate-900'
                          )}
                        >
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="truncate text-xs text-slate-400">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-teal-600" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </EditableFieldWrapper>
  )
}

export const EditableCombobox = React.forwardRef(EditableComboboxInner) as <T extends string = string>(
  props: EditableComboboxProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement

// @ts-expect-error - displayName for generic forwardRef
EditableCombobox.displayName = 'EditableCombobox'
