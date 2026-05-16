import { mockClients, mockTransactions, mockUsers, mockProducts } from './mockData'

export const mockClientService = {
  getAll: () => Promise.resolve({ data: { content: mockClients, totalElements: mockClients.length, totalPages: 1, size: 10, number: 0 } }),
  getById: (id: string) => Promise.resolve({ data: mockClients.find(c => c.id === id) }),
}

export const mockTransactionService = {
  getAll: () => Promise.resolve({ data: { content: mockTransactions, totalElements: mockTransactions.length, totalPages: 1, size: 10, number: 0 } }),
}

export const mockUserService = {
  getAll: () => Promise.resolve({ data: { content: mockUsers, totalElements: mockUsers.length, totalPages: 1, size: 10, number: 0 } }),
}

export const mockProductService = {
  getAll: () => Promise.resolve({ data: { content: mockProducts, totalElements: mockProducts.length, totalPages: 1, size: 10, number: 0 } }),
}
