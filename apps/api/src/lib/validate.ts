import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { AppError } from './errors.js'

export function validate<T extends z.ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body as unknown,
      query: req.query,
      params: req.params,
    })

    if (!result.success) {
      const errors = result.error.flatten()
      throw AppError.badRequest('Error de validación', errors)
    }

    req.validated = result.data as z.infer<T>
    next()
  }
}

// Extend Express Request
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validated?: unknown
    }
  }
}

export { z }
