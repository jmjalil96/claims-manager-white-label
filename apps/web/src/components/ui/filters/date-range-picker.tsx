import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '../primitives/button'
import { cn } from '@/lib/utils'

interface DateRangePickerProps {
  fromValue: string | undefined
  toValue: string | undefined
  onChange: (from: string | undefined, to: string | undefined) => void
  label: string
  className?: string
}

/** Format ISO date string (YYYY-MM-DD) to short format (DD/MM) */
function formatDateShort(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return ''
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr // Return as-is if not ISO format
  const [, month, day] = parts
  if (!month || !day) return dateStr
  return `${day}/${month}`
}

export function DateRangePicker({
  fromValue,
  toValue,
  onChange,
  label,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || undefined
    onChange(value, toValue)
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || undefined
    onChange(fromValue, value)
  }

  const handleClear = () => {
    onChange(undefined, undefined)
  }

  const hasValue = fromValue || toValue
  const hasBothValues = fromValue && toValue

  // Build trigger label
  let triggerLabel = label
  if (hasBothValues) {
    triggerLabel = `${label}: ${formatDateShort(fromValue)} - ${formatDateShort(toValue)}`
  } else if (hasValue) {
    const count = (fromValue ? 1 : 0) + (toValue ? 1 : 0)
    triggerLabel = `${label} (${count})`
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'justify-between gap-2',
            !hasValue && 'text-slate-500',
            className
          )}
          leftIcon={<Calendar size={16} />}
          rightIcon={<ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />}
        >
          {triggerLabel}
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Desde</label>
              <input
                type="date"
                value={fromValue || ''}
                onChange={handleFromChange}
                max={toValue || undefined}
                className={cn(
                  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm',
                  'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500'
                )}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Hasta</label>
              <input
                type="date"
                value={toValue || ''}
                onChange={handleToChange}
                min={fromValue || undefined}
                className={cn(
                  'h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm',
                  'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500'
                )}
              />
            </div>
          </div>

          {hasValue && (
            <>
              <div className="my-3 border-t border-slate-100" />
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-2 py-1 text-left text-sm text-slate-500 hover:text-slate-700"
              >
                Limpiar
              </button>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
