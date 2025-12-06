/**
 * Service layer for creating policies
 * Contains business logic and validation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { CreatePolicyInput } from './createPolicy.schema.js'
import type { CreatePolicyResponseDto } from './createPolicy.dto.js'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('policies:createPolicy')

/**
 * Create a new policy
 *
 * Authorization: Internal roles only (broker employees)
 * - Enforced by requireInternalRole middleware
 *
 * @param input - Validated policy input data
 * @param user - Authenticated user context
 * @returns Created policy data
 * @throws AppError for validation failures
 */
export async function createPolicy(
  input: CreatePolicyInput,
  user: AuthUser
): Promise<CreatePolicyResponseDto> {
  const { policyNumber, clientId, insurerId, startDate, endDate, type, ...optionalFields } = input

  logger.info({ policyNumber, clientId, insurerId, userId: user.id }, 'Creating new policy')

  // 1. Validate client exists and is active
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, isActive: true },
  })

  if (!client) {
    throw AppError.notFound('Cliente')
  }

  if (!client.isActive) {
    throw AppError.badRequest('El cliente no está activo')
  }

  // 2. Validate insurer exists and is active
  const insurer = await db.insurer.findUnique({
    where: { id: insurerId },
    select: { id: true, isActive: true },
  })

  if (!insurer) {
    throw AppError.notFound('Aseguradora')
  }

  if (!insurer.isActive) {
    throw AppError.badRequest('La aseguradora no está activa')
  }

  // 3. Check policyNumber + insurerId uniqueness
  const existingPolicy = await db.policy.findUnique({
    where: {
      policyNumber_insurerId: { policyNumber, insurerId },
    },
    select: { id: true },
  })

  if (existingPolicy) {
    throw AppError.conflict('Ya existe una póliza con este número para esta aseguradora')
  }

  // 4. Validate dates
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (end < start) {
    throw AppError.badRequest('La fecha de fin debe ser igual o posterior a la fecha de inicio')
  }

  // 5. Create the policy (starts in PENDING, must be activated)
  const policy = await db.policy.create({
    data: {
      policyNumber,
      clientId,
      insurerId,
      type,
      status: 'PENDING',
      startDate: start,
      endDate: end,
      ambCopay: optionalFields.ambCopay,
      hospCopay: optionalFields.hospCopay,
      maternity: optionalFields.maternity,
      tPremium: optionalFields.tPremium,
      tplus1Premium: optionalFields.tplus1Premium,
      tplusfPremium: optionalFields.tplusfPremium,
      benefitsCost: optionalFields.benefitsCost,
      isActive: true,
    },
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
    },
  })

  logger.info({ policyId: policy.id, policyNumber: policy.policyNumber }, 'Policy created successfully')

  audit({
    action: 'CREATE',
    resourceType: 'Policy',
    resourceId: policy.id,
    userId: user.id,
    clientId: policy.clientId,
    metadata: { policyNumber: policy.policyNumber, insurerId: policy.insurerId },
  })

  return {
    id: policy.id,
    policyNumber: policy.policyNumber,
    clientId: policy.clientId,
    insurerId: policy.insurerId,
    type: policy.type,
    status: policy.status,
    startDate: policy.startDate.toISOString(),
    endDate: policy.endDate.toISOString(),
    isActive: policy.isActive,
    createdAt: policy.createdAt.toISOString(),
  }
}
