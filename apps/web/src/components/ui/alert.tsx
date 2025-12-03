import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const alertVariants = cva('flex gap-3 rounded-lg border p-3', {
  variants: {
    variant: {
      error: 'border-red-200 bg-red-50 text-red-600',
      success: 'border-green-200 bg-green-50 text-green-600',
      warning: 'border-amber-200 bg-amber-50 text-amber-600',
      info: 'border-blue-200 bg-blue-50 text-blue-600',
    },
  },
  defaultVariants: {
    variant: 'error',
  },
})

const defaultIcons = {
  error: <AlertCircle size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string
  icon?: React.ReactNode | false
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'error', title, icon, children, ...props }, ref) => {
    const IconElement = icon === false ? null : (icon ?? defaultIcons[variant ?? 'error'])

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        {IconElement && (
          <span className="shrink-0" aria-hidden="true">
            {IconElement}
          </span>
        )}
        <div className="flex-1">
          {title && <p className="font-medium">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

// eslint-disable-next-line react-refresh/only-export-components
export { Alert, alertVariants }
export type { AlertProps }
