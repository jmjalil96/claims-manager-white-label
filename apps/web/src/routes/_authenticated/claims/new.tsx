import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, User, FileText, Upload } from 'lucide-react'
import type { ClaimFileCategory } from '@claims/shared'
import {
  Button,
  Textarea,
  Combobox,
  FileDropzone,
  FileList,
  FormField,
  type ComboboxOption,
  type UploadingFile,
} from '@/components/ui'
import { toast } from '@/lib'
import {
  useClients,
  useAffiliates,
  usePatients,
  useCreateClaim,
  getUploadUrl,
  uploadFileToStorage,
  createClaimSchema,
  type CreateClaimInput,
} from '@/features/claims'

export const Route = createFileRoute('/_authenticated/claims/new')({
  component: NewClaimPage,
})

/* -----------------------------------------------------------------------------
 * Helper Components
 * -------------------------------------------------------------------------- */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <h2 className="font-semibold text-lg flex items-center gap-2 text-slate-900">
      <Icon className="size-5 text-teal-600" />
      {title}
    </h2>
  )
}

/* -----------------------------------------------------------------------------
 * Main Page Component
 * -------------------------------------------------------------------------- */

function NewClaimPage() {
  // Form state with react-hook-form
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClaimInput>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      clientId: '',
      affiliateId: '',
      patientId: '',
      description: '',
    },
  })

  const clientId = watch('clientId')
  const affiliateId = watch('affiliateId')
  const description = watch('description') ?? ''

  // File upload state
  const [files, setFiles] = useState<UploadingFile[]>([])

  // Data fetching
  const { data: clientsData, isLoading: loadingClients } = useClients()
  const { data: affiliatesData, isLoading: loadingAffiliates } = useAffiliates(
    clientId || null
  )
  const { data: patientsData, isLoading: loadingPatients } = usePatients(
    affiliateId || null
  )

  // Create claim mutation
  const createClaimMutation = useCreateClaim()

  // For demo: show internal user view (with client selector)
  const isInternalUser = true

  // Transform data to combobox options
  const clientOptions: ComboboxOption[] = useMemo(
    () =>
      clientsData?.clients.map((c) => ({
        value: c.id,
        label: c.name,
        description: c.taxId,
      })) ?? [],
    [clientsData]
  )

  const affiliateOptions: ComboboxOption[] = useMemo(
    () =>
      affiliatesData?.affiliates.map((a) => ({
        value: a.id,
        label: `${a.firstName} ${a.lastName}`,
        description: a.documentNumber ?? a.email ?? undefined,
      })) ?? [],
    [affiliatesData]
  )

  const patientOptions: ComboboxOption[] = useMemo(
    () =>
      patientsData?.patients.map((p) => ({
        value: p.id,
        label: `${p.firstName} ${p.lastName}`,
        description: p.isDependent ? 'Dependiente' : 'Titular',
      })) ?? [],
    [patientsData]
  )

  // File handlers
  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    // Add files to state with pending status
    const filesToUpload: UploadingFile[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
      category: null,
    }))

    setFiles((prev) => [...prev, ...filesToUpload])

    // Upload each file
    for (const [i, file] of newFiles.entries()) {
      const uploadingFile = filesToUpload[i]
      if (!uploadingFile) continue

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id ? { ...f, status: 'uploading', progress: 10 } : f
          )
        )

        // Get presigned URL
        const { uploadUrl, storageKey } = await getUploadUrl({
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        })

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id ? { ...f, progress: 30 } : f
          )
        )

        // Upload to storage
        await uploadFileToStorage(uploadUrl, file)

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, status: 'success', progress: 100, storageKey }
              : f
          )
        )
      } catch (error) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Error de subida',
                }
              : f
          )
        )
      }
    }
  }, [])

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  const handleCategoryChange = useCallback(
    (fileId: string, category: ClaimFileCategory | null) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, category } : f))
      )
    },
    []
  )

  // Form submit
  const onSubmit = async (data: CreateClaimInput) => {
    // Get successfully uploaded files
    const uploadedFiles = files
      .filter((f) => f.status === 'success' && f.storageKey)
      .map((f) => ({
        storageKey: f.storageKey!,
        originalName: f.name,
        mimeType: 'application/octet-stream', // TODO: store actual mime type
        fileSize: f.size,
        category: f.category ?? undefined,
      }))

    try {
      await createClaimMutation.mutateAsync({
        clientId: data.clientId,
        affiliateId: data.affiliateId,
        patientId: data.patientId,
        description: data.description,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      })
      toast.success('Reclamo creado exitosamente')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear el reclamo'
      )
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/claims"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Cancelar
        </Link>
        <h1 className="text-3xl font-bold mt-3 text-slate-900">Nuevo Reclamo</h1>
        <p className="text-slate-500 mt-1">
          Complete la información para iniciar un proceso de reembolso.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
      >
        {/* LEFT COLUMN (2/3) - Core Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Patient Context */}
          <Card className="p-6 space-y-5">
            <CardHeader icon={User} title="Paciente" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client selector - only for internal users */}
              {isInternalUser && (
                <div className="md:col-span-2">
                  <FormField
                    label="Cliente"
                    name="clientId"
                    required
                    error={errors.clientId?.message}
                  >
                    <Combobox
                      options={clientOptions}
                      value={clientId || null}
                      onChange={(value) => {
                        setValue('clientId', value ?? '', { shouldValidate: true })
                        setValue('affiliateId', '')
                        setValue('patientId', '')
                      }}
                      placeholder="Seleccionar cliente..."
                      searchPlaceholder="Buscar cliente..."
                      emptyMessage="No se encontraron clientes"
                      loading={loadingClients}
                      error={!!errors.clientId}
                    />
                  </FormField>
                </div>
              )}

              {/* Affiliate selector */}
              <FormField
                label="Afiliado (Titular)"
                name="affiliateId"
                required
                error={errors.affiliateId?.message}
              >
                <Combobox
                  options={affiliateOptions}
                  value={affiliateId || null}
                  onChange={(value) => {
                    setValue('affiliateId', value ?? '', { shouldValidate: true })
                    setValue('patientId', '')
                  }}
                  placeholder="Seleccionar afiliado..."
                  searchPlaceholder="Buscar afiliado..."
                  emptyMessage="No se encontraron afiliados"
                  disabled={isInternalUser && !clientId}
                  loading={loadingAffiliates}
                  error={!!errors.affiliateId}
                />
              </FormField>

              {/* Patient selector */}
              <FormField
                label="Paciente"
                name="patientId"
                required
                error={errors.patientId?.message}
              >
                <Combobox
                  options={patientOptions}
                  value={watch('patientId') || null}
                  onChange={(value) => setValue('patientId', value ?? '', { shouldValidate: true })}
                  placeholder="Seleccionar paciente..."
                  searchPlaceholder="Buscar paciente..."
                  emptyMessage="No se encontraron pacientes"
                  disabled={!affiliateId}
                  loading={loadingPatients}
                  error={!!errors.patientId}
                />
              </FormField>
            </div>
          </Card>

          {/* Card 2: Details */}
          <Card className="p-6 space-y-5">
            <CardHeader icon={FileText} title="Detalles del Incidente" />

            <FormField
              label="Descripción del reclamo"
              name="description"
              required
              error={errors.description?.message}
            >
              <Textarea
                placeholder="Describa los síntomas, diagnóstico, tratamiento recibido, fechas de atención y cualquier información relevante para el proceso de reembolso..."
                value={description}
                onChange={(e) => setValue('description', e.target.value, { shouldValidate: true })}
                maxLength={1000}
                size="lg"
                error={!!errors.description}
              />
              <p className="text-xs text-slate-400 text-right">
                {description.length}/1000 caracteres
              </p>
            </FormField>
          </Card>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="size-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-medium text-teal-700">i</span>
            </div>
            <p className="text-sm text-slate-600">
              El reclamo se creará en estado <strong>BORRADOR</strong>. Podrás agregar más
              documentos y editar la información antes de enviarlo.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) - Documents + Actions */}
        <div className="space-y-6 lg:sticky lg:top-8">
          <Card className="p-6 space-y-5">
            <CardHeader icon={Upload} title="Documentos" />

            {/* File Dropzone */}
            <FileDropzone
              onFilesSelected={(files) => void handleFilesSelected(files)}
              currentFileCount={files.length}
              maxFiles={10}
              disabled={createClaimMutation.isPending}
            />

            {/* File List */}
            <FileList
              files={files}
              onRemove={handleRemoveFile}
              onCategoryChange={handleCategoryChange}
              maxFiles={10}
            />
          </Card>

          {/* Sticky Actions */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={createClaimMutation.isPending}
            >
              {createClaimMutation.isPending ? 'Creando...' : 'Crear Reclamo'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={createClaimMutation.isPending}
            >
              Guardar Borrador
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
