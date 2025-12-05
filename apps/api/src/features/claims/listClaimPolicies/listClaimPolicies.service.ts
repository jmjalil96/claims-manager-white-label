/**
 * Service layer for listing claim policies
 * Contains business logic
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import type { ListClaimPoliciesResponse, PolicyDto } from './listClaimPolicies.dto.js'

const logger = createLogger('claims:listClaimPolicies')

/**
 * List all policies for a claim's client
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param claimId - Claim ID
 * @returns List of policies
 */
export async function listClaimPolicies(claimId: string): Promise<ListClaimPoliciesResponse> {
  logger.info({ claimId }, 'Listing policies for claim')

  // 1. Verify claim exists and get clientId
  const claim = await db.claim.findUnique({
    where: { id: claimId },
    select: { id: true, clientId: true },
  })

  if (!claim) {
    logger.warn({ claimId }, 'Claim not found')
    throw AppError.notFound('Reclamo')
  }

  // 2. Fetch all policies for the client
  const policies = await db.policy.findMany({
    where: {
      clientId: claim.clientId,
    },
    include: {
      insurer: {
        select: { id: true, name: true },
      },
    },
    orderBy: { policyNumber: 'asc' },
  })

  // 3. Transform to DTO
  const policyDtos: PolicyDto[] = policies.map((policy) => ({
    id: policy.id,
    policyNumber: policy.policyNumber,
    type: policy.type,
    status: policy.status,
    startDate: policy.startDate.toISOString(),
    endDate: policy.endDate.toISOString(),
    insurer: {
      id: policy.insurer.id,
      name: policy.insurer.name,
    },
  }))

  logger.info({ claimId, count: policyDtos.length }, 'Policies listed successfully')

  return { policies: policyDtos }
}
