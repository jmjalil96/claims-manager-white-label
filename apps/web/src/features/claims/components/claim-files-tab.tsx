import { useState, useCallback } from 'react'
import { Folder, Loader2, Upload } from 'lucide-react'
import type { ClaimFileCategory } from '@claims/shared'
import type { ClaimFileDto } from '@claims/shared'
import {
  Button,
  FileDropzoneTrigger,
  FileCard,
  UploadingFileCard,
  type UploadingFile,
} from '@/components/ui'
import { toast } from '@/lib'
import {
  useClaimFiles,
  useUploadClaimFile,
  useDeleteClaimFile,
} from '../claimFiles'

interface ClaimFilesTabProps {
  claimId: string
}

export function ClaimFilesTab({ claimId }: ClaimFilesTabProps) {
  const { data, isLoading, isError } = useClaimFiles(claimId)
  const uploadMutation = useUploadClaimFile(claimId)
  const deleteMutation = useDeleteClaimFile(claimId)

  // Local state for files being uploaded
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const existingFiles = data?.files ?? []
  const totalFileCount = existingFiles.length + uploadingFiles.length
  const pendingFiles = uploadingFiles.filter((f) => f.status === 'pending')
  const hasPendingFiles = pendingFiles.length > 0

  // Handle file selection - STAGED: only add to state, don't upload yet
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const pending: UploadingFile[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      file, // Store File object for deferred upload
      status: 'pending' as const,
      progress: 0,
      category: null,
    }))
    setUploadingFiles((prev) => [...prev, ...pending])
    // NO upload call - wait for user to trigger
  }, [])

  // Upload all pending files
  const handleUploadAll = useCallback(async () => {
    const filesToUpload = uploadingFiles.filter(
      (f) => f.status === 'pending' && f.file
    )

    for (const item of filesToUpload) {
      // Mark as uploading
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'uploading' as const, progress: 30 }
            : f
        )
      )

      try {
        await uploadMutation.mutateAsync({
          file: item.file!,
          category: item.category ?? undefined,
        })

        // Remove on success (will appear in existingFiles after invalidation)
        setUploadingFiles((prev) => prev.filter((f) => f.id !== item.id))
        toast.success(`${item.name} subido correctamente`)
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error:
                    error instanceof Error ? error.message : 'Error de subida',
                }
              : f
          )
        )
        toast.error(`Error al subir ${item.name}`)
      }
    }
  }, [uploadingFiles, uploadMutation])

  // Upload a single file
  const handleUploadSingle = useCallback(
    async (fileId: string) => {
      const item = uploadingFiles.find((f) => f.id === fileId)
      if (!item || item.status !== 'pending' || !item.file) return

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: 'uploading' as const, progress: 30 }
            : f
        )
      )

      try {
        await uploadMutation.mutateAsync({
          file: item.file,
          category: item.category ?? undefined,
        })
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId))
        toast.success(`${item.name} subido correctamente`)
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'error' as const,
                  error:
                    error instanceof Error ? error.message : 'Error de subida',
                }
              : f
          )
        )
        toast.error(`Error al subir ${item.name}`)
      }
    },
    [uploadingFiles, uploadMutation]
  )

  // Handle removing an uploading file (before it's saved)
  const handleRemoveUploadingFile = useCallback((fileId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  // Handle category change for uploading files
  const handleCategoryChange = useCallback(
    (fileId: string, category: ClaimFileCategory | null) => {
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, category } : f))
      )
    },
    []
  )

  // Handle deleting an existing file
  const handleDeleteFile = useCallback(async (file: ClaimFileDto) => {
    if (deletingFileId) return // Prevent double-delete

    setDeletingFileId(file.id)
    try {
      await deleteMutation.mutateAsync(file.id)
      toast.success(`${file.originalName} eliminado`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar archivo'
      )
    } finally {
      setDeletingFileId(null)
    }
  }, [deleteMutation, deletingFileId])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-teal-600" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
        <p className="text-red-600">Error al cargar los archivos</p>
      </div>
    )
  }

  // Empty state - show just the dropzone trigger centered
  if (existingFiles.length === 0 && uploadingFiles.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-900">
            Documentos adjuntos
          </h3>
        </div>

        {/* Empty state with single upload card */}
        <div className="flex flex-col items-center py-8">
          <Folder className="size-12 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500 mb-6">Sin archivos adjuntos</p>
          <div className="w-full max-w-xs">
            <FileDropzoneTrigger
              onFilesSelected={handleFilesSelected}
              currentCount={0}
              maxFiles={10}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats and Upload Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">
          Documentos adjuntos
        </h3>
        <div className="flex items-center gap-3">
          {hasPendingFiles && (
            <Button
              size="sm"
              onClick={() => void handleUploadAll()}
              leftIcon={<Upload className="size-4" />}
            >
              Subir {pendingFiles.length}{' '}
              {pendingFiles.length === 1 ? 'archivo' : 'archivos'}
            </Button>
          )}
          <span className="text-sm text-slate-500">
            {existingFiles.length}{' '}
            {existingFiles.length === 1 ? 'archivo' : 'archivos'} •{' '}
            {formatTotalSize(existingFiles)}
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* A. Upload Trigger Card (first) */}
        <FileDropzoneTrigger
          onFilesSelected={handleFilesSelected}
          disabled={totalFileCount >= 10}
          currentCount={totalFileCount}
          maxFiles={10}
        />

        {/* B. Uploading Files (progress cards) */}
        {uploadingFiles.map((file) => (
          <UploadingFileCard
            key={file.id}
            file={file}
            onRemove={() => handleRemoveUploadingFile(file.id)}
            onCategoryChange={(category) => handleCategoryChange(file.id, category)}
            onUpload={
              file.status === 'pending'
                ? () => void handleUploadSingle(file.id)
                : undefined
            }
          />
        ))}

        {/* C. Existing Files (file cards) */}
        {existingFiles.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onDelete={() => void handleDeleteFile(file)}
            isDeleting={deletingFileId === file.id}
          />
        ))}
      </div>
    </div>
  )
}

/* -----------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

function formatTotalSize(files: ClaimFileDto[]): string {
  const total = files.reduce((sum, f) => sum + f.fileSize, 0)
  if (total < 1024) return `${total} B`
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`
  return `${(total / (1024 * 1024)).toFixed(1)} MB`
}
