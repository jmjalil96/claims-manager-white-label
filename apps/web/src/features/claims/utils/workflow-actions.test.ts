import { describe, it, expect } from 'vitest'
import { ClaimStatus } from '@claims/shared'
import { getWorkflowActions, getAvailableTransitions } from './workflow-actions'

describe('getWorkflowActions', () => {
  it('DRAFT returns transition to VALIDATION', () => {
    const actions = getWorkflowActions(ClaimStatus.DRAFT)
    expect(actions).toHaveLength(1)
    expect(actions[0]?.status).toBe(ClaimStatus.VALIDATION)
  })

  it('VALIDATION returns transitions to DRAFT and SUBMITTED', () => {
    const actions = getWorkflowActions(ClaimStatus.VALIDATION)
    expect(actions).toHaveLength(2)
    const statuses = actions.map((a) => a.status)
    expect(statuses).toContain(ClaimStatus.DRAFT)
    expect(statuses).toContain(ClaimStatus.SUBMITTED)
  })

  it('SUBMITTED returns transitions to PENDING_INFO, RETURNED, and SETTLED', () => {
    const actions = getWorkflowActions(ClaimStatus.SUBMITTED)
    expect(actions).toHaveLength(3)
    const statuses = actions.map((a) => a.status)
    expect(statuses).toContain(ClaimStatus.PENDING_INFO)
    expect(statuses).toContain(ClaimStatus.RETURNED)
    expect(statuses).toContain(ClaimStatus.SETTLED)
  })

  it('PENDING_INFO returns transitions to SUBMITTED and RETURNED', () => {
    const actions = getWorkflowActions(ClaimStatus.PENDING_INFO)
    expect(actions).toHaveLength(2)
    const statuses = actions.map((a) => a.status)
    expect(statuses).toContain(ClaimStatus.SUBMITTED)
    expect(statuses).toContain(ClaimStatus.RETURNED)
  })

  it('RETURNED returns transition to DRAFT', () => {
    const actions = getWorkflowActions(ClaimStatus.RETURNED)
    expect(actions).toHaveLength(1)
    expect(actions[0]?.status).toBe(ClaimStatus.DRAFT)
  })

  it('SETTLED returns no actions (terminal state)', () => {
    const actions = getWorkflowActions(ClaimStatus.SETTLED)
    expect(actions).toHaveLength(0)
  })

  it('CANCELLED returns no actions (terminal state)', () => {
    const actions = getWorkflowActions(ClaimStatus.CANCELLED)
    expect(actions).toHaveLength(0)
  })
})

describe('getAvailableTransitions', () => {
  it('returns only status values without UI metadata', () => {
    const transitions = getAvailableTransitions(ClaimStatus.SUBMITTED)
    expect(transitions).toEqual([
      ClaimStatus.PENDING_INFO,
      ClaimStatus.RETURNED,
      ClaimStatus.SETTLED,
    ])
  })

  it('returns empty array for terminal states', () => {
    expect(getAvailableTransitions(ClaimStatus.SETTLED)).toEqual([])
    expect(getAvailableTransitions(ClaimStatus.CANCELLED)).toEqual([])
  })
})
