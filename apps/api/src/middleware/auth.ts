import type { Request, Response, NextFunction } from 'express'
import { auth } from '../lib/auth.js'
import { AppError } from '../lib/errors.js'
import { fromNodeHeaders } from 'better-auth/node'
import { db } from '../lib/db.js'

// Internal roles always bypass requireRole checks
const INTERNAL_ROLES = ['superadmin', 'claims_admin', 'claims_employee', 'operations_employee']

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string | null
        role: string | null
      }
      session?: typeof auth.$Infer.Session.session
    }
  }
}

// Get session and user with role
async function getAuthenticatedUser(req: Request) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!session) return null

  // Fetch user (role is now a string field, no join needed)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) return null

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    session: session.session,
  }
}

// Require authentication
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const result = await getAuthenticatedUser(req)

  if (!result) {
    throw AppError.unauthorized()
  }

  req.user = result.user
  req.session = result.session
  next()
}

// Require specific roles (internal roles always pass)
export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const result = await getAuthenticatedUser(req)

    if (!result) {
      throw AppError.unauthorized()
    }

    const userRole = result.user.role

    // Internal roles (employees) always pass
    if (userRole && INTERNAL_ROLES.includes(userRole)) {
      req.user = result.user
      req.session = result.session
      return next()
    }

    // Client roles must be in allowed list
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw AppError.forbidden()
    }

    req.user = result.user
    req.session = result.session
    next()
  }
}

// Require access to a specific client (via UserClient)
export function requireClientAccess(clientIdParam = 'clientId') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const result = await getAuthenticatedUser(req)

    if (!result) {
      throw AppError.unauthorized()
    }

    // Superadmin bypasses client access check
    if (result.user.role === 'superadmin') {
      req.user = result.user
      req.session = result.session
      return next()
    }

    const body = req.body as Record<string, unknown> | undefined
    const query = req.query as Record<string, unknown>
    const clientId = (req.params[clientIdParam] ?? body?.clientId ?? query?.clientId) as
      | string
      | undefined

    if (!clientId) {
      throw AppError.badRequest('Client ID requerido')
    }

    const access = await db.userClient.findUnique({
      where: {
        userId_clientId: {
          userId: result.user.id,
          clientId,
        },
        isActive: true,
      },
    })

    if (!access) {
      throw AppError.forbidden('Sin acceso a este cliente')
    }

    req.user = result.user
    req.session = result.session
    next()
  }
}
