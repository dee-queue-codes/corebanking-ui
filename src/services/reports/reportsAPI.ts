import { http } from '../http'

type ReportParams = Record<string, string | number | undefined>

export interface Office {
  id: number
  name: string
}

export const reportsAPI = {
  getOffices: () => http.get<{ success: boolean; data: Office[] }>('/fineract/offices'),
  getContributions: (params?: ReportParams) =>
    http.get('/reports/contributions', { params }),
  getContributionMembers: (params?: ReportParams) =>
    http.get('/reports/contributions/members', { params }),
  getBranchReport: (params?: ReportParams) =>
    http.get('/reports/branch', { params }),
  getBranchTransactions: (params?: ReportParams) =>
    http.get('/reports/branch/transactions', { params }),
  getAccountReport: (params?: ReportParams) =>
    http.get('/reports/account', { params }),
  getAccountTransactions: (params?: ReportParams) =>
    http.get('/reports/account/transactions', { params }),
  getAccountDailyBalance: (params?: ReportParams) =>
    http.get('/reports/account/daily-balance', { params }),
  getDepositsMonthly: (params: { fromDate: string; toDate: string }) =>
    http.get('/reports/deposits/monthly', { params }),
  getCreditsMonthly: (params: { fromDate: string; toDate: string }) =>
    http.get('/reports/credits/monthly', { params }),
}
