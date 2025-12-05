/**
 * Claims feature router
 * Aggregates all claim-related routes
 */

import { Router } from 'express'
import { createClaimRouter } from './createClaim/createClaim.route.js'
import { deleteClaimRouter } from './deleteClaim/deleteClaim.route.js'
import { editClaimRouter } from './editClaim/editClaim.route.js'
import { getClaimRouter } from './getClaim/getClaim.route.js'
import { getClaimAuditRouter } from './getClaimAudit/getClaimAudit.route.js'
import { getClaimSlaRouter } from './getClaimSla/getClaimSla.route.js'
import { getUploadUrlRouter } from './getUploadUrl/getUploadUrl.route.js'
import { kanbanClaimsRouter } from './kanbanClaims/kanbanClaims.route.js'
import { listClaimsRouter } from './listClaims/listClaims.route.js'
import { getAvailableClientsRouter } from './createClaim/getAvailableClients/getAvailableClients.route.js'
import { getAvailableAffiliatesRouter } from './createClaim/getAvailableAffiliates/getAvailableAffiliates.route.js'
import { getAvailablePatientsRouter } from './createClaim/getAvailablePatients/getAvailablePatients.route.js'
import { invoicesRouter } from './invoices/index.js'
import { filesRouter } from './files/index.js'
import { listClaimPoliciesRouter } from './listClaimPolicies/listClaimPolicies.route.js'

const router = Router()

// Mount lookup routes FIRST (before :id routes)
router.use(getAvailableClientsRouter)
router.use(getAvailableAffiliatesRouter)
router.use(getAvailablePatientsRouter)

// Mount claim routes
router.use(listClaimsRouter)
router.use(kanbanClaimsRouter)
router.use(getUploadUrlRouter)
router.use(createClaimRouter)

// Mount :id routes AFTER specific paths
router.use(getClaimRouter)
router.use(getClaimAuditRouter)
router.use(getClaimSlaRouter)
router.use(listClaimPoliciesRouter)
router.use(editClaimRouter)
router.use(deleteClaimRouter)

// Mount nested resource routes
router.use('/:claimId/invoices', invoicesRouter)
router.use('/:claimId/files', filesRouter)

export { router as claimsRouter }
