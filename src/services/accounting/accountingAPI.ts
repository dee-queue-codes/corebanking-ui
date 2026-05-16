import type { ChartOfAccount, JournalEntry } from '@/types'
import type { PaginatedResponse } from '@/types'
import { http } from '../http'

export const accountingAPI = {
  getChartOfAccounts: () => http.get<ChartOfAccount[]>('/accounting/chart-of-accounts'),
  getJournalEntries: (params?: Record<string, unknown>) =>
    http.get<PaginatedResponse<JournalEntry>>('/accounting/journal-entries', { params }),
  createJournalEntry: (data: Partial<JournalEntry>) =>
    http.post<JournalEntry>('/accounting/journal-entries', data),
}
