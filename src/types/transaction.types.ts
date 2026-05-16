export type TransactionType = 'debit' | 'credit' | 'transfer'
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'reversed'

export interface Transaction {
  id: string
  reference: string
  accountId: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description: string
  createdAt: string
}
