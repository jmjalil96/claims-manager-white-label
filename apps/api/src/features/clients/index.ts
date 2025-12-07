/**
 * Clients feature router
 * Aggregates all client-related routes
 */

import { Router } from 'express'
import { listClientsRouter } from './listClients/listClients.route.js'
import { getClientRouter } from './getClient/getClient.route.js'
import { createClientRouter } from './createClient/createClient.route.js'
import { editClientRouter } from './editClient/editClient.route.js'
import { deleteClientRouter } from './deleteClient/deleteClient.route.js'

const router = Router()

// Mount list routes first
router.use(listClientsRouter)

// Mount create route
router.use(createClientRouter)

// Mount :id routes after specific paths
router.use(getClientRouter)
router.use(editClientRouter)
router.use(deleteClientRouter)

export { router as clientsRouter }
