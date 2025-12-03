import { Router } from 'express'
import { createUserRouter } from './createUser/createUser.route.js'

const router = Router()

router.use(createUserRouter)

export { router as devRouter }
