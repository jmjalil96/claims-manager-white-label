import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

interface HealthResponse {
  status: string
  checks: { database: string }
}

interface ApiInfoResponse {
  version: string
  message: string
}

interface ErrorResponse {
  code: string
}

describe('Health Check', () => {
  it('returns ok status with database check', async () => {
    const res = await request(app).get('/health')
    const body = res.body as HealthResponse
    expect(res.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.checks).toBeDefined()
    expect(body.checks.database).toBe('ok')
  })
})

describe('API Info', () => {
  it('returns version', async () => {
    const res = await request(app).get('/api')
    const body = res.body as ApiInfoResponse
    expect(res.status).toBe(200)
    expect(body.version).toBe('1.0.0')
    expect(body.message).toBe('Claims Manager API')
  })
})

describe('Auth Required', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/me')
    const body = res.body as ErrorResponse
    expect(res.status).toBe(401)
    expect(body.code).toBe('UNAUTHORIZED')
  })
})
