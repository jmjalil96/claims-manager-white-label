/**
 * Service layer for deleting a client
 * Contains business logic and validation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { DeleteClientResponse } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('clients:deleteClient')

/**
 * Delete a client (hard delete)
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * Checks for related records before deletion:
 * - Policies
 * - Affiliates
 * - Claims
 * - Invoices
 *
 * @param id - Client ID
 * @param user - Authenticated user context
 * @returns Deleted client info
 */
export async function deleteClient(
  id: string,
  user: AuthUser
): Promise<DeleteClientResponse> {
  logger.info({ clientId: id, userId: user.id }, 'Deleting client')

  // 1. Check if client exists
  const client = await db.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      taxId: true,
      _count: {
        select: {
          policies: true,
          affiliates: true,
          claims: true,
          invoices: true,
        },
      },
    },
  })

  if (!client) {
    logger.warn({ clientId: id, userId: user.id }, 'Client not found')
    throw AppError.notFound('Cliente')
  }

  // 2. Check for related records
  const relatedRecords = []
  if (client._count.policies > 0) relatedRecords.push(`${client._count.policies} póliza(s)`)
  if (client._count.affiliates > 0) relatedRecords.push(`${client._count.affiliates} afiliado(s)`)
  if (client._count.claims > 0) relatedRecords.push(`${client._count.claims} reclamo(s)`)
  if (client._count.invoices > 0) relatedRecords.push(`${client._count.invoices} factura(s)`)

  if (relatedRecords.length > 0) {
    logger.warn({ clientId: id, userId: user.id, relatedRecords }, 'Cannot delete client with related records')
    throw AppError.conflict(
      `No se puede eliminar el cliente porque tiene registros relacionados: ${relatedRecords.join(', ')}`
    )
  }

  // 3. Delete UserClient records first (cascade would handle this but being explicit)
  await db.userClient.deleteMany({
    where: { clientId: id },
  })

  // 4. Delete client
  await db.client.delete({
    where: { id },
  })

  // 5. Audit log
  audit({
    action: 'DELETE',
    resourceType: 'Client',
    resourceId: id,
    userId: user.id,
    metadata: { name: client.name, taxId: client.taxId },
  })

  logger.info({ clientId: id, name: client.name }, 'Client deleted successfully')

  return { deleted: { id } }
}
