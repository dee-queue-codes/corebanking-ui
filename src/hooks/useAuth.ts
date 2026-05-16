import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User, LoginRequest } from '@/types'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/router/routes'

export function useAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const login = async (credentials: LoginRequest) => {
    setLoading(true)
    try {
      await authService.login(credentials)
      navigate(ROUTES.DASHBOARD)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    navigate(ROUTES.LOGIN)
  }

  return {
    user,
    loading,
    isLoggedIn: authService.isAuthenticated(),
    login,
    logout,
  }
}
