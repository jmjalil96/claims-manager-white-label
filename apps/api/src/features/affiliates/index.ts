/**
 * Affiliates feature router
 * Aggregates all affiliate-related routes
 */

import { Router } from 'express'
import { getAvailableClientsRouter } from './getAvailableClients/getAvailableClients.route.js'
import { getAvailableOwnersRouter } from './getAvailableOwners/getAvailableOwners.route.js'
import { listAffiliatesRouter } from './listAffiliates/listAffiliates.route.js'
import { getAffiliateRouter } from './getAffiliate/getAffiliate.route.js'
import { createAffiliateRouter } from './createAffiliate/createAffiliate.route.js'
import { editAffiliateRouter } from './editAffiliate/editAffiliate.route.js'
import { deleteAffiliateRouter } from './deleteAffiliate/deleteAffiliate.route.js'

const router = Router()

// Mount lookup routes FIRST (before :id routes)
router.use(getAvailableClientsRouter)
router.use(getAvailableOwnersRouter)

// Mount list routes
router.use(listAffiliatesRouter)

// Mount create route
router.use(createAffiliateRouter)

// Mount :id routes after specific paths
router.use(getAffiliateRouter)
router.use(editAffiliateRouter)
router.use(deleteAffiliateRouter)

export { router as affiliatesRouter }
