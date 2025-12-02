import { randomUUID } from 'crypto'
import type { Request, Response, NextFunction } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string
    }
  }
}

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || randomUUID()
  req.id = id
  res.setHeader('X-Request-Id', id)
  next()
}
