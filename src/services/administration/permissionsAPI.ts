import { http } from '../http'

export const permissionsAPI = {
  getAll: () => http.get<string[]>('/permissions'),
}
