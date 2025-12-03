import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'
import { FormError } from './form-error'

interface FormFieldProps {
  label: string
  name: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

function FormField({
  label,
  name,
  hint,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>

      {hint && (
        <p id={hintId} className="text-sm text-slate-500">
          {hint}
        </p>
      )}

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
            'aria-describedby': describedBy,
          })
        : children}

      <FormError id={errorId} message={error} />
    </div>
  )
}

FormField.displayName = 'FormField'

export { FormField }
export type { FormFieldProps }
