/**
 * Service layer for editing a client
 * Contains business logic and authorization
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit, diff } from '../../../lib/audit.js'
import { isInternalRole } from '../../../lib/constants.js'
import type { EditClientBody } from './editClient.schema.js'
import type { UpdateClientResponse, UpdateClientResponseDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('clients:editClient')

/**
 * Edit an existing client
 *
 * Authorization matrix:
 * - Internal roles: Can edit any client, including isActive
 * - client_admin: Can only edit clients they have access to, cannot change isActive
 * - Other external roles: 403
 *
 * @param id - Client ID
 * @param input - Validated request body
 * @param user - Authenticated user context
 * @returns Updated client
 */
export async function editClient(
  id: string,
  input: EditClientBody,
  user: AuthUser
): Promise<UpdateClientResponse> {
  logger.info({ clientId: id, userId: user.id, updates: Object.keys(input) }, 'Editing client')

  // 1. Fetch existing client
  const existingClient = await db.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
    },
  })

  if (!existingClient) {
    logger.warn({ clientId: id, userId: user.id }, 'Client not found')
    throw AppError.notFound('Cliente')
  }

  // 2. Authorization check
  const hasInternalRole = isInternalRole(user.role)

  if (!hasInternalRole) {
    // Only client_admin can edit
    if (user.role !== 'client_admin') {
      logger.warn({ clientId: id, userId: user.id, role: user.role }, 'Edit access denied - wrong role')
      throw AppError.forbidden('Solo administradores de cliente pueden editar')
    }

    // Must have UserClient access
    const access = await db.userClient.findUnique({
      where: {
        userId_clientId: { userId: user.id, clientId: id },
        isActive: true,
      },
    })

    if (!access) {
      logger.warn({ clientId: id, userId: user.id }, 'Edit access denied - no client access')
      throw AppError.forbidden('Sin acceso a este cliente')
    }

    // client_admin cannot change isActive
    if (input.isActive !== undefined) {
      logger.warn({ clientId: id, userId: user.id }, 'client_admin cannot change isActive')
      throw AppError.forbidden('No tiene permiso para cambiar el estado activo del cliente')
    }
  }

  // 3. Validate taxId uniqueness if changing
  if (input.taxId && input.taxId !== existingClient.taxId) {
    const duplicateTaxId = await db.client.findFirst({
      where: { taxId: input.taxId, id: { not: id } },
      select: { id: true },
    })

    if (duplicateTaxId) {
      logger.warn({ taxId: input.taxId, userId: user.id }, 'Duplicate taxId')
      throw AppError.conflict('Ya existe un cliente con este NIT/RUC')
    }
  }

  // 4. Build update data
  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.taxId !== undefined) updateData.taxId = input.taxId
  if (input.email !== undefined) updateData.email = input.email
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.address !== undefined) updateData.address = input.address
  if (input.isActive !== undefined) updateData.isActive = input.isActive

  // 5. Update client
  const updatedClient = await db.client.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
      updatedAt: true,
    },
  })

  // 6. Audit log
  audit({
    action: 'UPDATE',
    resourceType: 'Client',
    resourceId: id,
    userId: user.id,
    changes: diff(existingClient, updateData),
    metadata: { name: updatedClient.name, taxId: updatedClient.taxId },
  })

  logger.info({ clientId: id }, 'Client updated successfully')

  // 7. Transform to DTO
  const clientDto: UpdateClientResponseDto = {
    id: updatedClient.id,
    name: updatedClient.name,
    taxId: updatedClient.taxId,
    email: updatedClient.email,
    phone: updatedClient.phone,
    address: updatedClient.address,
    isActive: updatedClient.isActive,
    updatedAt: updatedClient.updatedAt.toISOString(),
  }

  return { client: clientDto }
}
