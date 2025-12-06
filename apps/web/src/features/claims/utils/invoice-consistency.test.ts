import { describe, it, expect } from 'vitest'
import { getConsistencyStatus } from './invoice-consistency'

describe('getConsistencyStatus', () => {
  it('returns null when claimAmount is undefined', () => {
    const result = getConsistencyStatus(100, undefined)
    expect(result).toBeNull()
  })

  it('returns null when claimAmount is 0', () => {
    const result = getConsistencyStatus(100, 0)
    expect(result).toBeNull()
  })

  it('returns match when difference is exactly 0', () => {
    const result = getConsistencyStatus(1000, 1000)
    expect(result).toEqual({ status: 'match', label: 'Coincide' })
  })

  it('returns close when difference is exactly 5%', () => {
    // 5% of 1000 = 50, so 950 or 1050 should be "close"
    const result = getConsistencyStatus(950, 1000)
    expect(result).toEqual({ status: 'close', label: 'Diferencia menor' })
  })

  it('returns close when difference is less than 5%', () => {
    // 3% difference
    const result = getConsistencyStatus(970, 1000)
    expect(result).toEqual({ status: 'close', label: 'Diferencia menor' })
  })

  it('returns mismatch when difference exceeds 5%', () => {
    // 6% difference
    const result = getConsistencyStatus(940, 1000)
    expect(result).toEqual({ status: 'mismatch', label: 'No coincide' })
  })

  it('handles invoice total greater than claim amount', () => {
    // 10% over
    const result = getConsistencyStatus(1100, 1000)
    expect(result).toEqual({ status: 'mismatch', label: 'No coincide' })
  })

  it('handles small amounts correctly', () => {
    // 5% of 10 = 0.5, so 9.5 should be "close"
    const result = getConsistencyStatus(9.5, 10)
    expect(result).toEqual({ status: 'close', label: 'Diferencia menor' })
  })
})
