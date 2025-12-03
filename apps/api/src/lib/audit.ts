/**
 * Audit logging service
 * Fire-and-forget logging for tracking changes to resources
 */

import { db } from './db.js'
import { createLogger } from './logger.js'
import type { Request } from 'express'
import type { Prisma } from '@prisma/client'

const logger = createLogger('audit')

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'

interface AuditOptions {
  action: AuditAction
  resourceType: string
  resourceId: string
  userId: string
  clientId?: string
  changes?: { before?: Prisma.InputJsonValue; after?: Prisma.InputJsonValue } | null
  metadata?: Prisma.InputJsonObject
  req?: Request
}

/**
 * Log an audit event (fire-and-forget)
 * Does not block the response - errors are logged but not thrown
 */
export function audit(opts: AuditOptions): void {
  db.auditLog
    .create({
      data: {
        action: opts.action,
        resourceType: opts.resourceType,
        resourceId: opts.resourceId,
        userId: opts.userId,
        clientId: opts.clientId ?? null,
        changes: opts.changes ?? undefined,
        metadata: opts.metadata ?? undefined,
        ipAddress: opts.req?.ip ?? null,
        userAgent: opts.req?.get('user-agent') ?? null,
      },
    })
    .catch((err) => logger.error(err, 'Audit log failed'))
}

/**
 * Compute diff between before and after states
 * Returns only the changed fields, or null if nothing changed
 */
export function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): { before: Prisma.InputJsonValue; after: Prisma.InputJsonValue } | null {
  const changedBefore: Record<string, unknown> = {}
  const changedAfter: Record<string, unknown> = {}

  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) {
      changedBefore[key] = before[key]
      changedAfter[key] = after[key]
    }
  }

  if (Object.keys(changedAfter).length === 0) return null
  return {
    before: changedBefore as Prisma.InputJsonValue,
    after: changedAfter as Prisma.InputJsonValue,
  }
}
