import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'w-full rounded-lg border bg-white text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      error: {
        true: 'border-red-500 focus:ring-red-500',
        false: 'border-slate-200 focus:ring-teal-500',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
)

interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  prefix?: string
  suffix?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size,
      error,
      leftIcon,
      rightIcon,
      clearable,
      onClear,
      prefix,
      suffix,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const hasLeftAddon = leftIcon || prefix
    const hasRightAddon = rightIcon || suffix || clearable
    const showClearButton = clearable && value && !disabled

    return (
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}

        {/* Prefix */}
        {prefix && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500"
            aria-hidden="true"
          >
            <span className="text-sm">{prefix}</span>
          </div>
        )}

        <input
          type={type}
          ref={ref}
          disabled={disabled}
          value={value}
          aria-invalid={error || undefined}
          className={cn(
            inputVariants({ size, error }),
            hasLeftAddon && 'pl-10',
            hasRightAddon && 'pr-10',
            prefix && 'pl-8',
            suffix && 'pr-12',
            className
          )}
          {...props}
        />

        {/* Suffix */}
        {suffix && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500"
            aria-hidden="true"
          >
            <span className="text-sm">{suffix}</span>
          </div>
        )}

        {/* Right icon */}
        {rightIcon && !showClearButton && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
            aria-hidden="true"
          >
            {rightIcon}
          </div>
        )}

        {/* Clear button */}
        {showClearButton && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-600"
            aria-label="Clear input"
          >
            <X size={16} />
          </button>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// eslint-disable-next-line react-refresh/only-export-components
export { Input, inputVariants }
export type { InputProps }
