/**
 * Service layer for kanban policies
 * Groups policies by status for kanban view
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { KanbanPoliciesInput } from './kanbanPolicies.schema.js'
import type {
  KanbanPoliciesResponse,
  PolicyKanbanColumnDto,
  PolicyListItemDto,
} from './kanbanPolicies.dto.js'
import type { Prisma, PolicyStatus as PrismaPolicyStatus } from '@prisma/client'
import type { AuthUser } from '../../../middleware/auth.js'
import type { PolicyStatus } from '@claims/shared'

const logger = createLogger('policies:kanbanPolicies')

/**
 * Policy status order for kanban columns
 */
const KANBAN_STATUS_ORDER: PrismaPolicyStatus[] = ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']

/**
 * Fields to select for policy list items
 */
const POLICY_LIST_SELECT = {
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
  client: { select: { name: true } },
  insurer: { select: { name: true } },
} as const

/**
 * Get policies in kanban format - grouped by status
 *
 * Authorization matrix:
 * - Internal roles (broker employees): Full access
 * - Client admins/agents: Scoped to accessible clients
 * - Affiliates: No access to policies
 */
export async function getKanbanPolicies(
  input: KanbanPoliciesInput,
  user: AuthUser
): Promise<KanbanPoliciesResponse> {
  const {
    clientId,
    insurerId,
    type,
    isActive,
    startDateFrom,
    startDateTo,
    endDateFrom,
    endDateTo,
    createdAtFrom,
    createdAtTo,
    search,
    limitPerColumn = 10,
    expandStatus,
    expandLimit,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Getting kanban policies')

  // Build base where clause
  const baseWhere: Prisma.PolicyWhereInput = {}

  // 1. Authorization scoping
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
      return buildEmptyResponse()
    }

    baseWhere.clientId = { in: accessibleClientIds }
  }

  // 2. Apply filters
  if (clientId) {
    // Verify access if not internal
    if (!hasInternalRole && baseWhere.clientId) {
      const clientIdFilter = baseWhere.clientId as Prisma.StringFilter
      const allowedIds = 'in' in clientIdFilter ? clientIdFilter.in : []
      if (allowedIds && !allowedIds.includes(clientId)) {
        throw AppError.forbidden('Sin acceso a este cliente')
      }
    }
    baseWhere.clientId = clientId
  }

  if (insurerId) baseWhere.insurerId = insurerId
  if (type?.length) baseWhere.type = { in: type }
  if (isActive !== undefined) baseWhere.isActive = isActive

  // Date filters
  if (startDateFrom || startDateTo) {
    baseWhere.startDate = {
      ...(startDateFrom && { gte: new Date(startDateFrom) }),
      ...(startDateTo && { lte: new Date(startDateTo) }),
    }
  }
  if (endDateFrom || endDateTo) {
    baseWhere.endDate = {
      ...(endDateFrom && { gte: new Date(endDateFrom) }),
      ...(endDateTo && { lte: new Date(endDateTo) }),
    }
  }
  if (createdAtFrom || createdAtTo) {
    baseWhere.createdAt = {
      ...(createdAtFrom && { gte: new Date(createdAtFrom) }),
      ...(createdAtTo && { lte: endOfDay(new Date(createdAtTo)) }),
    }
  }

  // 3. Search
  if (search) {
    const searchTerm = search.trim()
    baseWhere.OR = [
      { policyNumber: { contains: searchTerm, mode: 'insensitive' } },
      { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { insurer: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ]
  }

  // 4. Get counts per status (single aggregation query)
  const statusCounts = await db.policy.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: true,
  })

  const countMap = new Map<PrismaPolicyStatus, number>()
  for (const row of statusCounts) {
    countMap.set(row.status, row._count)
  }

  // 5. Get policies per status (parallel queries)
  const policiesPerStatus = await Promise.all(
    KANBAN_STATUS_ORDER.map((status) => {
      const take = expandStatus === status && expandLimit ? expandLimit : limitPerColumn
      return db.policy.findMany({
        where: { ...baseWhere, status },
        orderBy: { createdAt: 'desc' },
        take,
        select: POLICY_LIST_SELECT,
      })
    })
  )

  // 6. Build response
  const columns = {} as Record<PrismaPolicyStatus, PolicyKanbanColumnDto>

  for (let i = 0; i < KANBAN_STATUS_ORDER.length; i++) {
    const status = KANBAN_STATUS_ORDER[i]!
    const policies = policiesPerStatus[i]!
    const totalCount = countMap.get(status) ?? 0

    columns[status] = {
      status: status as PolicyStatus,
      count: totalCount,
      policies: policies.map(toPolicyListItemDto),
      hasMore: totalCount > policies.length,
    }
  }

  logger.info(
    { counts: Object.fromEntries(countMap) },
    'Kanban policies retrieved successfully'
  )

  return { columns }
}

/**
 * Build empty response with all columns
 */
function buildEmptyResponse(): KanbanPoliciesResponse {
  const columns = {} as Record<PrismaPolicyStatus, PolicyKanbanColumnDto>
  for (const status of KANBAN_STATUS_ORDER) {
    columns[status] = {
      status: status as PolicyStatus,
      count: 0,
      policies: [],
      hasMore: false,
    }
  }
  return { columns }
}

/**
 * Transform database policy to DTO
 */
function toPolicyListItemDto(
  p: Prisma.PolicyGetPayload<{ select: typeof POLICY_LIST_SELECT }>
): PolicyListItemDto {
  return {
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
  }
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Get end of day for datetime inclusive filtering
 */
function endOfDay(date: Date): Date {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}
