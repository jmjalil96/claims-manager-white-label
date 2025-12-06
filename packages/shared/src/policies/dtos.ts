/**
 * Policies module DTOs - shared between API and web
 */

import type { PolicyStatus, PolicyType, PolicyFileCategory } from '../enums/index.js'
import type { PaginationMeta } from '../common/index.js'
import type { AuditLogItemDto } from '../claims/dtos.js'

// =============================================================================
// SORT OPTIONS
// =============================================================================

export const PoliciesSortBy = {
  CREATED_AT: 'createdAt',
  POLICY_NUMBER: 'policyNumber',
  STATUS: 'status',
  START_DATE: 'startDate',
  END_DATE: 'endDate',
} as const

// =============================================================================
// LIST POLICIES
// =============================================================================

export interface PolicyListItemDto {
  id: string
  policyNumber: string
  clientId: string
  clientName: string
  insurerId: string
  insurerName: string
  type: PolicyType | null
  status: PolicyStatus
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

export interface ListPoliciesResponse {
  policies: PolicyListItemDto[]
  meta: PaginationMeta
}

// =============================================================================
// POLICY DETAIL
// =============================================================================

export interface PolicyDetailDto {
  id: string
  policyNumber: string

  clientId: string
  clientName: string
  insurerId: string
  insurerName: string

  type: PolicyType | null
  status: PolicyStatus

  startDate: string
  endDate: string

  ambCopay: number | null
  hospCopay: number | null
  maternity: number | null

  tPremium: number | null
  tplus1Premium: number | null
  tplusfPremium: number | null

  benefitsCost: number | null

  isActive: boolean

  expirationReason: string | null
  cancellationReason: string | null

  createdAt: string
  updatedAt: string
}

// =============================================================================
// CREATE POLICY
// =============================================================================

export interface CreatePolicyResponseDto {
  id: string
  policyNumber: string
  clientId: string
  insurerId: string
  type: PolicyType | null
  status: PolicyStatus
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

export interface CreatePolicyResponse {
  policy: CreatePolicyResponseDto
}

// =============================================================================
// UPDATE POLICY
// =============================================================================

export interface UpdatePolicyResponseDto {
  id: string
  policyNumber: string
  status: PolicyStatus
  updatedAt: string
}

export interface UpdatePolicyResponse {
  policy: UpdatePolicyResponseDto
}

// =============================================================================
// GET POLICY
// =============================================================================

export interface GetPolicyResponse {
  policy: PolicyDetailDto
}

// =============================================================================
// DELETE POLICY
// =============================================================================

export interface DeletePolicyResponse {
  deleted: { id: string }
}

// =============================================================================
// KANBAN POLICIES
// =============================================================================

export interface PolicyKanbanColumnDto {
  status: PolicyStatus
  count: number
  policies: PolicyListItemDto[]
  hasMore: boolean
}

export interface KanbanPoliciesResponse {
  columns: Record<PolicyStatus, PolicyKanbanColumnDto>
}

// =============================================================================
// GET AVAILABLE INSURERS
// =============================================================================

export interface InsurerDto {
  id: string
  name: string
  code: string | null
}

export interface GetAvailableInsurersResponse {
  insurers: InsurerDto[]
}

// =============================================================================
// GET AVAILABLE CLIENTS (re-exported from claims)
// =============================================================================

// ClientDto and GetAvailableClientsResponse are exported from claims module
// to avoid duplication (same types used across modules)

// =============================================================================
// POLICY FILES
// =============================================================================

/** File attached to a policy */
export interface PolicyFileDto {
  id: string
  fileId: string
  policyId: string
  originalName: string
  mimeType: string
  fileSize: number
  category: PolicyFileCategory | null
  description: string | null
  uploadedById: string
  uploadedAt: string
  downloadUrl: string
}

/** Response shape for GET /api/policies/:policyId/files */
export interface ListPolicyFilesResponse {
  files: PolicyFileDto[]
}

/** Response shape for POST /api/policies/:policyId/files */
export interface CreatePolicyFileResponse {
  file: PolicyFileDto
}

/** Response shape for DELETE /api/policies/:policyId/files/:fileId */
export interface DeletePolicyFileResponse {
  deleted: { id: string }
}

/** Response shape for POST /api/policies/:policyId/files/upload-url */
export interface GetPolicyUploadUrlResponse {
  storageKey: string
  uploadUrl: string
  expiresAt: string
}

/** Request body for POST /api/policies/:policyId/files */
export interface CreatePolicyFileRequest {
  storageKey: string
  originalName: string
  mimeType: string
  fileSize: number
  category?: PolicyFileCategory
  description?: string
}

/** Request body for POST /api/policies/:policyId/files/upload-url */
export interface GetPolicyUploadUrlRequest {
  filename: string
  mimeType: string
  fileSize: number
}

// =============================================================================
// POLICY AUDIT
// =============================================================================

/** Audit log item - reuses claims AuditLogItemDto structure */
export type { AuditLogItemDto }

/** Response shape for GET /api/policies/:id/audit */
export interface GetPolicyAuditResponse {
  auditLogs: AuditLogItemDto[]
  meta: PaginationMeta
}
