/**
 * Service layer for listing insurers
 * Contains business logic, filtering, and pagination
 */

import { db } from '../../../lib/db.js'
import { createLogger } from '../../../lib/logger.js'
import type { ListInsurersInput } from './listInsurers.schema.js'
import type { ListInsurersResponse, InsurerListItemDto, PaginationMeta } from '@claims/shared'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('insurers:listInsurers')

/**
 * List insurers with filtering, sorting, and pagination
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * @param input - Validated query parameters
 * @param user - Authenticated user context
 * @returns Paginated list of insurers with metadata
 */
export async function listInsurers(
  input: ListInsurersInput,
  user: AuthUser
): Promise<ListInsurersResponse> {
  const {
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Listing insurers')

  // Build where clause
  const where: Prisma.InsurerWhereInput = {}

  // 1. Apply filters
  if (isActive !== undefined) {
    where.isActive = isActive
  }

  // 2. Search (contains + OR across multiple fields)
  if (search) {
    const searchTerm = search.trim()
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { code: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ]
  }

  // 3. Count total for pagination
  const totalCount = await db.insurer.count({ where })

  // 4. Fetch insurers with pagination and counts
  const skip = (page - 1) * limit

  const insurers = await db.insurer.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          policies: true,
        },
      },
    },
  })

  // 5. Transform to DTO
  const insurerDtos: InsurerListItemDto[] = insurers.map((i) => ({
    id: i.id,
    name: i.name,
    code: i.code,
    email: i.email,
    phone: i.phone,
    isActive: i.isActive,
    policyCount: i._count.policies,
    createdAt: i.createdAt.toISOString(),
  }))

  logger.info({ totalCount, returned: insurerDtos.length }, 'Insurers listed successfully')

  return {
    insurers: insurerDtos,
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
