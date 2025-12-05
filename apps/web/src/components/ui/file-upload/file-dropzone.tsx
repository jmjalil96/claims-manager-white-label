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

export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  maxSize?: number
  maxFiles?: number
  currentFileCount?: number
  disabled?: boolean
  className?: string
}

export function FileDropzone({
  onFilesSelected,
  accept = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.doc,.docx',
  maxSize = MAX_FILE_SIZE,
  maxFiles = 10,
  currentFileCount = 0,
  disabled = false,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const remainingSlots = maxFiles - currentFileCount

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = []

    for (const file of files) {
      // Check remaining slots
      if (validFiles.length >= remainingSlots) {
        toast.error(`Máximo ${maxFiles} archivos permitidos`)
        break
      }

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Tipo de archivo no permitido: ${file.name}`)
        continue
      }

      // Check file size
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
    if (!disabled) setIsDragging(true)
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
    if (!disabled) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input to allow selecting same file again
    e.target.value = ''
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
        isDragging
          ? 'border-teal-400 bg-teal-50'
          : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30',
        disabled && 'opacity-50 cursor-not-allowed hover:border-slate-200 hover:bg-transparent',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      <CloudUpload
        className={cn(
          'mx-auto size-8',
          isDragging ? 'text-teal-500' : 'text-slate-400'
        )}
      />

      <p className="mt-2 text-sm text-slate-600">
        Arrastra archivos o{' '}
        <span className="text-teal-600 font-medium">explora</span>
      </p>

      <p className="text-xs text-slate-400 mt-1">
        PDF, JPG, PNG • Máx {formatSize(maxSize)}
      </p>

      {remainingSlots < maxFiles && (
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
