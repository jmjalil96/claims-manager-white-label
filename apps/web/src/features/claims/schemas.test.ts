import { describe, it, expect } from 'vitest'
import {
  createClaimSchema,
  claimFieldSchemas,
  invoiceFieldSchemas,
  createInvoiceSchema,
} from './schemas'

describe('createClaimSchema', () => {
  const validInput = {
    clientId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
    affiliateId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
    patientId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
    description: 'Test claim description',
  }

  it('accepts valid input', () => {
    const result = createClaimSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects missing clientId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { clientId, ...input } = validInput
    const result = createClaimSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing affiliateId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { affiliateId, ...input } = validInput
    const result = createClaimSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing patientId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { patientId, ...input } = validInput
    const result = createClaimSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects empty description', () => {
    const result = createClaimSchema.safeParse({ ...validInput, description: '' })
    expect(result.success).toBe(false)
  })

  it('rejects description exceeding 1000 characters', () => {
    const result = createClaimSchema.safeParse({
      ...validInput,
      description: 'x'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts description at exactly 1000 characters', () => {
    const result = createClaimSchema.safeParse({
      ...validInput,
      description: 'x'.repeat(1000),
    })
    expect(result.success).toBe(true)
  })
})

describe('claimFieldSchemas', () => {
  describe('amountSubmitted', () => {
    it('accepts zero', () => {
      const result = claimFieldSchemas.amountSubmitted.safeParse(0)
      expect(result.success).toBe(true)
    })

    it('accepts positive numbers', () => {
      const result = claimFieldSchemas.amountSubmitted.safeParse(100.5)
      expect(result.success).toBe(true)
    })

    it('rejects negative numbers', () => {
      const result = claimFieldSchemas.amountSubmitted.safeParse(-1)
      expect(result.success).toBe(false)
    })

    it('accepts null', () => {
      const result = claimFieldSchemas.amountSubmitted.safeParse(null)
      expect(result.success).toBe(true)
    })
  })

  describe('description', () => {
    it('accepts valid description', () => {
      const result = claimFieldSchemas.description.safeParse('Test description')
      expect(result.success).toBe(true)
    })

    it('rejects description exceeding 1000 characters', () => {
      const result = claimFieldSchemas.description.safeParse('x'.repeat(1001))
      expect(result.success).toBe(false)
    })

    it('accepts null', () => {
      const result = claimFieldSchemas.description.safeParse(null)
      expect(result.success).toBe(true)
    })
  })

  describe('pendingReason', () => {
    it('accepts valid reason', () => {
      const result = claimFieldSchemas.pendingReason.safeParse('Waiting for documents')
      expect(result.success).toBe(true)
    })

    it('rejects reason exceeding 1000 characters', () => {
      const result = claimFieldSchemas.pendingReason.safeParse('x'.repeat(1001))
      expect(result.success).toBe(false)
    })
  })

  describe('returnReason', () => {
    it('accepts valid reason', () => {
      const result = claimFieldSchemas.returnReason.safeParse('Missing information')
      expect(result.success).toBe(true)
    })

    it('rejects reason exceeding 1000 characters', () => {
      const result = claimFieldSchemas.returnReason.safeParse('x'.repeat(1001))
      expect(result.success).toBe(false)
    })
  })

  describe('cancellationReason', () => {
    it('accepts valid reason', () => {
      const result = claimFieldSchemas.cancellationReason.safeParse('Duplicate claim')
      expect(result.success).toBe(true)
    })

    it('rejects reason exceeding 1000 characters', () => {
      const result = claimFieldSchemas.cancellationReason.safeParse('x'.repeat(1001))
      expect(result.success).toBe(false)
    })
  })

  describe('incidentDate', () => {
    it('accepts valid ISO date', () => {
      const result = claimFieldSchemas.incidentDate.safeParse('2024-01-15')
      expect(result.success).toBe(true)
    })

    it('rejects invalid date format', () => {
      const result = claimFieldSchemas.incidentDate.safeParse('15/01/2024')
      expect(result.success).toBe(false)
    })

    it('rejects non-date string', () => {
      const result = claimFieldSchemas.incidentDate.safeParse('not a date')
      expect(result.success).toBe(false)
    })

    it('accepts null', () => {
      const result = claimFieldSchemas.incidentDate.safeParse(null)
      expect(result.success).toBe(true)
    })
  })
})

describe('invoiceFieldSchemas', () => {
  describe('amountSubmitted', () => {
    it('accepts positive numbers', () => {
      const result = invoiceFieldSchemas.amountSubmitted.safeParse(100)
      expect(result.success).toBe(true)
    })

    it('rejects zero', () => {
      const result = invoiceFieldSchemas.amountSubmitted.safeParse(0)
      expect(result.success).toBe(false)
    })

    it('rejects negative numbers', () => {
      const result = invoiceFieldSchemas.amountSubmitted.safeParse(-50)
      expect(result.success).toBe(false)
    })
  })

  describe('invoiceNumber', () => {
    it('accepts valid invoice number', () => {
      const result = invoiceFieldSchemas.invoiceNumber.safeParse('INV-001')
      expect(result.success).toBe(true)
    })

    it('rejects empty string', () => {
      const result = invoiceFieldSchemas.invoiceNumber.safeParse('')
      expect(result.success).toBe(false)
    })

    it('rejects string exceeding 100 characters', () => {
      const result = invoiceFieldSchemas.invoiceNumber.safeParse('x'.repeat(101))
      expect(result.success).toBe(false)
    })
  })

  describe('providerName', () => {
    it('accepts valid provider name', () => {
      const result = invoiceFieldSchemas.providerName.safeParse('Hospital General')
      expect(result.success).toBe(true)
    })

    it('rejects empty string', () => {
      const result = invoiceFieldSchemas.providerName.safeParse('')
      expect(result.success).toBe(false)
    })

    it('rejects string exceeding 200 characters', () => {
      const result = invoiceFieldSchemas.providerName.safeParse('x'.repeat(201))
      expect(result.success).toBe(false)
    })
  })
})

describe('createInvoiceSchema', () => {
  const validInput = {
    invoiceNumber: 'INV-001',
    providerName: 'Hospital General',
    amountSubmitted: 1500.0,
  }

  it('accepts valid input', () => {
    const result = createInvoiceSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects missing invoiceNumber', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { invoiceNumber, ...input } = validInput
    const result = createInvoiceSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing providerName', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { providerName, ...input } = validInput
    const result = createInvoiceSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing amountSubmitted', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { amountSubmitted, ...input } = validInput
    const result = createInvoiceSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
