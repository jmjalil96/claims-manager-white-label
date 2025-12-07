/**
 * Service layer for creating a client
 * Contains business logic and validation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { CreateClientInput } from './createClient.schema.js'
import type { CreateClientResponse, CreateClientResponseDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('clients:createClient')

/**
 * Create a new client
 *
 * Authorization: Internal roles only (enforced by middleware)
 *
 * @param input - Validated request body
 * @param user - Authenticated user context
 * @returns Created client
 */
export async function createClient(
  input: CreateClientInput,
  user: AuthUser
): Promise<CreateClientResponse> {
  const { name, taxId, email, phone, address } = input

  logger.info({ userId: user.id, taxId }, 'Creating client')

  // 1. Validate taxId uniqueness
  const existingClient = await db.client.findUnique({
    where: { taxId },
    select: { id: true },
  })

  if (existingClient) {
    logger.warn({ taxId, userId: user.id }, 'Client with taxId already exists')
    throw AppError.conflict('Ya existe un cliente con este NIT/RUC')
  }

  // 2. Create client
  const client = await db.client.create({
    data: {
      name,
      taxId,
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      taxId: true,
      email: true,
      phone: true,
      address: true,
      isActive: true,
      createdAt: true,
    },
  })

  // 3. Audit log
  audit({
    action: 'CREATE',
    resourceType: 'Client',
    resourceId: client.id,
    userId: user.id,
    metadata: { name, taxId },
  })

  logger.info({ clientId: client.id, taxId }, 'Client created successfully')

  // 4. Transform to DTO
  const clientDto: CreateClientResponseDto = {
    id: client.id,
    name: client.name,
    taxId: client.taxId,
    email: client.email,
    phone: client.phone,
    address: client.address,
    isActive: client.isActive,
    createdAt: client.createdAt.toISOString(),
  }

  return { client: clientDto }
}
