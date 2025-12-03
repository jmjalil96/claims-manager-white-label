import { auth } from '../../lib/auth.js'
import { db } from '../../lib/db.js'
import { AppError } from '../../lib/errors.js'
import type { CreateUserInput } from './createUser.schema.js'

interface CreatedUser {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
}

export async function createDevUser(input: CreateUserInput): Promise<CreatedUser> {
  const { email, password, role, name } = input

  // Check if user already exists
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    throw AppError.badRequest('El usuario ya existe')
  }

  // Use BetterAuth's API to create user with hashed password
  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: name ?? email.split('@')[0],
    } as { email: string; password: string; name: string },
  })

  if (!response.user) {
    throw AppError.badRequest('Error al crear usuario')
  }

  // Update the role (BetterAuth doesn't support custom fields during signup)
  const user = await db.user.update({
    where: { id: response.user.id },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  return user
}
