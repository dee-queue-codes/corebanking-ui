import type { Role } from '@/types'
import { http } from '../http'

export const rolesAPI = {
  getAll: () => http.get<Role[]>('/roles'),
  getById: (id: string) => http.get<Role>(`/roles/${id}`),
}
