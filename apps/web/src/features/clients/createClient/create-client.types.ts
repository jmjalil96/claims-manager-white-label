export interface CreateClientRequest {
  name: string
  taxId: string
  email?: string | null
  phone?: string | null
  address?: string | null
}
