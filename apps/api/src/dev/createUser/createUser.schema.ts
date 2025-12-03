import { z } from 'zod'

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    role: z.string().default('client_affiliate'),
    name: z.string().optional(),
  }),
})

export type CreateUserInput = z.infer<typeof createUserSchema>['body']
