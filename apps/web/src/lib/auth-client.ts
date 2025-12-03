import { createAuthClient } from 'better-auth/react'

const baseURL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001'

export const authClient = createAuthClient({
  baseURL,
})

export const { useSession, signIn, signOut, signUp } = authClient

// Password reset types
interface AuthResponse {
  data?: unknown
  error?: { message?: string }
}

// Password reset: request password reset email
// Uses better-auth's /request-password-reset endpoint
export async function forgetPassword(options: {
  email: string
  redirectTo?: string
}): Promise<AuthResponse> {
  return authClient.$fetch('/request-password-reset', {
    method: 'POST',
    body: options,
  })
}

// Password reset: set new password with token
// Uses better-auth's /reset-password endpoint
export async function resetPassword(options: {
  newPassword: string
  token: string
}): Promise<AuthResponse> {
  return authClient.$fetch('/reset-password', {
    method: 'POST',
    body: options,
  })
}
