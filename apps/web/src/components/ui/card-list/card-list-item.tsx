import * as React from 'react'
import { cn } from '@/lib/utils'

/* -----------------------------------------------------------------------------
 * CardListItem Root
 * -------------------------------------------------------------------------- */

interface CardListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Make the entire card clickable */
  onClick?: () => void
  /** Visual selected state */
  selected?: boolean
}

const CardListItem = React.forwardRef<HTMLDivElement, CardListItemProps>(
  ({ className, children, onClick, selected, ...props }, ref) => {
    const isInteractive = !!onClick

    return (
      <div
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClick?.()
                }
              }
            : undefined
        }
        className={cn(
          'rounded-lg border bg-white p-4 transition-shadow',
          selected
            ? 'border-teal-500 ring-1 ring-teal-500'
            : 'border-slate-200',
          isInteractive && 'cursor-pointer hover:shadow-md active:scale-[0.99]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardListItem.displayName = 'CardListItem'

/* -----------------------------------------------------------------------------
 * CardListItemHeader
 * -------------------------------------------------------------------------- */

interface CardListItemHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardListItemHeader = React.forwardRef<HTMLDivElement, CardListItemHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-3', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardListItemHeader.displayName = 'CardListItemHeader'

/* -----------------------------------------------------------------------------
 * CardListItemTitle
 * -------------------------------------------------------------------------- */

interface CardListItemTitleProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  /** Navigation handler - makes title a clickable link */
  onClick?: () => void
}

const CardListItemTitle = React.forwardRef<HTMLButtonElement, CardListItemTitleProps>(
  ({ className, children, onClick, ...props }, ref) => {
    if (onClick) {
      return (
        <button
          ref={ref}
          type="button"
          onClick={(e) => {
            e.stopPropagation() // Prevent card click when clicking title
            onClick()
          }}
          className={cn(
            'text-left font-semibold text-blue-600 hover:text-blue-800 hover:underline',
            'min-h-[44px] flex items-center', // Touch target
            'focus:outline-none focus-visible:underline',
            className
          )}
          {...props}
        >
          {children}
        </button>
      )
    }

    return (
      <span
        className={cn('font-semibold text-slate-900', className)}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {children}
      </span>
    )
  }
)
CardListItemTitle.displayName = 'CardListItemTitle'

/* -----------------------------------------------------------------------------
 * CardListItemBadge
 * -------------------------------------------------------------------------- */

interface CardListItemBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardListItemBadge = React.forwardRef<HTMLDivElement, CardListItemBadgeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex-shrink-0', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardListItemBadge.displayName = 'CardListItemBadge'

/* -----------------------------------------------------------------------------
 * CardListItemBody
 * -------------------------------------------------------------------------- */

interface CardListItemBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardListItemBody = React.forwardRef<HTMLDivElement, CardListItemBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('mt-3 space-y-1 text-sm', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardListItemBody.displayName = 'CardListItemBody'

/* -----------------------------------------------------------------------------
 * CardListItemFooter
 * -------------------------------------------------------------------------- */

interface CardListItemFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardListItemFooter = React.forwardRef<HTMLDivElement, CardListItemFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mt-3 flex items-center gap-4 border-t border-slate-100 pt-3',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardListItemFooter.displayName = 'CardListItemFooter'

/* -----------------------------------------------------------------------------
 * CardListItemActions
 * -------------------------------------------------------------------------- */

interface CardListItemActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardListItemActions = React.forwardRef<HTMLDivElement, CardListItemActionsProps>(
  ({ className, children, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        onClick={(e) => {
          e.stopPropagation() // Prevent card click when clicking actions
          onClick?.(e)
        }}
        className={cn(
          'flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardListItemActions.displayName = 'CardListItemActions'

/* -----------------------------------------------------------------------------
 * CardListItemField - Helper for label/value pairs
 * -------------------------------------------------------------------------- */

interface CardListItemFieldProps {
  label: string
  value: React.ReactNode
  /** Display inline (label: value) or stacked */
  layout?: 'inline' | 'stacked'
  className?: string
}

function CardListItemField({
  label,
  value,
  layout = 'inline',
  className,
}: CardListItemFieldProps) {
  if (layout === 'stacked') {
    return (
      <div className={cn('flex-1', className)}>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-900">{value}</div>
      </div>
    )
  }

  return (
    <div className={cn('flex justify-between gap-2', className)}>
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-900 font-medium truncate text-right">{value}</span>
    </div>
  )
}
CardListItemField.displayName = 'CardListItemField'

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  CardListItem,
  CardListItemHeader,
  CardListItemTitle,
  CardListItemBadge,
  CardListItemBody,
  CardListItemFooter,
  CardListItemActions,
  CardListItemField,
}

export type {
  CardListItemProps,
  CardListItemHeaderProps,
  CardListItemTitleProps,
  CardListItemBadgeProps,
  CardListItemBodyProps,
  CardListItemFooterProps,
  CardListItemActionsProps,
  CardListItemFieldProps,
}
