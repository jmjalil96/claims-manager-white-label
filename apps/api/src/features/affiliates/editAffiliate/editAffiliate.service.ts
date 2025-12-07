/**
 * Service layer for editing an affiliate
 * Contains business logic and validation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit, diff } from '../../../lib/audit.js'
import type { EditAffiliateBody } from './editAffiliate.schema.js'
import type { UpdateAffiliateResponse, UpdateAffiliateResponseDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'
import type { Gender, MaritalStatus, DependentRelationship } from '@prisma/client'

const logger = createLogger('affiliates:editAffiliate')

/**
 * Update an existing affiliate
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * Restrictions:
 * - Cannot change clientId
 * - Cannot change primaryAffiliateId (conversion blocked)
 * - Can only update relationship for dependents
 *
 * @param id - Affiliate ID
 * @param input - Validated request body
 * @param user - Authenticated user context
 * @returns Updated affiliate
 */
export async function editAffiliate(
  id: string,
  input: EditAffiliateBody,
  user: AuthUser
): Promise<UpdateAffiliateResponse> {
  logger.info({ userId: user.id, affiliateId: id }, 'Editing affiliate')

  // 1. Fetch existing affiliate
  const existing = await db.affiliate.findUnique({
    where: { id },
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
      maritalStatus: true,
      primaryAffiliateId: true,
      relationship: true,
      clientId: true,
      isActive: true,
    },
  })

  if (!existing) {
    throw AppError.notFound('Afiliado')
  }

  const isOwner = existing.primaryAffiliateId === null

  // 2. Validate relationship changes
  if (input.relationship !== undefined) {
    if (isOwner) {
      throw AppError.badRequest('No se puede establecer relación para un titular')
    }

    if (input.relationship === null) {
      throw AppError.badRequest('No se puede eliminar la relación de un dependiente')
    }
  }

  // 3. Build update data
  const updateData: Record<string, unknown> = {}

  if (input.firstName !== undefined) updateData.firstName = input.firstName
  if (input.lastName !== undefined) updateData.lastName = input.lastName
  if (input.documentType !== undefined) updateData.documentType = input.documentType
  if (input.documentNumber !== undefined) updateData.documentNumber = input.documentNumber
  if (input.email !== undefined) updateData.email = input.email
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.dateOfBirth !== undefined) {
    updateData.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null
  }
  if (input.gender !== undefined) updateData.gender = input.gender as Gender | null
  if (input.maritalStatus !== undefined) {
    updateData.maritalStatus = input.maritalStatus as MaritalStatus | null
  }
  if (input.relationship !== undefined) {
    updateData.relationship = input.relationship as DependentRelationship | null
  }
  if (input.isActive !== undefined) updateData.isActive = input.isActive

  // 4. Update affiliate
  const affiliate = await db.affiliate.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      phone: true,
      primaryAffiliateId: true,
      relationship: true,
      isActive: true,
      updatedAt: true,
    },
  })

  // 5. Audit log with diff
  const changes = diff(
    {
      firstName: existing.firstName,
      lastName: existing.lastName,
      documentType: existing.documentType,
      documentNumber: existing.documentNumber,
      email: existing.email,
      phone: existing.phone,
      dateOfBirth: existing.dateOfBirth?.toISOString() ?? null,
      gender: existing.gender,
      maritalStatus: existing.maritalStatus,
      relationship: existing.relationship,
      isActive: existing.isActive,
    },
    {
      firstName: affiliate.firstName,
      lastName: affiliate.lastName,
      documentType: affiliate.documentType,
      documentNumber: affiliate.documentNumber,
      email: affiliate.email,
      phone: affiliate.phone,
      dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : (existing.dateOfBirth?.toISOString() ?? null),
      gender: input.gender !== undefined ? input.gender : existing.gender,
      maritalStatus: input.maritalStatus !== undefined ? input.maritalStatus : existing.maritalStatus,
      relationship: affiliate.relationship,
      isActive: affiliate.isActive,
    }
  )

  audit({
    action: 'UPDATE',
    resourceType: 'Affiliate',
    resourceId: affiliate.id,
    userId: user.id,
    clientId: existing.clientId,
    changes,
    metadata: { firstName: affiliate.firstName, lastName: affiliate.lastName },
  })

  logger.info({ affiliateId: id }, 'Affiliate updated successfully')

  // 6. Transform to DTO
  const affiliateDto: UpdateAffiliateResponseDto = {
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    email: affiliate.email,
    phone: affiliate.phone,
    isOwner: affiliate.primaryAffiliateId === null,
    relationship: affiliate.relationship,
    isActive: affiliate.isActive,
    updatedAt: affiliate.updatedAt.toISOString(),
  }

  return { affiliate: affiliateDto }
}
