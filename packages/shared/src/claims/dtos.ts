/**
 * Claims module DTOs - shared between API and web
 */

import type { ClaimStatus, CareType, ClaimFileCategory, PolicyStatus } from '../enums/index.js'
import type { PaginationMeta } from '../common/pagination.js'

// =============================================================================
// CLAIM LIST
// =============================================================================

export interface ClaimListItemDto {
  id: string
  claimNumber: string
  claimSequence: number
  status: ClaimStatus
  careType: CareType | null
  description: string | null

  // IDs
  clientId: string
  affiliateId: string
  patientId: string
  policyId: string | null

  // Denormalized names
  clientName: string
  affiliateName: string
  patientName: string
  policyNumber: string | null

  // Financial
  amountSubmitted: number | null
  amountApproved: number | null

  // Dates (ISO strings for JSON serialization)
  incidentDate: string | null
  submittedDate: string | null
  settlementDate: string | null
  createdAt: string
}

export interface ListClaimsResponse {
  claims: ClaimListItemDto[]
  meta: PaginationMeta
}

/** Valid sort fields for claims list */
export const ClaimsSortBy = {
  CREATED_AT: 'createdAt',
  CLAIM_NUMBER: 'claimNumber',
  STATUS: 'status',
  SUBMITTED_DATE: 'submittedDate',
  SETTLEMENT_DATE: 'settlementDate',
  AMOUNT_SUBMITTED: 'amountSubmitted',
  AMOUNT_APPROVED: 'amountApproved',
  INCIDENT_DATE: 'incidentDate',
} as const
export type ClaimsSortBy = (typeof ClaimsSortBy)[keyof typeof ClaimsSortBy]

// =============================================================================
// CREATE CLAIM
// =============================================================================

export interface CreateClaimResponseDto {
  id: string
  claimNumber: string
  claimSequence: number
  status: ClaimStatus
  affiliateId: string
  patientId: string
  clientId: string
  description: string | null
  createdAt: string
  createdById: string
}

export interface CreateClaimResponse {
  claim: CreateClaimResponseDto
}

// =============================================================================
// LOOKUP DTOs (for dropdowns/selectors)
// =============================================================================

export interface ClientDto {
  id: string
  name: string
  taxId: string
}

export interface GetAvailableClientsResponse {
  clients: ClientDto[]
}

export interface AffiliateDto {
  id: string
  firstName: string
  lastName: string
  email: string | null
  documentNumber: string | null
}

export interface GetAvailableAffiliatesResponse {
  affiliates: AffiliateDto[]
}

export interface PatientDto {
  id: string
  firstName: string
  lastName: string
  email: string | null
  documentNumber: string | null
  isDependent: boolean
}

export interface GetAvailablePatientsResponse {
  patients: PatientDto[]
}

// =============================================================================
// UPDATE CLAIM
// =============================================================================

export interface UpdateClaimRequestDto {
  // Status transition (optional)
  status?: ClaimStatus

  // DRAFT editable fields
  policyId?: string | null
  description?: string | null
  careType?: CareType | null
  diagnosisCode?: string | null
  diagnosisDescription?: string | null
  incidentDate?: string | null

  // VALIDATION editable fields
  amountSubmitted?: number | null
  submittedDate?: string | null

  // SUBMITTED/SETTLEMENT editable fields
  amountApproved?: number | null
  amountDenied?: number | null
  amountUnprocessed?: number | null
  deductibleApplied?: number | null
  copayApplied?: number | null
  settlementDate?: string | null
  settlementNumber?: string | null
  settlementNotes?: string | null

  // Transition-specific fields
  pendingReason?: string
  returnReason?: string
  cancellationReason?: string
  reprocessDate?: string
  reprocessDescription?: string
}

export interface UpdateClaimResponseDto {
  id: string
  claimNumber: string
  status: ClaimStatus
  updatedAt: string
}

export interface UpdateClaimResponse {
  claim: UpdateClaimResponseDto
}

// =============================================================================
// GET CLAIM DETAIL
// =============================================================================

export interface ClaimDetailDto {
  id: string
  claimNumber: string
  claimSequence: number
  status: ClaimStatus
  clientId: string
  affiliateId: string
  patientId: string
  policyId: string | null
  // Denormalized names (read-only, for display)
  clientName: string
  affiliateName: string
  patientName: string
  policyNumber: string | null
  careType: CareType | null
  description: string | null
  diagnosisCode: string | null
  diagnosisDescription: string | null
  amountSubmitted: number | null
  amountApproved: number | null
  amountDenied: number | null
  amountUnprocessed: number | null
  deductibleApplied: number | null
  copayApplied: number | null
  incidentDate: string | null
  submittedDate: string | null
  settlementDate: string | null
  businessDays: number | null
  settlementNumber: string | null
  settlementNotes: string | null
  returnReason: string | null
  cancellationReason: string | null
  pendingReason: string | null
  createdById: string
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export interface GetClaimResponse {
  claim: ClaimDetailDto
}

// =============================================================================
// DELETE CLAIM
// =============================================================================

export interface DeleteClaimResponse {
  deleted: {
    id: string
  }
}

// =============================================================================
// CLAIM AUDIT
// =============================================================================

/** Audit log item for API response */
export interface AuditLogItemDto {
  id: string
  action: string
  resourceType: string
  resourceId: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  changes: unknown
  metadata: unknown
  ipAddress: string | null
  createdAt: string
}

/** Response shape for GET /api/claims/:id/audit */
export interface GetClaimAuditResponse {
  auditLogs: AuditLogItemDto[]
  meta: PaginationMeta
}

// =============================================================================
// CLAIM INVOICES
// =============================================================================

/** Invoice item for API response */
export interface InvoiceDto {
  id: string
  claimId: string
  invoiceNumber: string
  providerName: string
  amountSubmitted: number
  createdById: string
  createdAt: string
}

/** Response shape for GET /api/claims/:claimId/invoices */
export interface ListInvoicesResponse {
  invoices: InvoiceDto[]
}

/** Response shape for POST /api/claims/:claimId/invoices */
export interface CreateInvoiceResponse {
  invoice: InvoiceDto
}

/** Response shape for POST /api/claims/:claimId/invoices/bulk */
export interface CreateInvoicesBulkResponse {
  invoices: InvoiceDto[]
  created: number
}

/** Response shape for PATCH /api/claims/:claimId/invoices/:invoiceId */
export interface EditInvoiceResponse {
  invoice: InvoiceDto
}

/** Response shape for DELETE /api/claims/:claimId/invoices/:invoiceId */
export interface DeleteInvoiceResponse {
  deleted: { id: string }
}

// =============================================================================
// CLAIM SLA METRICS
// =============================================================================

/** SLA status indicator */
export type SlaIndicator = 'on_time' | 'at_risk' | 'overdue'

/** SLA metrics for a single status stage */
export interface ClaimSlaStageDto {
  status: ClaimStatus
  enteredAt: string
  exitedAt: string | null
  businessDays: number
  calendarDays: number
  limit: number | null
  indicator: SlaIndicator
}

/** Response shape for GET /api/claims/:id/sla */
export interface GetClaimSlaResponse {
  claimId: string
  claimNumber: string
  currentStatus: ClaimStatus
  currentIndicator: SlaIndicator
  stages: ClaimSlaStageDto[]
  totalBusinessDays: number
  totalCalendarDays: number
}

// =============================================================================
// CLAIM FILES
// =============================================================================

/** File attached to a claim */
export interface ClaimFileDto {
  id: string
  fileId: string
  claimId: string
  originalName: string
  mimeType: string
  fileSize: number
  category: ClaimFileCategory | null
  description: string | null
  uploadedById: string
  uploadedAt: string
  downloadUrl: string
}

/** Request body for POST /api/claims/upload-url */
export interface GetUploadUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
}

/** Response shape for upload URL endpoints */
export interface GetUploadUrlResponse {
  storageKey: string
  uploadUrl: string
  expiresAt: string
}

/** File metadata for createClaim files[] array */
export interface CreateClaimFileInput {
  storageKey: string
  originalName: string
  mimeType: string
  fileSize: number
  category?: ClaimFileCategory
  description?: string
}

/** Request body for POST /api/claims/:claimId/files */
export interface CreateClaimFileRequest {
  storageKey: string
  originalName: string
  mimeType: string
  fileSize: number
  category?: ClaimFileCategory
  description?: string
}

/** Response shape for POST /api/claims/:claimId/files */
export interface CreateClaimFileResponse {
  file: ClaimFileDto
}

/** Response shape for GET /api/claims/:claimId/files */
export interface ListClaimFilesResponse {
  files: ClaimFileDto[]
}

/** Response shape for DELETE /api/claims/:claimId/files/:fileId */
export interface DeleteClaimFileResponse {
  deleted: { id: string }
}

// =============================================================================
// KANBAN CLAIMS
// =============================================================================

/** Single column in the Kanban board */
export interface KanbanColumnDto {
  status: ClaimStatus
  count: number
  claims: ClaimListItemDto[]
  hasMore: boolean
}

/** Response shape for GET /api/claims/kanban */
export interface KanbanClaimsResponse {
  columns: Record<ClaimStatus, KanbanColumnDto>
}

// =============================================================================
// CLAIM POLICIES (for policy dropdown in claim detail)
// =============================================================================

/** Policy item for dropdown/selector */
export interface PolicyDto {
  id: string
  policyNumber: string
  type: string | null
  status: PolicyStatus
  startDate: string
  endDate: string
  insurer: {
    id: string
    name: string
  }
}

/** Response shape for GET /api/claims/:claimId/policies */
export interface ListClaimPoliciesResponse {
  policies: PolicyDto[]
}
