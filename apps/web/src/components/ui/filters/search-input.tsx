import * as React from 'react'
import { Search } from 'lucide-react'
import { Input } from '../primitives/input'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value)

  // Sync local state when external value changes
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const debouncedOnChange = useDebounce(onChange, debounceMs)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    debouncedOnChange(newValue)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
  }

  return (
    <Input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      leftIcon={<Search size={18} />}
      clearable={localValue.length > 0}
      onClear={handleClear}
      className={cn('w-full md:w-80 lg:w-96', className)}
      size="sm"
    />
  )
}
