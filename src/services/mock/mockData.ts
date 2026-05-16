import type { Client, Transaction, SystemUser, Product } from '@/types'

export const mockClients: Client[] = [
  {
    id: '1',
    clientNumber: 'CLT-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 555-0100',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    clientNumber: 'CLT-002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1 555-0101',
    status: 'active',
    createdAt: '2024-02-20T10:00:00Z',
  },
]

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    reference: 'TXN-001',
    accountId: 'acc-1',
    type: 'credit',
    amount: 5000,
    currency: 'USD',
    status: 'completed',
    description: 'Salary deposit',
    createdAt: '2024-03-01T09:00:00Z',
  },
]

export const mockUsers: SystemUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@chelseabank.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['ADMIN'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  },
]

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Standard Savings',
    code: 'SAV-001',
    category: 'savings',
    currency: 'USD',
    status: 'active',
    description: 'Standard savings account',
  },
]
