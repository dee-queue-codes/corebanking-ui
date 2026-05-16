import type { Product } from '@/types'
import type { PaginatedResponse } from '@/types'
import { http } from '../http'

export interface SavingsProduct {
  id: number
  name: string
  shortName?: string
  currency: string
  interestRate?: number
  minRequiredBalance?: number
  allowOverdraft?: boolean
  description?: string
}

export interface LoanProduct {
  id: number
  name: string
  shortName?: string
  currency: string
  description?: string
  principal?: number
  minPrincipal?: number
  maxPrincipal?: number
  interestRate?: number
  annualInterestRate?: number
  numberOfRepayments?: number
  startDate?: string
  closeDate?: string
  status?: string
}

export interface CreateLoanProductRequest {
  name: string
  shortName: string
  currencyCode: string
  currency?: string
  principal: number
  numberOfRepayments: number
  annualInterestRate: number
  startDate: string
  closeDate: string
  repaymentEvery: number
  repaymentFrequencyType: number
  interestRatePerPeriod: number
  interestRateFrequencyType: number
  amortizationType: number
  interestType: number
  interestCalculationPeriodType: number
  accountingRule: number
  locale: string
  dateFormat: string
}

export const productsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Product>>('/products', { params }),
  getSavings: () => http.get<{ success: boolean; data: SavingsProduct[]; responseCode: string; responseMessage: string }>('/products/savings'),
  getLoans: () => http.get<{ success: boolean; data: LoanProduct[]; responseCode: string; responseMessage: string }>('/products/loans'),
  createLoan: (data: CreateLoanProductRequest) => http.post<{ success: boolean; data: LoanProduct; responseCode: string; responseMessage: string }>('/products/loans', data),
  getById: (id: string) => http.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => http.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => http.put<Product>(`/products/${id}`, data),
}
