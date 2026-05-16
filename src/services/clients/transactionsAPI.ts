import type { Transaction } from '@/types'
import type { PaginatedResponse } from '@/types'
import type { AxiosRequestConfig } from 'axios'
import { http } from '../http'

type RequestConfig = AxiosRequestConfig & { _skipAuthRedirect?: boolean }

export const clientTransactionsAPI = {
  getByAccountNumber: (accountNumber: string, config?: RequestConfig) =>
    http.get(`/transactions/${accountNumber}`, config),
  deposit: (accountNumber: string, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/transactions/${accountNumber}/deposit`, data, config),
  withdraw: (accountNumber: string, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/transactions/${accountNumber}/withdraw`, data, config),
  transfer: (data: Record<string, unknown>, config?: RequestConfig) =>
    http.post('/transactions/transfer', data, config),
}
