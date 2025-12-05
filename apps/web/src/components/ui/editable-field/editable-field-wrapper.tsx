import * as React from 'react'
import { Check, X, Pencil, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Types
 * -------------------------------------------------------------------------- */

export interface EditableFieldWrapperProps {
  label: string
  labelFor?: string
  isEditing: boolean
  isPending: boolean
  error: string | null
  errorId?: string
  onStartEdit: () => void
  onSave: () => void | Promise<void>
  onCancel: () => void
  disabled?: boolean
  children: React.ReactNode
  displayValue: React.ReactNode
  className?: string
  /** When true, this field handles its own outside-click cancellation (e.g., portal-based components) */
  disableOutsideCancel?: boolean
}

/* -----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export const EditableFieldWrapper = React.forwardRef<HTMLDivElement, EditableFieldWrapperProps>(
  (
    {
      label,
      labelFor,
      isEditing,
      isPending,
      error,
      errorId,
      onStartEdit,
      onSave,
      onCancel,
      disabled = false,
      children,
      displayValue,
      className,
      disableOutsideCancel = false,
    },
    ref
  ) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null)

    // Handle click outside to cancel (skip for portal-based components that handle their own dismissal)
    React.useEffect(() => {
      if (!isEditing || disableOutsideCancel) return

      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          onCancel()
        }
      }

      // Add listener on next tick to avoid immediate trigger
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isEditing, onCancel, disableOutsideCancel])

    // Handle keyboard events
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!isEditing) return

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        void onSave()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    return (
      <div ref={ref} className={cn('flex-1 group/field', className)}>
        {/* Label - fade when editing to focus on input */}
        <label
          htmlFor={labelFor}
          className={cn(
            'block text-xs text-slate-500 mb-1 transition-opacity',
            isEditing && 'opacity-75'
          )}
        >
          {label}
        </label>

        {/* Value / Input Container */}
        <div ref={wrapperRef} onKeyDown={handleKeyDown}>
          {isEditing ? (
            // Edit Mode
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-md border bg-white pl-2 pr-1 py-1 shadow-sm transition-all',
                'ring-2 ring-transparent',
                error
                  ? 'border-red-500 ring-red-500/10'
                  : 'border-teal-500 ring-teal-500/10',
                isPending && 'bg-slate-50'
              )}
            >
              {/* Input (passed as children) */}
              <div className="flex-1 min-w-0">{children}</div>

              {/* Vertical Divider */}
              <div className="w-px h-4 bg-slate-100 mx-0.5" />

              {/* Action Buttons */}
              <div className="flex items-center">
                {isPending ? (
                  <div className="size-6 flex items-center justify-center">
                    <Loader2 className="size-3.5 text-teal-600 animate-spin" />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void onSave()}
                      className={cn(
                        'size-6 flex items-center justify-center rounded',
                        'text-teal-600 hover:bg-teal-50 focus:bg-teal-50',
                        'transition-colors'
                      )}
                      aria-label="Guardar"
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      className={cn(
                        'size-6 flex items-center justify-center rounded',
                        'text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:bg-slate-100',
                        'transition-colors'
                      )}
                      aria-label="Cancelar"
                    >
                      <X className="size-3.5" strokeWidth={3} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            // View Mode
            <button
              type="button"
              onClick={onStartEdit}
              disabled={disabled}
              className={cn(
                'group w-full text-left',
                'flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 -mx-2',
                !disabled && 'hover:border-slate-200 hover:bg-slate-50',
                disabled && 'cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                'transition-all duration-200'
              )}
            >
              <span
                className={cn(
                  'flex-1 text-sm truncate',
                  disabled ? 'text-slate-500' : 'text-slate-900 font-medium'
                )}
              >
                {displayValue}
              </span>
              {!disabled && (
                <Pencil className="size-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity -mr-1" />
              )}
            </button>
          )}
        </div>

        {/* Error Message with animation */}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 mt-1.5 font-medium">
            {error}
          </p>
        )}
      </div>
    )
  }
)

EditableFieldWrapper.displayName = 'EditableFieldWrapper'
