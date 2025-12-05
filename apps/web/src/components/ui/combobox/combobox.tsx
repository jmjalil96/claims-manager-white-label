import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, Check, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxOption<T extends string = string> {
  value: T
  label: string
  description?: string
}

export interface ComboboxProps<T extends string = string> {
  options: ComboboxOption<T>[]
  value: T | null
  onChange: (value: T | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  loading?: boolean
  error?: boolean
  className?: string
}

export function Combobox<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled = false,
  loading = false,
  error = false,
  className,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const selectedOption = options.find((opt) => opt.value === value)

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const query = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query)
    )
  }, [options, search])

  const handleSelect = (optionValue: T) => {
    onChange(optionValue)
    setOpen(false)
    setSearch('')
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSearch('')
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-200 focus:ring-teal-500',
            !selectedOption && 'text-slate-400',
            selectedOption && 'text-slate-900',
            className
          )}
        >
          <span className="truncate">
            {loading ? (
              <span className="flex items-center gap-2 text-slate-400">
                <Loader2 className="size-4 animate-spin" />
                Cargando...
              </span>
            ) : selectedOption ? (
              selectedOption.label
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-slate-400 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[--radix-popover-trigger-width] rounded-lg border border-slate-200 bg-white shadow-lg',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                      'hover:bg-slate-50',
                      isSelected && 'bg-teal-50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'truncate',
                          isSelected ? 'text-teal-700 font-medium' : 'text-slate-900'
                        )}
                      >
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="truncate text-xs text-slate-400">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-teal-600" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
