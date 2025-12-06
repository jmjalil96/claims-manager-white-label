import type { Request, Response, NextFunction } from 'express'
import { auth } from '../lib/auth.js'
import { AppError } from '../lib/errors.js'
import { fromNodeHeaders } from 'better-auth/node'
import { db } from '../lib/db.js'
import { isInternalRole } from '../lib/constants.js'

/**
 * Authenticated user context available on req.user
 */
export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: string | null
}

/**
 * Check if auth is disabled for testing
 * Only works in non-production environments
 */
const isAuthDisabled = process.env.DISABLE_AUTH === 'true' && process.env.NODE_ENV !== 'production'

/**
 * Mock user for testing when auth is disabled
 */
const mockUser: AuthUser = {
  id: 'CM8ImuQseVVd1nz7VusseRtPo0YSJ7TG',
  email: 'juanjalilf@gmail.com',
  name: 'Juan Jalil',
  role: 'superadmin',
}

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
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
  if (isAuthDisabled) {
    req.user = mockUser
    return next()
  }

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
    if (isAuthDisabled) {
      req.user = mockUser
      return next()
    }

    const result = await getAuthenticatedUser(req)

    if (!result) {
      throw AppError.unauthorized()
    }

    const userRole = result.user.role

    // Internal roles (employees) always pass
    if (isInternalRole(userRole)) {
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

// Require internal role (broker employees only)
export async function requireInternalRole(req: Request, _res: Response, next: NextFunction) {
  if (isAuthDisabled) {
    req.user = mockUser
    return next()
  }

  const result = await getAuthenticatedUser(req)

  if (!result) {
    throw AppError.unauthorized()
  }

  if (!isInternalRole(result.user.role)) {
    throw AppError.forbidden('Acceso restringido a empleados internos')
  }

  req.user = result.user
  req.session = result.session
  next()
}

// Require superadmin role only
export async function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (isAuthDisabled) {
    req.user = mockUser
    return next()
  }

  const result = await getAuthenticatedUser(req)

  if (!result) {
    throw AppError.unauthorized()
  }

  if (result.user.role !== 'superadmin') {
    throw AppError.forbidden('Acceso restringido a superadmin')
  }

  req.user = result.user
  req.session = result.session
  next()
}

// Require access to a specific client (via UserClient)
export function requireClientAccess(clientIdParam = 'clientId') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (isAuthDisabled) {
      req.user = mockUser
      return next()
    }

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
