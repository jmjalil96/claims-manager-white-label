import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FilterChip {
  key: string
  label: string
  value: string
  onRemove: () => void
}

interface FilterChipsProps {
  chips: FilterChip[]
  onClearAll?: () => void
  className?: string
}

export function FilterChips({ chips, onClearAll, className }: FilterChipsProps) {
  if (chips.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-2 text-sm text-slate-700"
        >
          <span>
            <span className="font-medium">{chip.label}:</span> {chip.value}
          </span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            aria-label={`Remover filtro ${chip.label}`}
          >
            <X size={14} />
          </button>
        </span>
      ))}

      {onClearAll && (
        <>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Limpiar todo
          </button>
        </>
      )}
    </div>
  )
}
