// List clients
export { fetchClients, useClients, type ClientsQueryParams, type ClientsSortBy } from './listClients'

// Client detail
export {
  fetchClientDetail,
  updateClient,
  useClientDetail,
  useUpdateClient,
  type UpdateClientRequestDto,
} from './clientDetail'

// Create client
export {
  createClient,
  useCreateClient,
  type CreateClientRequest,
} from './createClient'

// Delete client
export { deleteClient, useDeleteClient } from './deleteClient'

// Query keys
export { clientsKeys } from './query-keys'

// Schemas
export { clientFieldSchemas, editClientSchema, type EditClientInput } from './schemas'

// Components
export { ClientFormSheet, ClientDetailHeader } from './components'
