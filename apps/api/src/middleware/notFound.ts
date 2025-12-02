import type { Request, Response } from 'express'
import { AppError } from '../lib/errors.js'

export function notFound(req: Request, _res: Response) {
  throw AppError.notFound(`Ruta ${req.method} ${req.path}`)
}
