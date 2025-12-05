/**
 * Custom error class for API errors
 * Captures HTTP status, status text, and optional response data
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    // Extract message from API response body, fallback to status text
    // API returns { error: "...", code: "...", requestId: "..." }
    const message =
      data && typeof data === 'object'
        ? ('error' in data && typeof data.error === 'string'
            ? data.error
            : 'message' in data && typeof data.message === 'string'
              ? data.message
              : `${status}: ${statusText}`)
        : `${status}: ${statusText}`

    super(message)
    this.name = 'ApiError'
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isServerError(): boolean {
    return this.status >= 500
  }
}
