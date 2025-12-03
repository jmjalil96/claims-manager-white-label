import * as React from 'react'
import { cn } from '@/lib/utils'

interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string
}

const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(
  ({ className, message, id, ...props }, ref) => {
    if (!message) return null

    return (
      <p
        ref={ref}
        id={id}
        role="alert"
        className={cn('text-xs text-red-600', className)}
        {...props}
      >
        {message}
      </p>
    )
  }
)

FormError.displayName = 'FormError'

export { FormError }
export type { FormErrorProps }
