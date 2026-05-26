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

export interface PrepaidProduct {
  id: number
  name: string
  shortName?: string
  currency: string
  description?: string
  minBalance?: number
  maxBalance?: number
  minRequiredOpeningBalance?: number
  nominalAnnualInterestRate?: number
  status?: string
}

export interface CreatePrepaidProductRequest {
  name: string
  shortName: string
  currencyCode: string
  currency?: string
  description?: string
  minRequiredOpeningBalance?: number
  nominalAnnualInterestRate?: number
  withdrawalFeeForTransfers?: boolean
  allowOverdraft?: boolean
  enforceMinRequiredBalance?: boolean
  withHoldTax?: boolean
  locale?: string
  dateFormat?: string
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
  digitsAfterDecimal: number
  inMultiplesOf: number
  principal: number
  minPrincipal: number
  maxPrincipal: number
  numberOfRepayments: number
  minNumberOfRepayments: number
  maxNumberOfRepayments: number
  repaymentEvery: number
  repaymentFrequencyType: number
  interestRatePerPeriod: number
  minInterestRatePerPeriod: number
  maxInterestRatePerPeriod: number
  interestRateFrequencyType: number
  amortizationType: number
  interestType: number
  interestCalculationPeriodType: number
  transactionProcessingStrategyCode: string
  daysInMonthType: number
  daysInYearType: number
  isInterestRecalculationEnabled: boolean
  accountingRule: number
  includeInBorrowerCycle: boolean
  startDate: string
  closeDate?: string
  locale: string
  dateFormat: string
}

export const productsAPI = {
  getAll: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<Product>>('/products', { params }),
  getSavings: () => http.get<{ success: boolean; data: SavingsProduct[]; responseCode: string; responseMessage: string }>('/products/savings'),
  getLoans: () => http.get<{ success: boolean; data: LoanProduct[]; responseCode: string; responseMessage: string }>('/products/loans'),
  createLoan: (data: CreateLoanProductRequest) => http.post<{ success: boolean; data: LoanProduct; responseCode: string; responseMessage: string }>('/products/loans', data),
  updateLoan: (id: number, data: Partial<CreateLoanProductRequest>) => http.put(`/products/loans/${id}`, data),
  deleteLoan: (id: number) => http.delete(`/products/loans/${id}`),
  createSavings: (data: Record<string, unknown>) => http.post('/products/savings', data),
  updateSavings: (id: number, data: Record<string, unknown>) => http.put(`/products/savings/${id}`, data),
  deleteSavings: (id: number) => http.delete(`/products/savings/${id}`),
  getPrepaid: () => http.get<{ success: boolean; data: PrepaidProduct[]; responseCode: string; responseMessage: string }>('/products/prepaid'),
  createPrepaid: (data: CreatePrepaidProductRequest) => http.post<{ success: boolean; data: PrepaidProduct; responseCode: string; responseMessage: string }>('/products/prepaid', data),
  updatePrepaid: (id: number, data: Partial<CreatePrepaidProductRequest>) => http.put(`/products/prepaid/${id}`, data),
  deletePrepaid: (id: number) => http.delete(`/products/prepaid/${id}`),
  getById: (id: string) => http.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => http.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => http.put<Product>(`/products/${id}`, data),
}
