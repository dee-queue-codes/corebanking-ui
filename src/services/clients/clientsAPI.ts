import type { Client } from '@/types'
import type { PaginatedResponse } from '@/types'
import type { AxiosRequestConfig } from 'axios'
import { http } from '../http'

type RequestConfig = AxiosRequestConfig & { _skipAuthRedirect?: boolean }

export const clientsAPI = {
  getAll: (params?: Record<string, unknown>, config?: RequestConfig) =>
    http.get<PaginatedResponse<Client>>('/clients', { ...config, params }),
  getById: (id: string, config?: RequestConfig) => http.get<Client>(`/clients/${id}`, config),
  create: (data: Partial<Client>, config?: RequestConfig) => http.post<Client>('/clients', data, config),
  update: (id: string, data: Partial<Client>, config?: RequestConfig) => http.put<Client>(`/clients/${id}`, data, config),
  delete: (id: string, config?: RequestConfig) => http.delete(`/clients/${id}`, config),
  getAddresses: (clientId: string, config?: RequestConfig) => http.get(`/clients/${clientId}/addresses`, config),
  createAddress: (clientId: string, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/clients/${clientId}/addresses`, data, config),
  updateAddress: (clientId: string, data: Record<string, unknown>, config?: RequestConfig) =>
    http.put(`/clients/${clientId}/addresses`, data, config),
  getFamilyMembers: (clientId: string, config?: RequestConfig) => http.get(`/clients/${clientId}/family-members`, config),
  createFamilyMember: (clientId: string, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/clients/${clientId}/family-members`, data, config),
  updateFamilyMember: (clientId: string, memberId: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.put(`/clients/${clientId}/family-members/${memberId}`, data, config),
  getIdentities: (clientId: string, config?: RequestConfig) => http.get(`/clients/${clientId}/identifiers`, config),
  createIdentity: (clientId: string, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/clients/${clientId}/identifiers`, data, config),
  updateIdentity: (clientId: string, identifierId: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.put(`/clients/${clientId}/identifiers/${identifierId}`, data, config),
  deleteIdentity: (clientId: string, identifierId: string | number, config?: RequestConfig) =>
    http.delete(`/clients/${clientId}/identifiers/${identifierId}`, config),
  getDocuments: (clientId: string, config?: RequestConfig) => http.get(`/clients/${clientId}/documents`, config),
  createDocument: (clientId: string, data: FormData | Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/clients/${clientId}/documents`, data, data instanceof FormData
      ? { ...config, headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' } }
      : config),
  getNotes: (clientId: string, config?: RequestConfig) => http.get(`/clients/${clientId}/notes`, config),
  createNote: (clientId: string, note: string, config?: RequestConfig) =>
    http.post(`/clients/${clientId}/notes`, { note }, config),
  updateNote: (clientId: string, noteId: string | number, note: string, config?: RequestConfig) =>
    http.put(`/clients/${clientId}/notes/${noteId}`, { note }, config),
  deleteNote: (clientId: string, noteId: string | number, config?: RequestConfig) =>
    http.delete(`/clients/${clientId}/notes/${noteId}`, config),
}
