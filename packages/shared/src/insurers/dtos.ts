/**
 * Insurers module DTOs - shared between API and web
 */

import type { PaginationMeta } from '../common/pagination.js'

// =============================================================================
// INSURER LIST
// =============================================================================

export interface InsurerListItemDto {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  policyCount: number
  createdAt: string
}

export interface ListInsurersResponse {
  insurers: InsurerListItemDto[]
  meta: PaginationMeta
}

/** Valid sort fields for insurers list */
export const InsurersSortBy = {
  CREATED_AT: 'createdAt',
  NAME: 'name',
  CODE: 'code',
} as const
export type InsurersSortBy = (typeof InsurersSortBy)[keyof typeof InsurersSortBy]

// =============================================================================
// GET INSURER DETAIL
// =============================================================================

export interface InsurerDetailDto {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  website: string | null
  taxRate: number | null
  isActive: boolean
  policyCount: number
  invoiceCount: number
  createdAt: string
  updatedAt: string
}

export interface GetInsurerResponse {
  insurer: InsurerDetailDto
}

// =============================================================================
// CREATE INSURER
// =============================================================================

export interface CreateInsurerResponseDto {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  website: string | null
  taxRate: number | null
  isActive: boolean
  createdAt: string
}

export interface CreateInsurerResponse {
  insurer: CreateInsurerResponseDto
}

// =============================================================================
// UPDATE INSURER
// =============================================================================

export interface UpdateInsurerResponseDto {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  website: string | null
  taxRate: number | null
  isActive: boolean
  updatedAt: string
}

export interface UpdateInsurerResponse {
  insurer: UpdateInsurerResponseDto
}

// =============================================================================
// DELETE INSURER
// =============================================================================

export interface DeleteInsurerResponse {
  deleted: {
    id: string
  }
}
