import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, Receipt, Clock, History, Info } from 'lucide-react'
import { ClaimStatus, CareType } from '@claims/shared'
import { Tabs, TabsList, TabsTrigger, TabsContent, EditableText, EditableNumber, EditableSelect, EditableTextarea, EditableDate } from '@/components/ui'
import { ClaimDetailHeader, ClaimWorkflowStepper } from '@/features/claims/components'

export const Route = createFileRoute('/_authenticated/test')({
  component: ComponentRepositoryPage,
})

/* -----------------------------------------------------------------------------
 * Mock Data
 * -------------------------------------------------------------------------- */

const mockHeaders = [
  { claimNumber: '2024-001234', status: ClaimStatus.PENDING_INFO, careType: CareType.AMBULATORY },
  { claimNumber: '2024-001235', status: ClaimStatus.SETTLED, careType: CareType.HOSPITALIZATION },
  { claimNumber: '2024-001236', status: ClaimStatus.DRAFT, careType: null },
]

interface StepperMock {
  status: ClaimStatus
  label: string
  pendingReason?: string
  returnReason?: string
  cancellationReason?: string
}

const mockSteppers: StepperMock[] = [
  { status: ClaimStatus.DRAFT, label: 'DRAFT - First step' },
  { status: ClaimStatus.VALIDATION, label: 'VALIDATION - Second step' },
  { status: ClaimStatus.SUBMITTED, label: 'SUBMITTED - Third step' },
  { status: ClaimStatus.PENDING_INFO, pendingReason: 'Falta adjuntar factura original', label: 'PENDING_INFO - Alternative state' },
  { status: ClaimStatus.RETURNED, returnReason: 'Documentación incompleta', label: 'RETURNED - Terminal (failed)' },
  { status: ClaimStatus.SETTLED, label: 'SETTLED - Terminal (success)' },
  { status: ClaimStatus.CANCELLED, cancellationReason: 'Solicitud del afiliado', label: 'CANCELLED - Terminal' },
]

/* -----------------------------------------------------------------------------
 * Component Repository Page
 * -------------------------------------------------------------------------- */

function ComponentRepositoryPage() {
  const [pillTab, setPillTab] = useState('info')
  const [lineTab, setLineTab] = useState('info')

  // EditableText demo state
  const [description, setDescription] = useState('Consulta médica general')
  const [emptyField, setEmptyField] = useState<string | null>(null)
  const [requiredField, setRequiredField] = useState('Valor inicial')

  // EditableNumber demo state
  const [amount, setAmount] = useState<number | null>(1234.56)
  const [emptyAmount, setEmptyAmount] = useState<number | null>(null)
  const [boundedAmount, setBoundedAmount] = useState<number | null>(50)

  // EditableSelect demo state
  const [status, setStatus] = useState<ClaimStatus | null>(ClaimStatus.DRAFT)
  const [careType, setCareType] = useState<CareType | null>(null)

  // EditableTextarea demo state
  const [notes, setNotes] = useState<string | null>('Paciente presenta síntomas de gripe.\nSe recomienda reposo.')
  const [emptyNotes, setEmptyNotes] = useState<string | null>(null)

  // EditableDate demo state
  const [incidentDate, setIncidentDate] = useState<string | null>('2024-11-15')
  const [emptyDate, setEmptyDate] = useState<string | null>(null)
  const [boundedDate, setBoundedDate] = useState<string | null>('2024-12-01')

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Component Repository</h1>
        <p className="text-slate-500 mt-1">Test and preview claim detail components</p>
      </div>

      {/* EditableText */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">EditableText</h2>
          <p className="text-sm text-slate-500">Inline editable text field with save/cancel actions</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic usage */}
            <EditableText
              label="Descripción"
              value={description}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 1000))
                setDescription(value)
              }}
            />

            {/* Empty value */}
            <EditableText
              label="Campo Vacío"
              value={emptyField}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setEmptyField(value || null)
              }}
            />

            {/* Required field */}
            <EditableText
              label="Campo Requerido"
              value={requiredField}
              required
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setRequiredField(value)
              }}
            />

            {/* Disabled */}
            <EditableText
              label="Campo Deshabilitado"
              value="No editable"
              disabled
              onSave={async () => {}}
            />

            {/* With error simulation */}
            <EditableText
              label="Simula Error"
              value="Intenta guardar..."
              onSave={async () => {
                await new Promise((r) => setTimeout(r, 500))
                throw new Error('Error de conexión')
              }}
            />
          </div>
        </div>
      </section>

      {/* EditableNumber */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">EditableNumber</h2>
          <p className="text-sm text-slate-500">Inline editable number field with currency formatting</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* With currency prefix */}
            <EditableNumber
              label="Monto Presentado"
              value={amount}
              prefix="$"
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 1000))
                setAmount(value)
              }}
            />

            {/* Empty value */}
            <EditableNumber
              label="Monto Aprobado"
              value={emptyAmount}
              prefix="$"
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setEmptyAmount(value)
              }}
            />

            {/* With min/max bounds */}
            <EditableNumber
              label="Porcentaje (0-100)"
              value={boundedAmount}
              suffix="%"
              min={0}
              max={100}
              step={1}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setBoundedAmount(value)
              }}
            />

            {/* Disabled */}
            <EditableNumber
              label="Campo Deshabilitado"
              value={999.99}
              prefix="$"
              disabled
              onSave={async () => {}}
            />

            {/* With error simulation */}
            <EditableNumber
              label="Simula Error"
              value={100}
              prefix="Q"
              onSave={async () => {
                await new Promise((r) => setTimeout(r, 500))
                throw new Error('Error de conexión')
              }}
            />
          </div>
        </div>
      </section>

      {/* EditableSelect */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">EditableSelect</h2>
          <p className="text-sm text-slate-500">Inline editable dropdown with typed options</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status select */}
            <EditableSelect<ClaimStatus>
              label="Estado"
              value={status}
              options={[
                { value: ClaimStatus.DRAFT, label: 'Borrador' },
                { value: ClaimStatus.VALIDATION, label: 'Validación' },
                { value: ClaimStatus.SUBMITTED, label: 'Enviado' },
                { value: ClaimStatus.PENDING_INFO, label: 'Pendiente Info' },
                { value: ClaimStatus.SETTLED, label: 'Liquidado' },
              ]}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 1000))
                setStatus(value)
              }}
            />

            {/* Empty value */}
            <EditableSelect<CareType>
              label="Tipo de Atención"
              value={careType}
              options={[
                { value: CareType.AMBULATORY, label: 'Ambulatorio' },
                { value: CareType.HOSPITALIZATION, label: 'Hospitalización' },
                { value: CareType.MATERNITY, label: 'Maternidad' },
                { value: CareType.EMERGENCY, label: 'Emergencia' },
              ]}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setCareType(value)
              }}
            />

            {/* Disabled */}
            <EditableSelect<ClaimStatus>
              label="Campo Deshabilitado"
              value={ClaimStatus.SETTLED}
              options={[
                { value: ClaimStatus.SETTLED, label: 'Liquidado' },
              ]}
              disabled
              onSave={async () => {}}
            />

            {/* With error simulation */}
            <EditableSelect<ClaimStatus>
              label="Simula Error"
              value={ClaimStatus.DRAFT}
              options={[
                { value: ClaimStatus.DRAFT, label: 'Borrador' },
                { value: ClaimStatus.VALIDATION, label: 'Validación' },
              ]}
              onSave={async () => {
                await new Promise((r) => setTimeout(r, 500))
                throw new Error('Error de conexión')
              }}
            />
          </div>
        </div>
      </section>

      {/* EditableTextarea */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">EditableTextarea</h2>
          <p className="text-sm text-slate-500">Inline editable multiline text field</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic usage with multiline */}
            <EditableTextarea
              label="Notas del Reclamo"
              value={notes}
              rows={4}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 1000))
                setNotes(value || null)
              }}
            />

            {/* Empty value */}
            <EditableTextarea
              label="Observaciones"
              value={emptyNotes}
              rows={3}
              placeholder="Agregue observaciones..."
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setEmptyNotes(value || null)
              }}
            />

            {/* Disabled */}
            <EditableTextarea
              label="Campo Deshabilitado"
              value="Este campo no es editable.\nSegunda línea de texto."
              rows={3}
              disabled
              onSave={async () => {}}
            />

            {/* With error simulation */}
            <EditableTextarea
              label="Simula Error"
              value="Intenta guardar..."
              rows={2}
              onSave={async () => {
                await new Promise((r) => setTimeout(r, 500))
                throw new Error('Error de conexión')
              }}
            />
          </div>
        </div>
      </section>

      {/* EditableDate */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">EditableDate</h2>
          <p className="text-sm text-slate-500">Inline editable date field with DD/MM/YYYY display format</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic usage */}
            <EditableDate
              label="Fecha Incidente"
              value={incidentDate}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 1000))
                setIncidentDate(value)
              }}
            />

            {/* Empty value */}
            <EditableDate
              label="Fecha Liquidación"
              value={emptyDate}
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setEmptyDate(value)
              }}
            />

            {/* With min/max bounds */}
            <EditableDate
              label="Fecha Presentado (2024)"
              value={boundedDate}
              min="2024-01-01"
              max="2024-12-31"
              onSave={async (value) => {
                await new Promise((r) => setTimeout(r, 500))
                setBoundedDate(value)
              }}
            />

            {/* Disabled */}
            <EditableDate
              label="Campo Deshabilitado"
              value="2024-10-20"
              disabled
              onSave={async () => {}}
            />

            {/* With error simulation */}
            <EditableDate
              label="Simula Error"
              value="2024-09-15"
              onSave={async () => {
                await new Promise((r) => setTimeout(r, 500))
                throw new Error('Error de conexión')
              }}
            />
          </div>
        </div>
      </section>

      {/* Tabs - Line Variant */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">Tabs (Line Variant)</h2>
          <p className="text-sm text-slate-500">For main page navigation with icons and badges</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-6 bg-white">
          <Tabs variant="line" value={lineTab} onValueChange={setLineTab}>
            <TabsList>
              <TabsTrigger value="info" icon={<Info />}>Información</TabsTrigger>
              <TabsTrigger value="files" icon={<FileText />} badge={3}>Archivos</TabsTrigger>
              <TabsTrigger value="invoices" icon={<Receipt />} badge={2}>Facturas</TabsTrigger>
              <TabsTrigger value="sla" icon={<Clock />}>SLA</TabsTrigger>
              <TabsTrigger value="history" icon={<History />}>Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Detalle principal del reclamo.</p>
              </div>
            </TabsContent>
            <TabsContent value="files">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">3 archivos adjuntos.</p>
              </div>
            </TabsContent>
            <TabsContent value="invoices">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">2 facturas asociadas.</p>
              </div>
            </TabsContent>
            <TabsContent value="sla">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Métricas de tiempo de respuesta.</p>
              </div>
            </TabsContent>
            <TabsContent value="history">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Registro de auditoría.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Tabs - Pill Variant */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">Tabs (Pill Variant)</h2>
          <p className="text-sm text-slate-500">For compact context switches</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-6 bg-white">
          <Tabs variant="pill" value={pillTab} onValueChange={setPillTab}>
            <TabsList>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="files" badge={3}>Archivos</TabsTrigger>
              <TabsTrigger value="invoices">Facturas</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Pill style content.</p>
              </div>
            </TabsContent>
            <TabsContent value="files">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Files content.</p>
              </div>
            </TabsContent>
            <TabsContent value="invoices">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Invoices content.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ClaimWorkflowStepper */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">ClaimWorkflowStepper</h2>
          <p className="text-sm text-slate-500">Workflow stepper with status progression and actions</p>
        </div>

        <div className="space-y-6">
          {mockSteppers.map((stepper) => (
            <div key={stepper.status}>
              <p className="text-xs font-medium text-slate-500 mb-2">{stepper.label}</p>
              <ClaimWorkflowStepper
                currentStatus={stepper.status}
                pendingReason={stepper.pendingReason}
                returnReason={stepper.returnReason}
                cancellationReason={stepper.cancellationReason}
                onTransition={(toStatus) => alert(`Transition to: ${toStatus}`)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ClaimDetailHeader */}
      <section className="space-y-6">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xl font-semibold text-slate-900">ClaimDetailHeader</h2>
          <p className="text-sm text-slate-500">Header component for claim detail view</p>
        </div>

        <div className="space-y-8">
          {mockHeaders.map((claim) => (
            <div
              key={claim.claimNumber}
              className="rounded-lg border border-slate-200 p-6 bg-white"
            >
              <ClaimDetailHeader
                claimNumber={claim.claimNumber}
                status={claim.status}
                careType={claim.careType}
                onEdit={() => alert(`Edit claim ${claim.claimNumber}`)}
                onMoreActions={() => alert(`More actions for ${claim.claimNumber}`)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
