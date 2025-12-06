import { Router } from 'express'
import { listPoliciesRouter } from './listPolicies/listPolicies.route.js'
import { kanbanPoliciesRouter } from './kanbanPolicies/kanbanPolicies.route.js'
import { createPolicyRouter } from './createPolicy/createPolicy.route.js'
import { getAvailableInsurersRouter } from './createPolicy/getAvailableInsurers/getAvailableInsurers.route.js'
import { getAvailableClientsRouter } from './createPolicy/getAvailableClients/getAvailableClients.route.js'
import { getPolicyRouter } from './getPolicy/getPolicy.route.js'
import { editPolicyRouter } from './editPolicy/editPolicy.route.js'
import { deletePolicyRouter } from './deletePolicy/deletePolicy.route.js'
import { getPolicyAuditRouter } from './getPolicyAudit/getPolicyAudit.route.js'
import { policyFilesRouter } from './files/index.js'

const router = Router()

// Mount specific routes FIRST (before :id routes)
router.use(listPoliciesRouter)
router.use(kanbanPoliciesRouter)
router.use(getAvailableInsurersRouter)
router.use(getAvailableClientsRouter)

// Mount policy routes
router.use(createPolicyRouter)

// Mount :id routes
router.use(getPolicyRouter)
router.use(editPolicyRouter)
router.use(deletePolicyRouter)
router.use(getPolicyAuditRouter)

// Mount nested resource routes
router.use('/:policyId/files', policyFilesRouter)

export { router as policiesRouter }
