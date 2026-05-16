import { createContext, useContext } from 'react'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthState>({
  user: null,
  setUser: () => {},
})

export const useAuthStore = () => useContext(AuthContext)
