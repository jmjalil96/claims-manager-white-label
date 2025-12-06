import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server'
import { resetMocks } from './handlers'

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers and mock state after each test
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMocks()
})

// Close server after all tests
afterAll(() => server.close())
