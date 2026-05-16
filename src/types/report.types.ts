export interface ReportFilter {
  startDate?: string
  endDate?: string
  currency?: string
  status?: string
}

export interface ReportSummary {
  title: string
  total: number
  count: number
  currency: string
  period: string
}
