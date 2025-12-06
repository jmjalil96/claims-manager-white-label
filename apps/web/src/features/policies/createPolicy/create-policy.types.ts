import type { PolicyType } from '@claims/shared'

export interface CreatePolicyRequest {
  policyNumber: string
  clientId: string
  insurerId: string
  startDate: string
  endDate: string
  type?: PolicyType
  ambCopay?: number
  hospCopay?: number
  maternity?: number
  tPremium?: number
  tplus1Premium?: number
  tplusfPremium?: number
  benefitsCost?: number
}
