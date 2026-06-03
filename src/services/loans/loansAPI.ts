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
  // ── Listing endpoints ──────────────────────────────────────────────────────
  /** GET /loans/overview - dashboard summary stats */
  getOverview: (config?: RequestConfig) =>
    http.get('/loans/overview', config),

  /** GET /loans/applications?stage=... - kanban/table of applications */
  getApplications: (params?: Record<string, unknown>, config?: RequestConfig) =>
    http.get('/loans/applications', { ...config, params }),

  /** GET /loans/active - active (disbursed) loans */
  getActive: (params?: Record<string, unknown>, config?: RequestConfig) =>
    http.get('/loans/active', { ...config, params }),

  /** GET /loans/disbursements - pending/completed disbursements */
  getDisbursements: (params?: Record<string, unknown>, config?: RequestConfig) =>
    http.get('/loans/disbursements', { ...config, params }),

  /** GET /loans/arrears - loans in arrears */
  getArrears: (params?: Record<string, unknown>, config?: RequestConfig) =>
    http.get('/loans/arrears', { ...config, params }),

  /** GET /loans/client/{clientId} - loans by client */
  getByClient: (clientId: string | number, config?: RequestConfig) =>
    http.get(`/loans/client/${clientId}`, config),

  // ── Single loan endpoints ──────────────────────────────────────────────────
  /** GET /loans/{loanId}/details - full loan detail */
  getApplicationById: (id: string | number, config?: RequestConfig) =>
    http.get(`/loans/${id}/details`, config),

  /** GET /loans/{loanId}/repayments - repayment history */
  getTransactions: (id: string | number, config?: RequestConfig) =>
    http.get(`/loans/${id}/repayments`, config),

  /** GET /loans/{loanId}/repayments/preview - preview allocation */
  getRepaymentSchedule: (id: string | number, config?: RequestConfig) =>
    http.get(`/loans/${id}/repayments/preview`, config),

  /** POST /loans/{loanId}/repayments - post a repayment */
  makeRepayment: (id: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/loans/${id}/repayments`, data, config),

  // ── State transitions (via Fineract passthrough) ───────────────────────────
  /** Create a new loan application */
  createApplication: (data: CreateLoanApplicationRequest, config?: RequestConfig) =>
    http.post('/loans', data, config),

  /** POST /loans/{id}/approve */
  approveApplication: (id: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/loans/${id}/approve`, data, config),

  /** POST /loans/{id}/reject */
  rejectApplication: (id: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/loans/${id}/reject`, data, config),

  /** POST /loans/{id}/disburse */
  disburse: (id: string | number, data: Record<string, unknown>, config?: RequestConfig) =>
    http.post(`/loans/${id}/disburse`, data, config),
}
