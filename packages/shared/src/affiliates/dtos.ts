/**
 * Affiliate DTOs - Types shared between API and web
 */

import type { DependentRelationship, Gender, MaritalStatus } from '../enums/index.js'
import type { PaginationMeta } from '../common/pagination.js'

// =============================================================================
// SORT OPTIONS
// =============================================================================

export const AffiliatesSortBy = {
  CREATED_AT: 'createdAt',
  LAST_NAME: 'lastName',
  FIRST_NAME: 'firstName',
  DOCUMENT_NUMBER: 'documentNumber',
} as const
export type AffiliatesSortBy = (typeof AffiliatesSortBy)[keyof typeof AffiliatesSortBy]

// =============================================================================
// DEPENDENT DTO (nested in owner responses)
// =============================================================================

export interface DependentDto {
  id: string
  firstName: string
  lastName: string
  documentNumber: string | null
  dateOfBirth: string | null
  gender: Gender | null
  relationship: DependentRelationship
  isActive: boolean
}

// =============================================================================
// LIST ITEM DTO (for tables - flat list)
// =============================================================================

export interface AffiliateListItemDto {
  id: string
  firstName: string
  lastName: string
  documentType: string | null
  documentNumber: string | null
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: Gender | null
  isOwner: boolean
  relationship: DependentRelationship | null
  dependentCount: number
  enrollmentCount: number
  clientId: string
  clientName: string
  isActive: boolean
  createdAt: string
}

// =============================================================================
// FAMILY DTO (for grouped list - ?groupBy=family)
// =============================================================================

export interface AffiliateFamilyDto {
  id: string
  firstName: string
  lastName: string
  documentType: string | null
  documentNumber: string | null
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: Gender | null
  clientId: string
  clientName: string
  enrollmentCount: number
  isActive: boolean
  createdAt: string
  dependents: DependentDto[]
}

// =============================================================================
// DETAIL DTO (single affiliate view)
// =============================================================================

export interface AffiliateDetailDto {
  id: string
  firstName: string
  lastName: string
  documentType: string | null
  documentNumber: string | null
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: Gender | null
  maritalStatus: MaritalStatus | null

  // Relationship info
  isOwner: boolean
  primaryAffiliateId: string | null
  primaryAffiliate: { id: string; firstName: string; lastName: string } | null
  relationship: DependentRelationship | null
  dependents: DependentDto[]

  // Ownership
  clientId: string
  clientName: string

  // Portal access
  userId: string | null
  hasPortalAccess: boolean

  // Counts
  enrollmentCount: number
  claimCount: number

  isActive: boolean
  createdAt: string
  updatedAt: string
}

// =============================================================================
// CREATE RESPONSE
// =============================================================================

export interface CreateAffiliateResponseDto {
  id: string
  firstName: string
  lastName: string
  documentType: string | null
  documentNumber: string | null
  email: string | null
  phone: string | null
  isOwner: boolean
  relationship: DependentRelationship | null
  clientId: string
  isActive: boolean
  createdAt: string
}

// =============================================================================
// UPDATE RESPONSE
// =============================================================================

export interface UpdateAffiliateResponseDto {
  id: string
  firstName: string
  lastName: string
  documentType: string | null
  documentNumber: string | null
  email: string | null
  phone: string | null
  isOwner: boolean
  relationship: DependentRelationship | null
  isActive: boolean
  updatedAt: string
}

// =============================================================================
// API RESPONSE WRAPPERS
// =============================================================================

export interface ListAffiliatesResponse {
  affiliates: AffiliateListItemDto[]
  meta: PaginationMeta
}

export interface ListAffiliatesFamiliesResponse {
  families: AffiliateFamilyDto[]
  meta: PaginationMeta
}

export interface GetAffiliateResponse {
  affiliate: AffiliateDetailDto
}

export interface CreateAffiliateResponse {
  affiliate: CreateAffiliateResponseDto
}

export interface UpdateAffiliateResponse {
  affiliate: UpdateAffiliateResponseDto
}

export interface DeleteAffiliateResponse {
  deleted: { id: string }
}

// =============================================================================
// LOOKUP DTOs (for create/update forms)
// =============================================================================

export interface OwnerDto {
  id: string
  firstName: string
  lastName: string
  email: string | null
  documentNumber: string | null
}

export interface GetAvailableOwnersResponse {
  owners: OwnerDto[]
}
