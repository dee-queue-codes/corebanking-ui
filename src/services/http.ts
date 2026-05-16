import axios from 'axios'
import { env } from '@/config/env'

export const http = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => {
    if (
      res.data &&
      typeof res.data === 'object' &&
      (res.data as Record<string, unknown>).success === false
    ) {
      return Promise.reject({ response: res, config: res.config })
    }
    return res
  },
  (error) => {
    const skip = error.config?._skipAuthRedirect === true
    if (error.response?.status === 401 && !skip) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
