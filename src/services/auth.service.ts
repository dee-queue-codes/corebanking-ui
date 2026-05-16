import type { LoginRequest, LoginResponse, User } from '@/types'
import { http } from './http'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>('/auth/login', credentials)

    const tokens = data.data
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    if (tokens.user) {
      localStorage.setItem('user', JSON.stringify(tokens.user))
    }

    return data
  },

  async logout(): Promise<void> {
    try {
      await http.post('/auth/logout')
    } catch { /* ignore — clear locally regardless */ }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  },
}
