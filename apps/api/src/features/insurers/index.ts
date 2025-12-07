/**
 * Insurers feature router
 * Aggregates all insurer-related routes
 */

import { Router } from 'express'
import { listInsurersRouter } from './listInsurers/listInsurers.route.js'
import { getInsurerRouter } from './getInsurer/getInsurer.route.js'
import { createInsurerRouter } from './createInsurer/createInsurer.route.js'
import { editInsurerRouter } from './editInsurer/editInsurer.route.js'
import { deleteInsurerRouter } from './deleteInsurer/deleteInsurer.route.js'

const router = Router()

// Mount list routes first
router.use(listInsurersRouter)

// Mount create route
router.use(createInsurerRouter)

// Mount :id routes after specific paths
router.use(getInsurerRouter)
router.use(editInsurerRouter)
router.use(deleteInsurerRouter)

export { router as insurersRouter }
