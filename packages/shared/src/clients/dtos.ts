/**
 * Clients module DTOs - shared between API and web
 */

import type { PaginationMeta } from '../common/pagination.js'

// =============================================================================
// CLIENT LIST
// =============================================================================

export interface ClientListItemDto {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  isActive: boolean
  policyCount: number
  affiliateCount: number
  createdAt: string
}

export interface ListClientsResponse {
  clients: ClientListItemDto[]
  meta: PaginationMeta
}

/** Valid sort fields for clients list */
export const ClientsSortBy = {
  CREATED_AT: 'createdAt',
  NAME: 'name',
  TAX_ID: 'taxId',
} as const
export type ClientsSortBy = (typeof ClientsSortBy)[keyof typeof ClientsSortBy]

// =============================================================================
// GET CLIENT DETAIL
// =============================================================================

export interface ClientDetailDto {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  policyCount: number
  affiliateCount: number
  createdAt: string
  updatedAt: string
}

export interface GetClientResponse {
  client: ClientDetailDto
}

// =============================================================================
// CREATE CLIENT
// =============================================================================

export interface CreateClientResponseDto {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateClientResponse {
  client: CreateClientResponseDto
}

// =============================================================================
// UPDATE CLIENT
// =============================================================================

export interface UpdateClientResponseDto {
  id: string
  name: string
  taxId: string
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  updatedAt: string
}

export interface UpdateClientResponse {
  client: UpdateClientResponseDto
}

// =============================================================================
// DELETE CLIENT
// =============================================================================

export interface DeleteClientResponse {
  deleted: {
    id: string
  }
}
