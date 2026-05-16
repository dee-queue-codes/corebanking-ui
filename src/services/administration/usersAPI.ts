import type { SystemUser } from '@/types'
import type { PaginatedResponse } from '@/types'
import { http } from '../http'

export const usersAPI = {
  getAll: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<SystemUser>>('/users', { params }),
  getById: (id: string) => http.get<SystemUser>(`/users/${id}`),
  create: (data: Partial<SystemUser>) => http.post<SystemUser>('/users', data),
  update: (id: string, data: Partial<SystemUser>) => http.put<SystemUser>(`/users/${id}`, data),
  delete: (id: string) => http.delete(`/users/${id}`),
}
