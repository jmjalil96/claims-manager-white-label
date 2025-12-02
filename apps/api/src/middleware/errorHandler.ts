import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/errors.js'
import { logger } from '../lib/logger.js'

interface ErrorResponse {
  error: string
  code: string
  requestId: string
  details?: Record<string, unknown>
  stack?: string
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const reqId = req.id
  const requestId = typeof reqId === 'string' ? reqId : typeof reqId === 'number' ? String(reqId) : 'unknown'
  const isDev = process.env.NODE_ENV !== 'production'

  const isAppError = err instanceof AppError
  const statusCode = isAppError ? err.statusCode : 500
  const code = isAppError ? err.code : 'INTERNAL_ERROR'
  const message = isAppError ? err.message : 'Error interno del servidor'

  const logContext = {
    requestId,
    statusCode,
    code,
    path: req.path,
    method: req.method,
    ...(isDev && { stack: err.stack }),
  }

  if (statusCode >= 500) {
    logger.error({ err, ...logContext }, 'Server error')
  } else {
    logger.warn(logContext, err.message)
  }

  const response: ErrorResponse = {
    error: message,
    code,
    requestId,
  }

  if (isAppError && err.details) {
    response.details = err.details
  }
  if (isDev && !isAppError) {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}
