import { File, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react'
import { ClaimFileCategory, ClaimFileCategoryLabel } from '@claims/shared'
import type { PolicyFileCategory } from '@claims/shared'
import { cn } from '@/lib/utils'

const FILE_CATEGORIES = Object.values(ClaimFileCategory).map((value) => ({
  value,
  label: ClaimFileCategoryLabel[value],
}))

// Generic file category type that supports both Claim and Policy
export type FileCategory = ClaimFileCategory | PolicyFileCategory

export interface UploadingFile<T extends FileCategory = ClaimFileCategory> {
  id: string
  name: string
  size: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  category: T | null
  file?: File // Store actual File object for deferred upload
  storageKey?: string
  error?: string
}

export interface FileListProps {
  files: UploadingFile[]
  onRemove: (id: string) => void
  onCategoryChange: (id: string, category: ClaimFileCategory | null) => void
  maxFiles?: number
  className?: string
}

export function FileList({
  files,
  onRemove,
  onCategoryChange,
  maxFiles = 10,
  className,
}: FileListProps) {
  if (files.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium text-slate-700">
        Archivos ({files.length}/{maxFiles})
      </p>
      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onRemove={onRemove}
            onCategoryChange={onCategoryChange}
          />
        ))}
      </div>
    </div>
  )
}

interface FileItemProps {
  file: UploadingFile
  onRemove: (id: string) => void
  onCategoryChange: (id: string, category: ClaimFileCategory | null) => void
}

function FileItem({ file, onRemove, onCategoryChange }: FileItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg border',
        file.status === 'error'
          ? 'bg-red-50 border-red-200'
          : 'bg-slate-50 border-slate-100'
      )}
    >
      <FileIcon status={file.status} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {file.name}
        </p>

        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-slate-400">
            {formatFileSize(file.size)}
          </p>
          <StatusIndicator file={file} />
        </div>

        {/* Category selector */}
        {file.status !== 'error' && (
          <select
            className="mt-1.5 h-7 w-full px-2 text-xs rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={file.category || ''}
            onChange={(e) =>
              onCategoryChange(
                file.id,
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
        {file.status === 'error' && file.error && (
          <p className="mt-1 text-xs text-red-600">{file.error}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
        aria-label="Eliminar archivo"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

function FileIcon({ status }: { status: UploadingFile['status'] }) {
  if (status === 'error') {
    return <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
  }
  return <File className="size-4 text-slate-400 shrink-0 mt-0.5" />
}

function StatusIndicator({ file }: { file: UploadingFile }) {
  switch (file.status) {
    case 'pending':
      return <span className="text-xs text-slate-400">Pendiente</span>
    case 'uploading':
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="size-3 animate-spin text-teal-500" />
          <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${file.progress}%` }}
            />
          </div>
          <span className="text-xs text-teal-600">{file.progress}%</span>
        </div>
      )
    case 'success':
      return <Check className="size-3 text-green-500" />
    case 'error':
      return <span className="text-xs text-red-500">Error</span>
    default:
      return null
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
