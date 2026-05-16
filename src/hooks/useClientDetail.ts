import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { mockClientService } from '@/services/mock/mockServices'

export function useClientDetail(clientId: string) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) return
    mockClientService.getById(clientId).then(({ data }) => {
      setClient(data ?? null)
      setLoading(false)
    })
  }, [clientId])

  return { client, loading }
}
