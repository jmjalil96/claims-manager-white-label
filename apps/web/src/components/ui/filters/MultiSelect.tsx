import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  label: string
  className?: string
}

export function MultiSelect({
  value,
  onChange,
  options,
  label,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const handleClear = () => {
    onChange([])
  }

  const selectedCount = value.length
  const hasSelection = selectedCount > 0

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'justify-between gap-2',
            !hasSelection && 'text-slate-500',
            className
          )}
          rightIcon={<ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />}
        >
          {label}
          {hasSelection && (
            <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-700">
              {selectedCount}
            </span>
          )}
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
        >
          <div className="flex flex-col gap-1">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <Checkbox
                  size="sm"
                  checked={value.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {hasSelection && (
            <>
              <div className="my-2 border-t border-slate-100" />
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
