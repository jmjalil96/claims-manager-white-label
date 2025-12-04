/**
 * Service layer for kanban claims view
 * Returns claims grouped by all statuses in a single call
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { ClaimStatus } from '@claims/shared'
import type { KanbanClaimsInput } from './kanbanClaims.schema.js'
import type { KanbanClaimsResponse, KanbanColumnDto, ClaimListItemDto } from './kanbanClaims.dto.js'
import type { Prisma, ClaimStatus as PrismaClaimStatus } from '@prisma/client'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('claims:kanbanClaims')

/** All statuses in display order for the Kanban board */
const KANBAN_STATUS_ORDER: PrismaClaimStatus[] = [
  'DRAFT',
  'VALIDATION',
  'SUBMITTED',
  'PENDING_INFO',
  'RETURNED',
  'SETTLED',
  'CANCELLED',
]

/** Select clause for claim list items (reused from listClaims) */
const CLAIM_LIST_SELECT = {
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
  client: { select: { name: true } },
  affiliate: { select: { firstName: true, lastName: true } },
  patient: { select: { firstName: true, lastName: true } },
  policy: { select: { policyNumber: true } },
} as const

/**
 * Get claims in kanban format - grouped by status
 *
 * Authorization matrix (same as listClaims):
 * - Internal roles: Full access to all claims
 * - External roles with client access: Claims for accessible clients only
 * - Affiliates (client_affiliate): Only claims where they are the affiliate
 *
 * @param input - Validated query parameters
 * @param user - Authenticated user context
 * @returns Claims grouped by status with counts
 */
export async function getKanbanClaims(
  input: KanbanClaimsInput,
  user: AuthUser
): Promise<KanbanClaimsResponse> {
  const {
    clientId,
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
    limitPerColumn,
    expandStatus,
    expandLimit,
  } = input

  logger.info({ userId: user.id, filters: input }, 'Getting kanban claims')

  // Build base where clause (without status - we query all statuses)
  const baseWhere: Prisma.ClaimWhereInput = {}

  // 1. Authorization scoping (same as listClaims)
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
      baseWhere.affiliateId = affiliate.id
    } else {
      // External roles: scope to accessible clients
      const accessibleClients = await db.userClient.findMany({
        where: { userId: user.id, isActive: true },
        select: { clientId: true },
      })
      const accessibleClientIds = accessibleClients.map((uc) => uc.clientId)

      if (accessibleClientIds.length === 0) {
        // No access - return empty columns
        return buildEmptyResponse()
      }

      baseWhere.clientId = { in: accessibleClientIds }
    }
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

  if (careType?.length) baseWhere.careType = { in: careType }
  if (affiliateId) baseWhere.affiliateId = affiliateId
  if (patientId) baseWhere.patientId = patientId
  if (policyId) baseWhere.policyId = policyId
  if (createdById) baseWhere.createdById = createdById

  // Date filters (inclusive both ends)
  if (incidentDateFrom || incidentDateTo) {
    baseWhere.incidentDate = {
      ...(incidentDateFrom && { gte: new Date(incidentDateFrom) }),
      ...(incidentDateTo && { lte: new Date(incidentDateTo) }),
    }
  }
  if (submittedDateFrom || submittedDateTo) {
    baseWhere.submittedDate = {
      ...(submittedDateFrom && { gte: new Date(submittedDateFrom) }),
      ...(submittedDateTo && { lte: new Date(submittedDateTo) }),
    }
  }
  if (settlementDateFrom || settlementDateTo) {
    baseWhere.settlementDate = {
      ...(settlementDateFrom && { gte: new Date(settlementDateFrom) }),
      ...(settlementDateTo && { lte: new Date(settlementDateTo) }),
    }
  }
  if (createdAtFrom || createdAtTo) {
    baseWhere.createdAt = {
      ...(createdAtFrom && { gte: new Date(createdAtFrom) }),
      ...(createdAtTo && { lte: endOfDay(new Date(createdAtTo)) }),
    }
  }

  // 3. Search (contains + OR across multiple fields)
  if (search) {
    const searchTerm = search.trim()
    baseWhere.OR = [
      { claimNumber: { contains: searchTerm, mode: 'insensitive' } },
      { patient: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
      { patient: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
      { affiliate: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
      { affiliate: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
      { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ]
  }

  // 4. Get counts per status (single query)
  const statusCounts = await db.claim.groupBy({
    by: ['status'],
    where: baseWhere,
    _count: true,
  })

  // Create count map
  const countMap = new Map<PrismaClaimStatus, number>()
  for (const sc of statusCounts) {
    countMap.set(sc.status, sc._count)
  }

  // 5. Get claims per status (parallel queries with per-column take)
  const claimsPerStatus = await Promise.all(
    KANBAN_STATUS_ORDER.map((status) => {
      const take =
        expandStatus === status && expandLimit ? expandLimit : limitPerColumn
      return db.claim.findMany({
        where: { ...baseWhere, status },
        orderBy: { createdAt: 'desc' },
        take,
        select: CLAIM_LIST_SELECT,
      })
    })
  )

  // 6. Build response
  const columns = {} as Record<PrismaClaimStatus, KanbanColumnDto>

  for (let i = 0; i < KANBAN_STATUS_ORDER.length; i++) {
    const status = KANBAN_STATUS_ORDER[i]!
    const claims = claimsPerStatus[i]!
    const totalCount = countMap.get(status) ?? 0

    columns[status] = {
      status: status as unknown as (typeof ClaimStatus)[keyof typeof ClaimStatus],
      count: totalCount,
      claims: claims.map(toClaimListItemDto),
      hasMore: totalCount > claims.length,
    }
  }

  const totalCount = statusCounts.reduce((sum, sc) => sum + sc._count, 0)
  logger.info(
    { totalCount, columnsReturned: KANBAN_STATUS_ORDER.length },
    'Kanban claims retrieved'
  )

  return { columns }
}

/**
 * Build empty response with all columns having zero counts
 */
function buildEmptyResponse(): KanbanClaimsResponse {
  const columns = {} as Record<PrismaClaimStatus, KanbanColumnDto>

  for (const status of KANBAN_STATUS_ORDER) {
    columns[status] = {
      status: status as unknown as (typeof ClaimStatus)[keyof typeof ClaimStatus],
      count: 0,
      claims: [],
      hasMore: false,
    }
  }

  return { columns }
}

/**
 * Transform database claim to DTO
 */
function toClaimListItemDto(c: {
  id: string
  claimNumber: string
  claimSequence: number
  status: PrismaClaimStatus
  careType: string | null
  description: string | null
  clientId: string
  affiliateId: string
  patientId: string
  policyId: string | null
  amountSubmitted: number | null
  amountApproved: number | null
  incidentDate: Date | null
  submittedDate: Date | null
  settlementDate: Date | null
  createdAt: Date
  client: { name: string }
  affiliate: { firstName: string; lastName: string }
  patient: { firstName: string; lastName: string }
  policy: { policyNumber: string } | null
}): ClaimListItemDto {
  return {
    id: c.id,
    claimNumber: c.claimNumber,
    claimSequence: c.claimSequence,
    status: c.status as unknown as (typeof ClaimStatus)[keyof typeof ClaimStatus],
    careType: c.careType as ClaimListItemDto['careType'],
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
