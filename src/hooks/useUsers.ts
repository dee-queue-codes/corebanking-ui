import { useState, useEffect } from 'react'
import type { SystemUser } from '@/types'
import { mockUserService } from '@/services/mock/mockServices'

export function useUsers() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mockUserService.getAll().then(({ data }) => {
      setUsers(data.content)
      setLoading(false)
    })
  }, [])

  return { users, loading }
}
