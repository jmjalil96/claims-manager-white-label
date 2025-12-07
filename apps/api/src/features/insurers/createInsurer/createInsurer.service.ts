/**
 * Service layer for creating an insurer
 * Contains business logic and validation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { CreateInsurerInput } from './createInsurer.schema.js'
import type { CreateInsurerResponse, CreateInsurerResponseDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('insurers:createInsurer')

/**
 * Create a new insurer
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * @param input - Validated request body
 * @param user - Authenticated user context
 * @returns Created insurer
 */
export async function createInsurer(
  input: CreateInsurerInput,
  user: AuthUser
): Promise<CreateInsurerResponse> {
  const { name, code, email, phone, website, taxRate } = input

  logger.info({ userId: user.id, name }, 'Creating insurer')

  // 1. Validate name uniqueness
  const existingName = await db.insurer.findUnique({
    where: { name },
    select: { id: true },
  })

  if (existingName) {
    logger.warn({ name, userId: user.id }, 'Insurer with name already exists')
    throw AppError.conflict('Ya existe una aseguradora con este nombre')
  }

  // 2. Validate code uniqueness if provided
  if (code) {
    const existingCode = await db.insurer.findUnique({
      where: { code },
      select: { id: true },
    })

    if (existingCode) {
      logger.warn({ code, userId: user.id }, 'Insurer with code already exists')
      throw AppError.conflict('Ya existe una aseguradora con este código')
    }
  }

  // 3. Create insurer
  const insurer = await db.insurer.create({
    data: {
      name,
      code: code ?? null,
      email: email ?? null,
      phone: phone ?? null,
      website: website ?? null,
      taxRate: taxRate ?? null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      website: true,
      taxRate: true,
      isActive: true,
      createdAt: true,
    },
  })

  // 4. Audit log
  audit({
    action: 'CREATE',
    resourceType: 'Insurer',
    resourceId: insurer.id,
    userId: user.id,
    metadata: { name, code },
  })

  logger.info({ insurerId: insurer.id, name }, 'Insurer created successfully')

  // 5. Transform to DTO
  const insurerDto: CreateInsurerResponseDto = {
    id: insurer.id,
    name: insurer.name,
    code: insurer.code,
    email: insurer.email,
    phone: insurer.phone,
    website: insurer.website,
    taxRate: insurer.taxRate,
    isActive: insurer.isActive,
    createdAt: insurer.createdAt.toISOString(),
  }

  return { insurer: insurerDto }
}
