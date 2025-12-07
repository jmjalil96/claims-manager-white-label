export interface CreateInsurerRequest {
  name: string
  code?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  taxRate?: number | null
}
