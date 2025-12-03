/**
 * Service layer for listing claims
 * Contains business logic, filtering, and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { ListClaimsInput } from './listClaims.schema.js'
import type { ListClaimsResponse, ClaimListItemDto, PaginationMeta } from './listClaims.dto.js'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('claims:listClaims')

/**
 * List claims with filtering, sorting, and pagination
 *
 * Authorization matrix:
 * - Internal roles: Full access to all claims
 * - External roles with client access: Claims for accessible clients only
 * - Affiliates (client_affiliate): Only claims where they are the affiliate
 *
 * @param input - Validated query parameters
 * @param user - Authenticated user context
 * @returns Paginated list of claims with metadata
 */
export async function listClaims(
  input: ListClaimsInput,
  user: AuthUser
): Promise<ListClaimsResponse> {
  const {
    clientId,
    status,
    careType,
    affiliateId,
    patientId,
    policyId,
    createdById,
    incidentDateFrom,
    incidentDateTo,
    submittedDateFrom,
    submittedDateTo,
    settlementDateFrom,
    settlementDateTo,
    createdAtFrom,
    createdAtTo,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Listing claims')

  // Build where clause
  const where: Prisma.ClaimWhereInput = {}

  // 1. Authorization scoping
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    if (user.role === 'client_affiliate') {
      // Affiliates can only see claims where they are the affiliate
      const affiliate = await db.affiliate.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!affiliate) {
        throw AppError.forbidden('Usuario no tiene afiliado asociado')
      }
      where.affiliateId = affiliate.id
    } else {
      // External roles: scope to accessible clients
      const accessibleClients = await db.userClient.findMany({
        where: { userId: user.id, isActive: true },
        select: { clientId: true },
      })
      const accessibleClientIds = accessibleClients.map((uc) => uc.clientId)

      if (accessibleClientIds.length === 0) {
        return { claims: [], meta: buildMeta(0, page, limit) }
      }

      where.clientId = { in: accessibleClientIds }
    }
  }

  // 2. Apply filters
  if (clientId) {
    // Verify access if not internal
    if (!hasInternalRole && where.clientId) {
      const clientIdFilter = where.clientId as Prisma.StringFilter
      const allowedIds = 'in' in clientIdFilter ? clientIdFilter.in : []
      if (allowedIds && !allowedIds.includes(clientId)) {
        throw AppError.forbidden('Sin acceso a este cliente')
      }
    }
    where.clientId = clientId
  }

  if (status?.length) where.status = { in: status }
  if (careType?.length) where.careType = { in: careType }
  if (affiliateId) where.affiliateId = affiliateId
  if (patientId) where.patientId = patientId
  if (policyId) where.policyId = policyId
  if (createdById) where.createdById = createdById

  // Date filters (inclusive both ends)
  if (incidentDateFrom || incidentDateTo) {
    where.incidentDate = {
      ...(incidentDateFrom && { gte: new Date(incidentDateFrom) }),
      ...(incidentDateTo && { lte: new Date(incidentDateTo) }),
    }
  }
  if (submittedDateFrom || submittedDateTo) {
    where.submittedDate = {
      ...(submittedDateFrom && { gte: new Date(submittedDateFrom) }),
      ...(submittedDateTo && { lte: new Date(submittedDateTo) }),
    }
  }
  if (settlementDateFrom || settlementDateTo) {
    where.settlementDate = {
      ...(settlementDateFrom && { gte: new Date(settlementDateFrom) }),
      ...(settlementDateTo && { lte: new Date(settlementDateTo) }),
    }
  }
  if (createdAtFrom || createdAtTo) {
    where.createdAt = {
      ...(createdAtFrom && { gte: new Date(createdAtFrom) }),
      ...(createdAtTo && { lte: endOfDay(new Date(createdAtTo)) }),
    }
  }

  // 3. Search (contains + OR across multiple fields)
  if (search) {
    const searchTerm = search.trim()
    where.OR = [
      { claimNumber: { contains: searchTerm, mode: 'insensitive' } },
      { patient: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
      { patient: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
      { affiliate: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
      { affiliate: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
      { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ]
  }

  // 4. Count total for pagination
  const totalCount = await db.claim.count({ where })

  // 5. Fetch claims with pagination and minimal joins
  const skip = (page - 1) * limit

  const claims = await db.claim.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    select: {
      id: true,
      claimNumber: true,
      claimSequence: true,
      status: true,
      careType: true,
      description: true,
      clientId: true,
      affiliateId: true,
      patientId: true,
      policyId: true,
      amountSubmitted: true,
      amountApproved: true,
      incidentDate: true,
      submittedDate: true,
      settlementDate: true,
      createdAt: true,
      // Minimal joins for denormalized names
      client: { select: { name: true } },
      affiliate: { select: { firstName: true, lastName: true } },
      patient: { select: { firstName: true, lastName: true } },
      policy: { select: { policyNumber: true } },
    },
  })

  // 6. Transform to DTO (denormalize names)
  const claimDtos: ClaimListItemDto[] = claims.map((c) => ({
    id: c.id,
    claimNumber: c.claimNumber,
    claimSequence: c.claimSequence,
    status: c.status,
    careType: c.careType,
    description: c.description,
    clientId: c.clientId,
    affiliateId: c.affiliateId,
    patientId: c.patientId,
    policyId: c.policyId,
    clientName: c.client.name,
    affiliateName: `${c.affiliate.firstName} ${c.affiliate.lastName}`,
    patientName: `${c.patient.firstName} ${c.patient.lastName}`,
    policyNumber: c.policy?.policyNumber ?? null,
    amountSubmitted: c.amountSubmitted,
    amountApproved: c.amountApproved,
    incidentDate: c.incidentDate?.toISOString().split('T')[0] ?? null,
    submittedDate: c.submittedDate?.toISOString().split('T')[0] ?? null,
    settlementDate: c.settlementDate?.toISOString().split('T')[0] ?? null,
    createdAt: c.createdAt.toISOString(),
  }))

  logger.info({ totalCount, returned: claimDtos.length }, 'Claims listed successfully')

  return {
    claims: claimDtos,
    meta: buildMeta(totalCount, page, limit),
  }
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

/**
 * Get end of day for datetime inclusive filtering
 */
function endOfDay(date: Date): Date {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}
