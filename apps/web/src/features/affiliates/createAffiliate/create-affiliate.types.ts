export interface CreateAffiliateRequest {
  clientId: string
  firstName: string
  lastName: string
  documentType?: string | null
  documentNumber?: string | null
  email?: string | null
  phone?: string | null
  dateOfBirth?: string | null
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'DOMESTIC_PARTNER' | null
  primaryAffiliateId?: string | null
  relationship?: 'SPOUSE' | 'CHILD' | 'PARENT' | 'DOMESTIC_PARTNER' | 'SIBLING' | 'OTHER' | null
}
