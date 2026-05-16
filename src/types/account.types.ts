import type { Status } from './common.types'

export interface Account {
  id: string
  accountNumber: string
  clientId: string
  type: 'savings' | 'current' | 'loan' | 'prepaid'
  balance: number
  currency: string
  status: Status
  openedAt: string
}
