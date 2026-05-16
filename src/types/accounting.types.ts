export type AccountingEntryType = 'debit' | 'credit'

export interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  parentId?: string
  balance: number
}

export interface JournalEntry {
  id: string
  reference: string
  date: string
  description: string
  lines: JournalLine[]
  status: 'draft' | 'posted' | 'reversed'
}

export interface JournalLine {
  accountId: string
  type: AccountingEntryType
  amount: number
  description?: string
}
