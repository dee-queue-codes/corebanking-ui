import { http } from '../http'
import type { AxiosRequestConfig } from 'axios'

type RequestConfig = AxiosRequestConfig & { _skipAuthRedirect?: boolean }

export interface LoanApplication {
  id: number | string
  clientId: string | number
  clientName?: string
  loanProductId?: number
  productName?: string
  principal: number
  numberOfRepayments: number
  status?: string | { value?: string; code?: string }
  submittedOnDate?: unknown
  expectedDisbursementDate?: unknown
  loanOfficerName?: string
  timeline?: Record<string, unknown>
}

export interface CreateLoanApplicationRequest {
  clientId: string | number
  productId: number
  principal: number
  loanTermFrequency: number
  loanTermFrequencyType: number
  numberOfRepayments: number
  repaymentEvery: number
  repaymentFrequencyType: number
  interestRatePerPeriod: number
  amortizationType: number
  interestType: number
  interestCalculationPeriodType: number
  transactionProcessingStrategyCode: string
  expectedDisbursementDate: string
  submittedOnDate: string
  locale: string
  dateFormat: string
}

export const loansAPI = {
  getApplications: (params?: Record<string, unknown>, config?: RequestConfig) =>
    http.get('/loans', { ...config, params }),

  createApplication: (data: CreateLoanApplicationRequest, config?: RequestConfig) =>
    http.post('/loans', data, config),

  getApplicationById: (id: string | number, config?: RequestConfig) =>
    http.get(`/loans/${id}`, config),

  approveApplication: (id: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/loans/${id}/approve`, data, config),

  rejectApplication: (id: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/loans/${id}/reject`, data, config),

  disburse: (id: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/loans/${id}/disburse`, data, config),
}
