export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new AppError(400, message, 'BAD_REQUEST', details)
  }

  static unauthorized(message = 'No autorizado') {
    return new AppError(401, message, 'UNAUTHORIZED')
  }

  static forbidden(message = 'Acceso denegado') {
    return new AppError(403, message, 'FORBIDDEN')
  }

  static notFound(resource = 'Recurso') {
    return new AppError(404, `${resource} no encontrado`, 'NOT_FOUND')
  }

  static conflict(message: string) {
    return new AppError(409, message, 'CONFLICT')
  }

  static validation(details: Record<string, unknown>) {
    return new AppError(422, 'Error de validacion', 'VALIDATION_ERROR', details)
  }

  static internal(message = 'Error interno del servidor') {
    return new AppError(500, message, 'INTERNAL_ERROR')
  }
}
