/**
 * Service layer for editing an insurer
 * Contains business logic
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit, diff } from '../../../lib/audit.js'
import type { EditInsurerBody } from './editInsurer.schema.js'
import type { UpdateInsurerResponse, UpdateInsurerResponseDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('insurers:editInsurer')

/**
 * Edit an existing insurer
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * @param id - Insurer ID
 * @param input - Validated request body
 * @param user - Authenticated user context
 * @returns Updated insurer
 */
export async function editInsurer(
  id: string,
  input: EditInsurerBody,
  user: AuthUser
): Promise<UpdateInsurerResponse> {
  logger.info({ insurerId: id, userId: user.id, updates: Object.keys(input) }, 'Editing insurer')

  // 1. Fetch existing insurer
  const existingInsurer = await db.insurer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      website: true,
      taxRate: true,
      isActive: true,
    },
  })

  if (!existingInsurer) {
    logger.warn({ insurerId: id, userId: user.id }, 'Insurer not found')
    throw AppError.notFound('Aseguradora')
  }

  // 2. Validate name uniqueness if changing
  if (input.name && input.name !== existingInsurer.name) {
    const duplicateName = await db.insurer.findFirst({
      where: { name: input.name, id: { not: id } },
      select: { id: true },
    })

    if (duplicateName) {
      logger.warn({ name: input.name, userId: user.id }, 'Duplicate name')
      throw AppError.conflict('Ya existe una aseguradora con este nombre')
    }
  }

  // 3. Validate code uniqueness if changing
  if (input.code && input.code !== existingInsurer.code) {
    const duplicateCode = await db.insurer.findFirst({
      where: { code: input.code, id: { not: id } },
      select: { id: true },
    })

    if (duplicateCode) {
      logger.warn({ code: input.code, userId: user.id }, 'Duplicate code')
      throw AppError.conflict('Ya existe una aseguradora con este código')
    }
  }

  // 4. Build update data
  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.code !== undefined) updateData.code = input.code
  if (input.email !== undefined) updateData.email = input.email
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.website !== undefined) updateData.website = input.website
  if (input.taxRate !== undefined) updateData.taxRate = input.taxRate
  if (input.isActive !== undefined) updateData.isActive = input.isActive

  // 5. Update insurer
  const updatedInsurer = await db.insurer.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      code: true,
      email: true,
      phone: true,
      website: true,
      taxRate: true,
      isActive: true,
      updatedAt: true,
    },
  })

  // 6. Audit log
  audit({
    action: 'UPDATE',
    resourceType: 'Insurer',
    resourceId: id,
    userId: user.id,
    changes: diff(existingInsurer, updateData),
    metadata: { name: updatedInsurer.name, code: updatedInsurer.code },
  })

  logger.info({ insurerId: id }, 'Insurer updated successfully')

  // 7. Transform to DTO
  const insurerDto: UpdateInsurerResponseDto = {
    id: updatedInsurer.id,
    name: updatedInsurer.name,
    code: updatedInsurer.code,
    email: updatedInsurer.email,
    phone: updatedInsurer.phone,
    website: updatedInsurer.website,
    taxRate: updatedInsurer.taxRate,
    isActive: updatedInsurer.isActive,
    updatedAt: updatedInsurer.updatedAt.toISOString(),
  }

  return { insurer: insurerDto }
}
