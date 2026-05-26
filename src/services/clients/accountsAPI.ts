import type { Account } from '@/types'
import type { AxiosRequestConfig } from 'axios'
import { http } from '../http'

type RequestConfig = AxiosRequestConfig & { _skipAuthRedirect?: boolean }

export interface CreateAccountRequest {
  clientId: string
  savingsProduct: string
  submittedOnDate: string
}

export interface ApproveAccountRequest {
  approvedOnDate: string
}

export interface ActivateAccountRequest {
  activatedOnDate: string
}

export const accountsAPI = {
  getByAccountNumber: (accountNumber: string, config?: RequestConfig) => http.get<Account>(`/accounts/${accountNumber}`, config),
  getByClientId: (clientId: string, config?: RequestConfig) => http.get<Account[]>(`/accounts/client/${clientId}`, config),
  create: (data: CreateAccountRequest, config?: RequestConfig) => http.post<Account>('/accounts', data, config),
  createWithClient: (data: Record<string, unknown>, config?: RequestConfig) => http.post<Account>('/accounts/with-client', data, config),
  approve: (accountNumber: string, data: ApproveAccountRequest, config?: RequestConfig) => http.post<Account>(`/accounts/${accountNumber}/approve`, data, config),
  activate: (accountNumber: string, data: ActivateAccountRequest, config?: RequestConfig) => http.post<Account>(`/accounts/${accountNumber}/activate`, data, config),
  getActiveCount: (config?: RequestConfig) => http.get<{ count: number }>('/accounts/active/count', config),
}
