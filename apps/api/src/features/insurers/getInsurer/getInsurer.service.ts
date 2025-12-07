/**
 * Service layer for getting a single insurer
 * Contains business logic
 */

import { db } from '../../../lib/db.js'
import { AppError } from '../../../lib/errors.js'
import { createLogger } from '../../../lib/logger.js'
import type { GetInsurerResponse, InsurerDetailDto } from '@claims/shared'
import type { AuthUser } from '../../../middleware/auth.js'

const logger = createLogger('insurers:getInsurer')

/**
 * Get a single insurer by ID
 *
 * Authorization: Superadmin only (enforced by middleware)
 *
 * @param id - Insurer ID
 * @param user - Authenticated user context
 * @returns Insurer detail
 */
export async function getInsurer(
  id: string,
  user: AuthUser
): Promise<GetInsurerResponse> {
  logger.info({ insurerId: id, userId: user.id }, 'Getting insurer')

  // 1. Fetch insurer with counts
  const insurer = await db.insurer.findUnique({
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
      createdAt: true,
      updatedAt: true,
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

  // 2. Transform to DTO
  const insurerDto: InsurerDetailDto = {
    id: insurer.id,
    name: insurer.name,
    code: insurer.code,
    email: insurer.email,
    phone: insurer.phone,
    website: insurer.website,
    taxRate: insurer.taxRate,
    isActive: insurer.isActive,
    policyCount: insurer._count.policies,
    invoiceCount: insurer._count.invoices,
    createdAt: insurer.createdAt.toISOString(),
    updatedAt: insurer.updatedAt.toISOString(),
  }

  logger.info({ insurerId: id }, 'Insurer retrieved successfully')

  return { insurer: insurerDto }
}
