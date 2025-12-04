import * as React from 'react'
import { FocusScope } from '@radix-ui/react-focus-scope'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * Sheet Variants
 * -------------------------------------------------------------------------- */

const sheetVariants = cva(
  'fixed z-50 bg-white shadow-xl flex flex-col overflow-hidden',
  {
    variants: {
      side: {
        right: 'top-0 right-0 bottom-0 border-l border-slate-200',
        left: 'top-0 left-0 bottom-0 border-r border-slate-200',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    compoundVariants: [
      // Right side sizes
      { side: 'right', size: 'sm', className: 'w-[320px] max-w-[90vw]' },
      { side: 'right', size: 'md', className: 'w-[400px] max-w-[90vw]' },
      { side: 'right', size: 'lg', className: 'w-[480px] max-w-[90vw]' },
      // Left side sizes
      { side: 'left', size: 'sm', className: 'w-[320px] max-w-[90vw]' },
      { side: 'left', size: 'md', className: 'w-[400px] max-w-[90vw]' },
      { side: 'left', size: 'lg', className: 'w-[480px] max-w-[90vw]' },
    ],
    defaultVariants: {
      side: 'right',
      size: 'md',
    },
  }
)

const sheetAnimationVariants = cva('', {
  variants: {
    side: {
      right: 'animate-in slide-in-from-right duration-300',
      left: 'animate-in slide-in-from-left duration-300',
    },
  },
  defaultVariants: {
    side: 'right',
  },
})

/* -----------------------------------------------------------------------------
 * Sheet Context
 * -------------------------------------------------------------------------- */

interface SheetContextValue {
  open: boolean
  onClose: () => void
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

function useSheetContext() {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet')
  }
  return context
}

/* -----------------------------------------------------------------------------
 * Sheet Root
 * -------------------------------------------------------------------------- */

interface SheetProps extends VariantProps<typeof sheetVariants> {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open, onOpenChange, side = 'right', size = 'md', children }: SheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null)

  // Close handler
  const handleClose = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, handleClose])

  // Focus first focusable element when opened
  React.useEffect(() => {
    if (open && sheetRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        firstFocusable?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!open) return null

  return (
    <SheetContext.Provider value={{ open, onClose: handleClose }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 animate-in fade-in-0 duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet Panel */}
      <FocusScope trapped loop>
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          className={cn(
            sheetVariants({ side, size }),
            sheetAnimationVariants({ side })
          )}
        >
          {children}
        </div>
      </FocusScope>
    </SheetContext.Provider>
  )
}

/* -----------------------------------------------------------------------------
 * SheetHeader
 * -------------------------------------------------------------------------- */

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ className, children, ...props }, ref) => {
    const { onClose } = useSheetContext()

    return (
      <div
        ref={ref}
        className={cn(
          'sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4',
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">{children}</div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          aria-label="Cerrar"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    )
  }
)
SheetHeader.displayName = 'SheetHeader'

/* -----------------------------------------------------------------------------
 * SheetTitle
 * -------------------------------------------------------------------------- */

interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn('text-lg font-semibold text-slate-900', className)}
        {...props}
      >
        {children}
      </h2>
    )
  }
)
SheetTitle.displayName = 'SheetTitle'

/* -----------------------------------------------------------------------------
 * SheetDescription
 * -------------------------------------------------------------------------- */

interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-slate-500 mt-1', className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
SheetDescription.displayName = 'SheetDescription'

/* -----------------------------------------------------------------------------
 * SheetBody
 * -------------------------------------------------------------------------- */

interface SheetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SheetBody = React.forwardRef<HTMLDivElement, SheetBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-1 overflow-y-auto p-6', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SheetBody.displayName = 'SheetBody'

/* -----------------------------------------------------------------------------
 * SheetFooter
 * -------------------------------------------------------------------------- */

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SheetFooter.displayName = 'SheetFooter'

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  // eslint-disable-next-line react-refresh/only-export-components
  sheetVariants,
}

export type {
  SheetProps,
  SheetHeaderProps,
  SheetTitleProps,
  SheetDescriptionProps,
  SheetBodyProps,
  SheetFooterProps,
}
