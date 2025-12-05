import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
  'w-full rounded-lg border bg-white text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-y',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-sm min-h-[80px]',
        md: 'px-3 py-2 text-sm min-h-[120px]',
        lg: 'px-4 py-3 text-base min-h-[160px]',
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

interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(textareaVariants({ size, error }), className)}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

// eslint-disable-next-line react-refresh/only-export-components
export { Textarea, textareaVariants }
export type { TextareaProps }
