/**
 * Service layer for listing affiliates
 * Contains business logic, filtering, and authorization
 */

import { db } from '../../../lib/db.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import { AppError } from '../../../lib/errors.js'
import type { ListAffiliatesInput } from './listAffiliates.schema.js'
import type {
  ListAffiliatesResponse,
  ListAffiliatesFamiliesResponse,
  AffiliateListItemDto,
  AffiliateFamilyDto,
  DependentDto,
  PaginationMeta,
} from '@claims/shared'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('affiliates:listAffiliates')

/**
 * List affiliates as flat list with filtering, sorting, and pagination
 */
export async function listAffiliates(
  input: ListAffiliatesInput,
  user: AuthUser
): Promise<ListAffiliatesResponse> {
  const {
    clientId,
    isActive,
    isOwner,
    primaryAffiliateId,
    search,
    sortBy = 'lastName',
    sortOrder = 'asc',
    page = 1,
    limit = 20,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Listing affiliates')

  // Build where clause with authorization scoping
  const where = await buildWhereClause(user, {
    clientId,
    isActive,
    isOwner,
    primaryAffiliateId,
    search,
  })

  if (where === null) {
    return { affiliates: [], meta: buildMeta(0, page, limit) }
  }

  // Count total for pagination
  const totalCount = await db.affiliate.count({ where })

  // Fetch affiliates with pagination
  const skip = (page - 1) * limit

  const affiliates = await db.affiliate.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      primaryAffiliateId: true,
      relationship: true,
      clientId: true,
      client: { select: { name: true } },
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          dependents: true,
          enrollments: { where: { endDate: null } },
        },
      },
    },
  })

  // Transform to DTOs
  const affiliateDtos: AffiliateListItemDto[] = affiliates.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    documentType: a.documentType,
    documentNumber: a.documentNumber,
    email: a.email,
    phone: a.phone,
    dateOfBirth: a.dateOfBirth?.toISOString() ?? null,
    gender: a.gender,
    isOwner: a.primaryAffiliateId === null,
    relationship: a.relationship,
    dependentCount: a._count.dependents,
    enrollmentCount: a._count.enrollments,
    clientId: a.clientId,
    clientName: a.client.name,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
  }))

  logger.info({ totalCount, returned: affiliateDtos.length }, 'Affiliates listed successfully')

  return {
    affiliates: affiliateDtos,
    meta: buildMeta(totalCount, page, limit),
  }
}

/**
 * List affiliates grouped by family (owners with nested dependents)
 */
export async function listAffiliatesFamilies(
  input: ListAffiliatesInput,
  user: AuthUser
): Promise<ListAffiliatesFamiliesResponse> {
  const {
    clientId,
    isActive,
    search,
    sortBy = 'lastName',
    sortOrder = 'asc',
    page = 1,
    limit = 20,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Listing affiliate families')

  // Build where clause - only owners for family view
  const where = await buildWhereClause(user, {
    clientId,
    isActive,
    isOwner: true, // Force owners only
    search,
  })

  if (where === null) {
    return { families: [], meta: buildMeta(0, page, limit) }
  }

  // Count total for pagination
  const totalCount = await db.affiliate.count({ where })

  // Fetch owners with their dependents
  const skip = (page - 1) * limit

  const owners = await db.affiliate.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      clientId: true,
      client: { select: { name: true } },
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: { where: { endDate: null } },
        },
      },
      dependents: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          documentNumber: true,
          dateOfBirth: true,
          gender: true,
          relationship: true,
          isActive: true,
        },
        orderBy: { firstName: 'asc' },
      },
    },
  })

  // Transform to DTOs
  const familyDtos: AffiliateFamilyDto[] = owners.map((o) => ({
    id: o.id,
    firstName: o.firstName,
    lastName: o.lastName,
    documentType: o.documentType,
    documentNumber: o.documentNumber,
    email: o.email,
    phone: o.phone,
    dateOfBirth: o.dateOfBirth?.toISOString() ?? null,
    gender: o.gender,
    clientId: o.clientId,
    clientName: o.client.name,
    enrollmentCount: o._count.enrollments,
    isActive: o.isActive,
    createdAt: o.createdAt.toISOString(),
    dependents: o.dependents.map((d): DependentDto => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      documentNumber: d.documentNumber,
      dateOfBirth: d.dateOfBirth?.toISOString() ?? null,
      gender: d.gender,
      relationship: d.relationship!,
      isActive: d.isActive,
    })),
  }))

  logger.info({ totalCount, returned: familyDtos.length }, 'Affiliate families listed successfully')

  return {
    families: familyDtos,
    meta: buildMeta(totalCount, page, limit),
  }
}

/**
 * Build where clause with authorization scoping
 * Returns null if user has no access
 */
async function buildWhereClause(
  user: AuthUser,
  filters: {
    clientId?: string
    isActive?: boolean
    isOwner?: boolean
    primaryAffiliateId?: string
    search?: string
  }
): Promise<Prisma.AffiliateWhereInput | null> {
  const where: Prisma.AffiliateWhereInput = {}
  const hasInternalRole = isInternalRole(user.role)

  // 1. Authorization scoping
  if (hasInternalRole) {
    // Internal roles: optional clientId filter
    if (filters.clientId) {
      where.clientId = filters.clientId
    }
  } else if (user.role === 'client_affiliate') {
    // Affiliates: only self and dependents
    const affiliate = await db.affiliate.findUnique({
      where: { userId: user.id },
      select: { id: true, clientId: true },
    })

    if (!affiliate) {
      throw AppError.forbidden('Usuario no tiene afiliado asociado')
    }

    where.OR = [{ id: affiliate.id }, { primaryAffiliateId: affiliate.id }]
    where.clientId = affiliate.clientId
  } else {
    // Client admin or other external roles: scoped to accessible clients
    const accessibleClients = await db.userClient.findMany({
      where: { userId: user.id, isActive: true },
      select: { clientId: true },
    })
    const accessibleClientIds = accessibleClients.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      return null
    }

    // If clientId filter provided, validate access
    if (filters.clientId) {
      if (!accessibleClientIds.includes(filters.clientId)) {
        throw AppError.forbidden('Sin acceso a este cliente')
      }
      where.clientId = filters.clientId
    } else {
      where.clientId = { in: accessibleClientIds }
    }
  }

  // 2. Apply filters
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  if (filters.isOwner !== undefined) {
    if (filters.isOwner) {
      where.primaryAffiliateId = null
    } else {
      where.primaryAffiliateId = { not: null }
    }
  }

  if (filters.primaryAffiliateId) {
    where.primaryAffiliateId = filters.primaryAffiliateId
  }

  // 3. Search
  if (filters.search) {
    const searchTerm = filters.search.trim()
    where.AND = [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { documentNumber: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
    ]
  }

  return where
}

/**
 * Build pagination metadata
 */
function buildMeta(totalCount: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit)
  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
