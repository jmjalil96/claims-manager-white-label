import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const checkboxVariants = cva('', {
  variants: {
    size: {
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const checkIconVariants = cva('text-white', {
  variants: {
    size: {
      sm: 'size-3',
      md: 'size-3.5',
      lg: 'size-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

interface CheckboxProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof checkboxVariants> {
  error?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, size, error, disabled, ...props }, ref) => {
    return (
      <span className="group relative inline-flex items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          disabled={disabled}
          aria-invalid={error || undefined}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            checkboxVariants({ size }),
            // Base
            'pointer-events-none inline-flex items-center justify-center rounded border transition-colors',
            // Unchecked
            'border-slate-300 bg-white',
            // Checked (using :has() via group)
            'group-has-[:checked]:border-teal-600 group-has-[:checked]:bg-teal-600',
            // Focus
            'group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-teal-500 group-has-[:focus-visible]:ring-offset-2',
            // Disabled
            'group-has-[:disabled]:cursor-not-allowed group-has-[:disabled]:opacity-50',
            // Error
            error && 'border-red-500 group-has-[:focus-visible]:ring-red-500',
            className
          )}
        >
          <Check
            className={cn(
              checkIconVariants({ size }),
              'opacity-0 transition-opacity group-has-[:checked]:opacity-100'
            )}
          />
        </span>
      </span>
    )
  }
)

Checkbox.displayName = 'Checkbox'

// eslint-disable-next-line react-refresh/only-export-components
export { Checkbox, checkboxVariants }
export type { CheckboxProps }
