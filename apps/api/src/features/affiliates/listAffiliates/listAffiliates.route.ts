/**
 * Route handler for listing affiliates
 * GET /api/affiliates
 */

import { Router } from 'express'
import { validate } from '../../../lib/validate.js'
import { requireAuth } from '../../../middleware/auth.js'
import { listAffiliatesSchema, type ListAffiliatesInput } from './listAffiliates.schema.js'
import { listAffiliates, listAffiliatesFamilies } from './listAffiliates.service.js'
import type { ListAffiliatesResponse, ListAffiliatesFamiliesResponse } from '@claims/shared'

const router = Router()

/**
 * @route GET /api/affiliates
 * @description List affiliates with filtering, sorting, and pagination
 * @access All authenticated users with appropriate scoping:
 *   - Internal roles: Full access (optionally filtered by clientId)
 *   - Client admin: Scoped to accessible clients via UserClient
 *   - Affiliate: Only self and dependents
 * @query groupBy=family - Returns owners with nested dependents
 */
router.get('/', validate(listAffiliatesSchema), requireAuth, async (req, res) => {
  const input = (req.validated as { query: ListAffiliatesInput }).query
  const user = req.user!

  if (input.groupBy === 'family') {
    const result = await listAffiliatesFamilies(input, user)
    const response: ListAffiliatesFamiliesResponse = result
    res.status(200).json(response)
  } else {
    const result = await listAffiliates(input, user)
    const response: ListAffiliatesResponse = result
    res.status(200).json(response)
  }
})

export { router as listAffiliatesRouter }
