/**
 * Service layer for deleting an insurer
 * Contains business logic and validation
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import { audit } from '../../../lib/audit.js'
import type { DeleteInsurerResponse } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('insurers:deleteInsurer')

/**
 * Delete an insurer (hard delete)
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * Checks for related records before deletion:
 * - Policies
 * - Invoices
 *
 * @param id - Insurer ID
 * @param user - Authenticated user context
 * @returns Deleted insurer info
 */
export async function deleteInsurer(
  id: string,
  user: AuthUser
): Promise<DeleteInsurerResponse> {
  logger.info({ insurerId: id, userId: user.id }, 'Deleting insurer')

  // 1. Check if insurer exists
  const insurer = await db.insurer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      _count: {
        select: {
          policies: true,
          invoices: true,
        },
      },
    },
  })

  if (!insurer) {
    logger.warn({ insurerId: id, userId: user.id }, 'Insurer not found')
    throw AppError.notFound('Aseguradora')
  }

  // 2. Check for related records
  const relatedRecords = []
  if (insurer._count.policies > 0) relatedRecords.push(`${insurer._count.policies} póliza(s)`)
  if (insurer._count.invoices > 0) relatedRecords.push(`${insurer._count.invoices} factura(s)`)

  if (relatedRecords.length > 0) {
    logger.warn({ insurerId: id, userId: user.id, relatedRecords }, 'Cannot delete insurer with related records')
    throw AppError.conflict(
      `No se puede eliminar la aseguradora porque tiene registros relacionados: ${relatedRecords.join(', ')}`
    )
  }

  // 3. Delete InsurerFile records first
  await db.insurerFile.deleteMany({
    where: { insurerId: id },
  })

  // 4. Delete insurer
  await db.insurer.delete({
    where: { id },
  })

  // 5. Audit log
  audit({
    action: 'DELETE',
    resourceType: 'Insurer',
    resourceId: id,
    userId: user.id,
    metadata: { name: insurer.name, code: insurer.code },
  })

  logger.info({ insurerId: id, name: insurer.name }, 'Insurer deleted successfully')

  return { deleted: { id } }
}
