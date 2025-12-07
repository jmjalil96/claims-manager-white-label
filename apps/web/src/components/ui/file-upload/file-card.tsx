import { FileText, Image, Download, Trash2, Loader2 } from 'lucide-react'
import type { ClaimFileDto, PolicyFileDto, ClaimFileCategory, PolicyFileCategory } from '@claims/shared'
import { ClaimFileCategoryLabel, PolicyFileCategoryLabel } from '@claims/shared'
import { cn } from '@/lib/utils'
import type { FileCategory } from './file-list'

// Generic file type that works for both Claim and Policy files
export type GenericFileDto = {
  id: string
  fileId: string
  originalName: string
  mimeType: string
  fileSize: number
  category: FileCategory | null
  description: string | null
  uploadedById: string
  uploadedAt: string
  downloadUrl: string
}

// Get label for any category type
function getCategoryLabel(category: FileCategory): string {
  if (category in ClaimFileCategoryLabel) {
    return ClaimFileCategoryLabel[category as ClaimFileCategory]
  }
  if (category in PolicyFileCategoryLabel) {
    return PolicyFileCategoryLabel[category as PolicyFileCategory]
  }
  return category
}

export interface FileCardProps {
  file: ClaimFileDto | PolicyFileDto | GenericFileDto
  onDelete?: () => void
  isDeleting?: boolean
  className?: string
}

export function FileCard({
  file,
  onDelete,
  isDeleting = false,
  className,
}: FileCardProps) {
  const isImage = file.mimeType.startsWith('image/')

  return (
    <div
      className={cn(
        'group relative flex flex-col h-48 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden',
        className
      )}
    >
      {/* Category Badge - top left */}
      {file.category && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-slate-700 shadow-sm border border-slate-100">
            {getCategoryLabel(file.category)}
          </span>
        </div>
      )}

      {/* Icon/Preview Area */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center border-b border-slate-100">
        {isImage ? (
          <Image className="size-10 text-purple-300" />
        ) : (
          <FileText className="size-10 text-blue-300" />
        )}
      </div>

      {/* Meta Area */}
      <div className="p-3 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700 truncate" title={file.originalName}>
              {file.originalName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Download */}
            <a
              href={file.downloadUrl}
              download={file.originalName}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
              )}
              title="Descargar"
              aria-label={`Descargar ${file.originalName}`}
            >
              <Download className="size-4" />
            </a>

            {/* Delete */}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isDeleting
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                )}
                title="Eliminar"
                aria-label={`Eliminar ${file.originalName}`}
                aria-busy={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
