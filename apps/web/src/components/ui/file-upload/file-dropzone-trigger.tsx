import * as React from 'react'
import { CloudUpload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export interface FileDropzoneTriggerProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
  currentCount: number
  maxFiles: number
  accept?: string
  maxSize?: number
  className?: string
}

export function FileDropzoneTrigger({
  onFilesSelected,
  disabled = false,
  currentCount,
  maxFiles,
  accept = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.doc,.docx',
  maxSize = MAX_FILE_SIZE,
  className,
}: FileDropzoneTriggerProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const remainingSlots = maxFiles - currentCount
  const isDisabled = disabled || remainingSlots <= 0

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = []

    for (const file of files) {
      if (validFiles.length >= remainingSlots) {
        toast.error(`Máximo ${maxFiles} archivos permitidos`)
        break
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Tipo de archivo no permitido: ${file.name}`)
        continue
      }

      if (file.size > maxSize) {
        toast.error(`Archivo muy grande: ${file.name} (máx ${formatSize(maxSize)})`)
        continue
      }

      validFiles.push(file)
    }

    return validFiles
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const validFiles = validateFiles(Array.from(files))
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDisabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (!isDisabled) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    if (!isDisabled) {
      inputRef.current?.click()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'group flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed transition-all cursor-pointer',
        isDragging
          ? 'border-teal-400 bg-teal-50'
          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-400',
        isDisabled && 'opacity-50 cursor-not-allowed hover:bg-slate-50/50 hover:border-slate-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
        className
      )}
      aria-label="Subir archivo"
      aria-disabled={isDisabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        disabled={isDisabled}
        className="hidden"
      />

      <div
        className={cn(
          'p-3 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform',
          !isDisabled && 'group-hover:scale-110'
        )}
      >
        <CloudUpload
          className={cn(
            'size-6',
            isDragging ? 'text-teal-500' : 'text-slate-400',
            !isDisabled && 'group-hover:text-teal-500'
          )}
        />
      </div>

      <p
        className={cn(
          'mt-3 text-sm font-medium',
          isDragging ? 'text-teal-700' : 'text-slate-600',
          !isDisabled && 'group-hover:text-teal-700'
        )}
      >
        Subir archivo
      </p>

      <p className="text-xs text-slate-400">PDF, JPG, PNG</p>

      {remainingSlots < maxFiles && remainingSlots > 0 && (
        <p className="text-xs text-slate-400 mt-1">
          {remainingSlots} {remainingSlots === 1 ? 'espacio' : 'espacios'} disponible{remainingSlots === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
}
