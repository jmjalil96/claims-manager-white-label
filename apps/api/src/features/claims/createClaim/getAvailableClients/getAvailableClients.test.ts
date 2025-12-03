/**
 * Get Available Clients tests
 * Focus: Returns clients based on role authorization
 */

import { describe, it, expect } from 'vitest'
import { getAvailableClients } from './getAvailableClients.service.js'
import {
  createUser,
  createClient,
  createAffiliate,
  createUserClient,
  authUser,
} from '../../../../test/factories.js'

describe('Get Available Clients', () => {
  describe('internal roles', () => {
    it('can access any client', async () => {
      const admin = await createUser('claims_admin')
      const client = await createClient()

      const clients = await getAvailableClients(authUser(admin))

      expect(clients.some((c) => c.id === client.id)).toBe(true)
    })
  })

  describe('external roles', () => {
    it('can only see clients they have access to', async () => {
      const user = await createUser('client_admin')
      const accessibleClient = await createClient()
      const inaccessibleClient = await createClient()
      await createUserClient(user.id, accessibleClient.id)

      const clients = await getAvailableClients(authUser(user))

      expect(clients.some((c) => c.id === accessibleClient.id)).toBe(true)
      expect(clients.some((c) => c.id === inaccessibleClient.id)).toBe(false)
    })
  })

  describe('affiliate role', () => {
    it('can only see their own client', async () => {
      const user = await createUser('client_affiliate')
      const myClient = await createClient()
      const otherClient = await createClient()
      await createAffiliate(myClient.id, { userId: user.id })
      await createUserClient(user.id, myClient.id)

      const clients = await getAvailableClients(authUser(user))

      expect(clients.some((c) => c.id === myClient.id)).toBe(true)
      expect(clients.some((c) => c.id === otherClient.id)).toBe(false)
    })
  })
})
