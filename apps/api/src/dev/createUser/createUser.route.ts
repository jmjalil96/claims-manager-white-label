import { Router } from 'express'
import { validate } from '../../lib/validate.js'
import { createUserSchema, type CreateUserInput } from './createUser.schema.js'
import { createDevUser } from './createUser.service.js'

const router = Router()

/**
 * @route POST /dev/users
 * @description Create a user for development/testing purposes
 * @access Development only (no auth required)
 */
router.post('/users', validate(createUserSchema), async (req, res) => {
  const input = (req.validated as { body: CreateUserInput }).body

  const user = await createDevUser(input)

  res.status(201).json({ user })
})

export { router as createUserRouter }
