import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { mockClientService } from '@/services/mock/mockServices'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    mockClientService.getAll().then(({ data }) => {
      setClients(data.content)
      setTotal(data.totalElements)
      setLoading(false)
    })
  }, [])

  return { clients, loading, total }
}
