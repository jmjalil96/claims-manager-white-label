/**
 * Service layer for listing clients
 * Contains business logic, filtering, and authorization
 */

import { db } from '../../../lib/db.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { ListClientsInput } from './listClients.schema.js'
import type { ListClientsResponse, ClientListItemDto, PaginationMeta } from '@claims/shared'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('clients:listClients')

/**
 * List clients with filtering, sorting, and pagination
 *
 * Authorization matrix:
 * - Internal roles: Full access to all clients
 * - External roles: Only clients they have UserClient access to
 *
 * @param input - Validated query parameters
 * @param user - Authenticated user context
 * @returns Paginated list of clients with metadata
 */
export async function listClients(
  input: ListClientsInput,
  user: AuthUser
): Promise<ListClientsResponse> {
  const {
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Listing clients')

  // Build where clause
  const where: Prisma.ClientWhereInput = {}

  // 1. Authorization scoping
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    // External roles: scope to accessible clients via UserClient
    const accessibleClients = await db.userClient.findMany({
      where: { userId: user.id, isActive: true },
      select: { clientId: true },
    })
    const accessibleClientIds = accessibleClients.map((uc) => uc.clientId)

    if (accessibleClientIds.length === 0) {
      return { clients: [], meta: buildMeta(0, page, limit) }
    }

    where.id = { in: accessibleClientIds }
  }

  // 2. Apply filters
  if (isActive !== undefined) {
    where.isActive = isActive
  }

  // 3. Search (contains + OR across multiple fields)
  if (search) {
    const searchTerm = search.trim()
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { taxId: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ]
  }

  // 4. Count total for pagination
  const totalCount = await db.client.count({ where })

  // 5. Fetch clients with pagination and counts
  const skip = (page - 1) * limit

  const clients = await db.client.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          policies: true,
          affiliates: true,
        },
      },
    },
  })

  // 6. Transform to DTO
  const clientDtos: ClientListItemDto[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    taxId: c.taxId,
    email: c.email,
    phone: c.phone,
    isActive: c.isActive,
    policyCount: c._count.policies,
    affiliateCount: c._count.affiliates,
    createdAt: c.createdAt.toISOString(),
  }))

  logger.info({ totalCount, returned: clientDtos.length }, 'Clients listed successfully')

  return {
    clients: clientDtos,
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
