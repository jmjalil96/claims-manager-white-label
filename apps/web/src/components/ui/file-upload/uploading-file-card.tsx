import { FileText, Loader2, AlertCircle, X, Upload } from 'lucide-react'
import { ClaimFileCategory } from '@claims/shared'
import { cn } from '@/lib/utils'
import type { UploadingFile } from './file-list'

const ClaimFileCategoryLabel: Record<ClaimFileCategory, string> = {
  RECEIPT: 'Recibo',
  PRESCRIPTION: 'Receta médica',
  LAB_REPORT: 'Resultado de laboratorio',
  DISCHARGE_SUMMARY: 'Resumen de egreso',
  AUTHORIZATION: 'Autorización',
  OTHER: 'Otro',
}

const FILE_CATEGORIES = Object.values(ClaimFileCategory).map((value) => ({
  value,
  label: ClaimFileCategoryLabel[value],
}))

export interface UploadingFileCardProps {
  file: UploadingFile
  onRemove?: () => void
  onCategoryChange?: (category: ClaimFileCategory | null) => void
  onUpload?: () => void // Individual upload trigger for pending files
  className?: string
}

export function UploadingFileCard({
  file,
  onRemove,
  onCategoryChange,
  onUpload,
  className,
}: UploadingFileCardProps) {
  const isError = file.status === 'error'
  const isUploading = file.status === 'uploading'
  const isPending = file.status === 'pending'

  return (
    <div
      className={cn(
        'relative flex flex-col h-48 rounded-xl border bg-white shadow-sm overflow-hidden',
        isError && 'border-red-200',
        isPending && 'border-amber-200',
        !isError && !isPending && 'border-slate-200',
        className
      )}
    >
      {/* Progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-teal-500/5 z-0 pointer-events-none" />
      )}

      {/* Action buttons - top right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {/* Upload button for pending files */}
        {isPending && onUpload && (
          <button
            type="button"
            onClick={onUpload}
            className="p-1 rounded-full bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-sm"
            aria-label="Subir archivo"
          >
            <Upload className="size-3.5" />
          </button>
        )}
        {/* Remove button */}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-full bg-white/90 backdrop-blur text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-slate-100"
            aria-label="Eliminar archivo"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Icon Area */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center border-b',
          isError ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
        )}
      >
        {isUploading ? (
          <Loader2 className="size-10 text-teal-500 animate-spin" />
        ) : isError ? (
          <AlertCircle className="size-10 text-red-400" />
        ) : (
          <FileText className="size-10 text-slate-300" />
        )}
      </div>

      {/* Meta + Category Area */}
      <div className="p-3 bg-white relative z-10">
        <p className="text-sm font-medium text-slate-700 truncate pr-6" title={file.name}>
          {file.name}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
          <StatusIndicator status={file.status} progress={file.progress} />
        </div>

        {/* Category selector - only show when not in error state */}
        {!isError && onCategoryChange && (
          <select
            className="mt-2 h-7 w-full px-2 text-xs rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={file.category || ''}
            onChange={(e) =>
              onCategoryChange(
                e.target.value ? (e.target.value as ClaimFileCategory) : null
              )
            }
          >
            <option value="">Sin categoría</option>
            {FILE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        )}

        {/* Error message */}
        {isError && file.error && (
          <p className="mt-1.5 text-xs text-red-600 truncate" title={file.error}>
            {file.error}
          </p>
        )}
      </div>

      {/* Progress bar at bottom */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className="h-full bg-teal-500 transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

function StatusIndicator({
  status,
  progress,
}: {
  status: UploadingFile['status']
  progress: number
}) {
  switch (status) {
    case 'pending':
      return <span className="text-xs text-slate-400">Pendiente</span>
    case 'uploading':
      return <span className="text-xs text-teal-600">{progress}%</span>
    case 'error':
      return <span className="text-xs text-red-500">Error</span>
    case 'success':
      return <span className="text-xs text-green-500">Completado</span>
    default:
      return null
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
