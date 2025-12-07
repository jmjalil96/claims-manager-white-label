/**
 * Service layer for creating an affiliate
 * Contains business logic and validation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { CreateAffiliateInput } from './createAffiliate.schema.js'
import type { CreateAffiliateResponse, CreateAffiliateResponseDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'
import type { Gender, MaritalStatus, DependentRelationship } from '@prisma/client'

const logger = createLogger('affiliates:createAffiliate')

/**
 * Create a new affiliate (owner or dependent)
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param input - Validated request body
 * @param user - Authenticated user context
 * @returns Created affiliate
 */
export async function createAffiliate(
  input: CreateAffiliateInput,
  user: AuthUser
): Promise<CreateAffiliateResponse> {
  const {
    clientId,
    firstName,
    lastName,
    documentType,
    documentNumber,
    email,
    phone,
    dateOfBirth,
    gender,
    maritalStatus,
    primaryAffiliateId,
    relationship,
  } = input

  const isDependent = !!primaryAffiliateId

  logger.info(
    { userId: user.id, clientId, isDependent, primaryAffiliateId },
    'Creating affiliate'
  )

  // 1. Validate client exists
  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, isActive: true },
  })

  if (!client) {
    throw AppError.notFound('Cliente')
  }

  if (!client.isActive) {
    throw AppError.badRequest('El cliente está inactivo')
  }

  // 2. If creating a dependent, validate primary affiliate
  if (primaryAffiliateId) {
    const primaryAffiliate = await db.affiliate.findUnique({
      where: { id: primaryAffiliateId },
      select: {
        id: true,
        clientId: true,
        primaryAffiliateId: true,
        isActive: true,
      },
    })

    if (!primaryAffiliate) {
      throw AppError.notFound('Titular')
    }

    // Must belong to same client
    if (primaryAffiliate.clientId !== clientId) {
      throw AppError.badRequest('El titular debe pertenecer al mismo cliente')
    }

    // Primary affiliate must be an owner (not a dependent)
    if (primaryAffiliate.primaryAffiliateId !== null) {
      throw AppError.badRequest('El titular no puede ser un dependiente')
    }

    if (!primaryAffiliate.isActive) {
      throw AppError.badRequest('El titular está inactivo')
    }
  }

  // 3. Create affiliate
  const affiliate = await db.affiliate.create({
    data: {
      clientId,
      firstName,
      lastName,
      documentType: documentType ?? null,
      documentNumber: documentNumber ?? null,
      email: email ?? null,
      phone: phone ?? null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: (gender as Gender) ?? null,
      maritalStatus: (maritalStatus as MaritalStatus) ?? null,
      primaryAffiliateId: primaryAffiliateId ?? null,
      relationship: (relationship as DependentRelationship) ?? null,
      isActive: true,
    },
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
      clientId: true,
      isActive: true,
      createdAt: true,
    },
  })

  // 4. Audit log
  audit({
    action: 'CREATE',
    resourceType: 'Affiliate',
    resourceId: affiliate.id,
    userId: user.id,
    clientId,
    metadata: {
      firstName,
      lastName,
      isDependent,
      primaryAffiliateId: primaryAffiliateId ?? undefined,
      relationship: relationship ?? undefined,
    },
  })

  logger.info(
    { affiliateId: affiliate.id, clientId, isDependent },
    'Affiliate created successfully'
  )

  // 5. Transform to DTO
  const affiliateDto: CreateAffiliateResponseDto = {
    id: affiliate.id,
    firstName: affiliate.firstName,
    lastName: affiliate.lastName,
    documentType: affiliate.documentType,
    documentNumber: affiliate.documentNumber,
    email: affiliate.email,
    phone: affiliate.phone,
    isOwner: affiliate.primaryAffiliateId === null,
    relationship: affiliate.relationship,
    clientId: affiliate.clientId,
    isActive: affiliate.isActive,
    createdAt: affiliate.createdAt.toISOString(),
  }

  return { affiliate: affiliateDto }
}
