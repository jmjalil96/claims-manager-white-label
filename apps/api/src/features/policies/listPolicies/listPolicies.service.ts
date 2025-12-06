/**
 * Service layer for listing policies
 * Contains business logic, filtering, and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { ListPoliciesInput } from './listPolicies.schema.js'
import type { ListPoliciesResponse, PolicyListItemDto, PaginationMeta } from './listPolicies.dto.js'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('policies:listPolicies')

/**
 * List policies with filtering, sorting, and pagination
 *
 * Authorization matrix:
 * - Internal roles: Full access to all policies
 * - External roles with client access: Policies for accessible clients only
 * - Affiliates (client_affiliate): Policies for their client only
 *
 * @param input - Validated query parameters
 * @param user - Authenticated user context
 * @returns Paginated list of policies with metadata
 */
export async function listPolicies(
  input: ListPoliciesInput,
  user: AuthUser
): Promise<ListPoliciesResponse> {
  const {
    clientId,
    insurerId,
    status,
    type,
    isActive,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    createdAtFrom,
    createdAtTo,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Listing policies')

  // Build where clause
  const where: Prisma.PolicyWhereInput = {}

  // 1. Authorization scoping
  // - Internal roles (broker employees): full access
  // - Client admins/agents: scoped to accessible clients
  // - Affiliates: no access to policies
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    if (user.role === 'client_affiliate') {
      // Affiliates cannot access policies
      throw AppError.forbidden('Afiliados no tienen acceso a pólizas')
    }

    // Client admins/agents: scope to accessible clients
    const accessibleClients = await db.userClient.findMany({
      where: { userId: user.id, isActive: true },
      select: { clientId: true },
    })
    const accessibleClientIds = accessibleClients.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      return { policies: [], meta: buildMeta(0, page, limit) }
    }

    where.clientId = { in: accessibleClientIds }
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

  if (insurerId) where.insurerId = insurerId
  if (status?.length) where.status = { in: status }
  if (type?.length) where.type = { in: type }
  if (isActive !== undefined) where.isActive = isActive

  // Date filters (inclusive both ends)
  if (startDateFrom || startDateTo) {
    where.startDate = {
      ...(startDateFrom && { gte: new Date(startDateFrom) }),
      ...(startDateTo && { lte: new Date(startDateTo) }),
    }
  }
  if (endDateFrom || endDateTo) {
    where.endDate = {
      ...(endDateFrom && { gte: new Date(endDateFrom) }),
      ...(endDateTo && { lte: new Date(endDateTo) }),
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
      { policyNumber: { contains: searchTerm, mode: 'insensitive' } },
      { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { insurer: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ]
  }

  // 4. Count total for pagination
  const totalCount = await db.policy.count({ where })

  // 5. Fetch policies with pagination and minimal joins
  const skip = (page - 1) * limit

  const policies = await db.policy.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    select: {
      id: true,
      policyNumber: true,
      clientId: true,
      insurerId: true,
      type: true,
      status: true,
      startDate: true,
      endDate: true,
      isActive: true,
      createdAt: true,
      // Minimal joins for denormalized names
      client: { select: { name: true } },
      insurer: { select: { name: true } },
    },
  })

  // 6. Transform to DTO (denormalize names)
  const policyDtos: PolicyListItemDto[] = policies.map((p) => ({
    id: p.id,
    policyNumber: p.policyNumber,
    clientId: p.clientId,
    clientName: p.client.name,
    insurerId: p.insurerId,
    insurerName: p.insurer.name,
    type: p.type,
    status: p.status,
    startDate: formatDate(p.startDate),
    endDate: formatDate(p.endDate),
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  }))

  logger.info({ totalCount, returned: policyDtos.length }, 'Policies listed successfully')

  return {
    policies: policyDtos,
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

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
