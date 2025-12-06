/**
 * Service layer for getting claim SLA metrics
 * Calculates time spent in each status from audit logs
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { SLA_LIMITS } from '../../../lib/constants.js'
import { calculateBusinessDays } from '../../../utils/date.js'
import type { GetClaimSlaResponse, ClaimSlaStageDto, SlaIndicator } from './getClaimSla.dto.js'
import type { ClaimStatus } from '@claims/shared'

const logger = createLogger('claims:getClaimSla')

/**
 * Get SLA metrics for a claim by ID
 *
 * @param claimId - Claim ID
 * @returns SLA metrics with stage breakdown
 */
export async function getClaimSla(claimId: string): Promise<GetClaimSlaResponse> {
  logger.info({ claimId }, 'Getting claim SLA metrics')

  // 1. Fetch claim to verify existence and get basic info
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      claimNumber: true,
      status: true,
      createdAt: true,
    },
  })

  if (!claim) {
    logger.warn({ claimId }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Fetch STATUS_CHANGE audit logs ordered by time
  const auditLogs = await db.auditLog.findMany({
    where: {
      resourceType: 'Claim',
      resourceId: claimId,
      action: 'STATUS_CHANGE',
    },
    orderBy: { createdAt: 'asc' },
    select: {
      changes: true,
      createdAt: true,
    },
  })

  // 3. Build stage timeline
  const stages = buildStageTimeline(claim.createdAt, claim.status, auditLogs)

  // 4. Calculate totals
  const now = new Date()
  const totalCalendarDays = calculateCalendarDays(claim.createdAt, now)
  const totalBusinessDays = calculateBusinessDays(claim.createdAt, now)

  // 5. Get current status indicator
  const currentStage = stages[stages.length - 1]
  const currentIndicator = currentStage?.indicator ?? 'on_time'

  logger.info(
    {
      claimId,
      claimNumber: claim.claimNumber,
      currentStatus: claim.status,
      currentIndicator,
      stageCount: stages.length,
    },
    'Claim SLA metrics retrieved successfully'
  )

  return {
    claimId: claim.id,
    claimNumber: claim.claimNumber,
    currentStatus: claim.status,
    currentIndicator,
    stages,
    totalBusinessDays,
    totalCalendarDays,
  }
}

/**
 * Build stage timeline from audit logs
 */
function buildStageTimeline(
  claimCreatedAt: Date,
  currentStatus: string,
  auditLogs: Array<{ changes: unknown; createdAt: Date }>
): ClaimSlaStageDto[] {
  const stages: ClaimSlaStageDto[] = []
  const now = new Date()

  // Start with DRAFT stage from claim creation
  let currentStageStart = claimCreatedAt
  let currentStageStatus = 'DRAFT'

  for (const log of auditLogs) {
    const changes = log.changes as { after?: { status?: string } } | null
    const newStatus = changes?.after?.status

    if (newStatus && newStatus !== currentStageStatus) {
      // Close current stage
      stages.push(createStage(currentStageStatus as ClaimStatus, currentStageStart, log.createdAt))

      // Start new stage
      currentStageStart = log.createdAt
      currentStageStatus = newStatus
    }
  }

  // Add current (open) stage
  stages.push(createStage(currentStatus as ClaimStatus, currentStageStart, null, now))

  return stages
}

/**
 * Create a stage DTO
 */
function createStage(
  status: ClaimStatus,
  enteredAt: Date,
  exitedAt: Date | null,
  now: Date = new Date()
): ClaimSlaStageDto {
  const endDate = exitedAt ?? now
  const businessDays = calculateBusinessDays(enteredAt, endDate)
  const calendarDays = calculateCalendarDays(enteredAt, endDate)
  const limit = SLA_LIMITS[status] ?? null
  const indicator = getIndicator(businessDays, limit)

  return {
    status,
    enteredAt: enteredAt.toISOString(),
    exitedAt: exitedAt?.toISOString() ?? null,
    businessDays,
    calendarDays,
    limit,
    indicator,
  }
}

/**
 * Determine SLA indicator based on business days and limit
 */
function getIndicator(businessDays: number, limit: number | null): SlaIndicator {
  // Terminal statuses have no limit - always on time
  if (limit === null) {
    return 'on_time'
  }

  if (businessDays > limit) {
    return 'overdue'
  }

  if (businessDays === limit) {
    return 'at_risk'
  }

  return 'on_time'
}

/**
 * Calculate calendar days between two dates
 */
function calculateCalendarDays(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
