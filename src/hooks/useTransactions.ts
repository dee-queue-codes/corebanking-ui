import { useState, useEffect } from 'react'
import type { Transaction } from '@/types'
import { mockTransactionService } from '@/services/mock/mockServices'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockTransactionService.getAll().then(({ data }) => {
      setTransactions(data.content)
      setLoading(false)
    })
  }, [])

  return { transactions, loading }
}
