import { useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  RefreshCw,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import { reportsAPI } from '@/services/reports/reportsAPI'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ReportKey =
  | 'contributions'
  | 'contributionMembers'
  | 'branch'
  | 'branchTransactions'
  | 'account'
  | 'accountTransactions'
  | 'accountDailyBalance'

type ReportRow = Record<string, unknown>
type ReportField = 'dateRange' | 'branchId' | 'accountNumber' | 'memberId'

interface ReportConfig {
  key: ReportKey
  title: string
  description: string
  endpoint: string
  icon: typeof BarChart3
  accent: string
  fields: ReportField[]
  run: (params: Record<string, string>) => Promise<unknown>
}

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

const reports: ReportConfig[] = [
  {
    key: 'contributions',
    title: 'Contributions',
    description: 'Contribution totals and journal movement.',
    endpoint: '/api/v1/reports/contributions',
    icon: Wallet,
    accent: '#059669',
    fields: ['dateRange'],
    run: params => reportsAPI.getContributions(params),
  },
  {
    key: 'contributionMembers',
    title: 'Contribution Members',
    description: 'Member-level contribution reporting.',
    endpoint: '/api/v1/reports/contributions/members',
    icon: Users,
    accent: '#7C3AED',
    fields: ['dateRange', 'memberId'],
    run: params => reportsAPI.getContributionMembers(params),
  },
  {
    key: 'branch',
    title: 'Branch Report',
    description: 'Branch-level balances and activity.',
    endpoint: '/api/v1/reports/branch',
    icon: Building2,
    accent: '#2563EB',
    fields: ['dateRange', 'branchId'],
    run: params => reportsAPI.getBranchReport(params),
  },
  {
    key: 'branchTransactions',
    title: 'Branch Transactions',
    description: 'Transactions grouped by branch.',
    endpoint: '/api/v1/reports/branch/transactions',
    icon: BarChart3,
    accent: '#0F766E',
    fields: ['dateRange', 'branchId'],
    run: params => reportsAPI.getBranchTransactions(params),
  },
  {
    key: 'account',
    title: 'Account Report',
    description: 'Account summary and current position.',
    endpoint: '/api/v1/reports/account',
    icon: CreditCard,
    accent: '#C9A84C',
    fields: ['accountNumber'],
    run: params => reportsAPI.getAccountReport(params),
  },
  {
    key: 'accountTransactions',
    title: 'Account Transactions',
    description: 'Transaction history for a single account.',
    endpoint: '/api/v1/reports/account/transactions',
    icon: FileText,
    accent: '#DC2626',
    fields: ['dateRange', 'accountNumber'],
    run: params => reportsAPI.getAccountTransactions(params),
  },
  {
    key: 'accountDailyBalance',
    title: 'Daily Balance',
    description: 'Daily balance movement for an account.',
    endpoint: '/api/v1/reports/account/daily-balance',
    icon: CalendarDays,
    accent: '#9333EA',
    fields: ['dateRange', 'accountNumber'],
    run: params => reportsAPI.getAccountDailyBalance(params),
  },
]

function extractPayload(response: unknown): unknown {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as Record<string, unknown>).data
    if (data && typeof data === 'object' && 'data' in data) return (data as Record<string, unknown>).data
    return data
  }
  return response
}

function toRows(payload: unknown): ReportRow[] {
  if (Array.isArray(payload)) return payload.map(item => item && typeof item === 'object' ? item as ReportRow : { value: item })

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const nestedArray = ['items', 'content', 'transactions', 'entries', 'members', 'balances', 'data'].find(key => Array.isArray(record[key]))
    if (nestedArray) {
      return (record[nestedArray] as unknown[]).map(item => item && typeof item === 'object' ? item as ReportRow : { value: item })
    }
    return [record]
  }

  return payload === undefined || payload === null ? [] : [{ value: payload }]
}

function formatHeader(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map(formatValue).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.responseMessage === 'string') return record.responseMessage
    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
  }
  return 'Could not load report.'
}

function getNumericTotal(rows: ReportRow[]): number {
  const priorityKeys = ['total', 'amount', 'balance', 'credit', 'debit', 'value']
  return rows.reduce((sum, row) => {
    const key = priorityKeys.find(name => typeof row[name] === 'number')
    return key ? sum + Number(row[key]) : sum
  }, 0)
}

export default function ReportsPage() {
  const [selectedKey, setSelectedKey] = useState<ReportKey>('contributions')
  const [filters, setFilters] = useState({
    fromDate: monthStart,
    toDate: today,
    branchId: '',
    accountNumber: '',
    memberId: '',
  })
  const [rows, setRows] = useState<ReportRow[]>([])
  const [rawPayload, setRawPayload] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasRun, setHasRun] = useState(false)

  const selectedReport = reports.find(report => report.key === selectedKey) ?? reports[0]
  const Icon = selectedReport.icon

  const columns = useMemo(() => {
    const keys = rows.flatMap(row => Object.keys(row))
    return Array.from(new Set(keys)).slice(0, 10)
  }, [rows])

  const params = useMemo(() => {
    const next: Record<string, string> = {}
    if (selectedReport.fields.includes('dateRange')) {
      next.fromDate = filters.fromDate
      next.toDate = filters.toDate
      next.startDate = filters.fromDate
      next.endDate = filters.toDate
    }
    if (selectedReport.fields.includes('branchId') && filters.branchId.trim()) next.branchId = filters.branchId.trim()
    if (selectedReport.fields.includes('accountNumber') && filters.accountNumber.trim()) next.accountNumber = filters.accountNumber.trim()
    if (selectedReport.fields.includes('memberId') && filters.memberId.trim()) next.memberId = filters.memberId.trim()
    return next
  }, [filters, selectedReport])

  const numericTotal = useMemo(() => getNumericTotal(rows), [rows])

  const selectReport = (key: ReportKey) => {
    setSelectedKey(key)
    setRows([])
    setRawPayload(null)
    setError('')
    setHasRun(false)
  }

  const runReport = async () => {
    setLoading(true)
    setError('')
    setHasRun(true)
    try {
      const response = await selectedReport.run(params)
      const payload = extractPayload(response)
      setRawPayload(payload)
      setRows(toRows(payload))
    } catch (err) {
      setRows([])
      setRawPayload(null)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rawPayload ?? rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedReport.key}-report.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-full bg-[#f8f9fc] p-7" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Reports</h1>
          <p className="mt-0.5 text-xs font-medium text-gray-400">Run contribution, branch, and account reports from the approved API endpoints</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!rawPayload && rows.length === 0}
            onClick={exportJson}
            className="border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button type="button" size="sm" onClick={runReport} disabled={loading} className="bg-[#002663] text-xs text-white hover:bg-[#001f52]">
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Run Report
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Selected Report</p>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${selectedReport.accent}15`, color: selectedReport.accent }}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">{selectedReport.title}</p>
              <p className="truncate text-xs text-gray-400">{selectedReport.endpoint}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Rows Returned</p>
          <p className="text-2xl font-extrabold leading-none text-gray-900">{rows.length.toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-400">{hasRun ? 'Current result set' : 'Run a report to populate results'}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Numeric Total</p>
          <p className="text-2xl font-extrabold leading-none text-[#002663]">{numericTotal.toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-400">Calculated from the first amount-like column found per row</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-gray-100 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Report Type</p>
          </div>
          <div className="max-h-[680px] space-y-1 overflow-auto p-2">
            {reports.map(report => {
              const ReportIcon = report.icon
              const active = report.key === selectedKey
              return (
                <button
                  key={report.key}
                  type="button"
                  onClick={() => selectReport(report.key)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${active ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${report.accent}15`, color: report.accent }}>
                    <ReportIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-gray-900">{report.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-gray-400">{report.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-gray-100 bg-white">
            <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${selectedReport.accent}15`, color: selectedReport.accent }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{selectedReport.title}</h2>
                  <p className="mt-0.5 text-xs text-gray-400">{selectedReport.description}</p>
                </div>
              </div>
              <span className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">{selectedReport.endpoint}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              {selectedReport.fields.includes('dateRange') && (
                <>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">From Date</Label>
                    <Input type="date" value={filters.fromDate} onChange={event => setFilters(prev => ({ ...prev, fromDate: event.target.value }))} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">To Date</Label>
                    <Input type="date" value={filters.toDate} onChange={event => setFilters(prev => ({ ...prev, toDate: event.target.value }))} />
                  </div>
                </>
              )}
              {selectedReport.fields.includes('branchId') && (
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-gray-500">Branch ID</Label>
                  <Input value={filters.branchId} onChange={event => setFilters(prev => ({ ...prev, branchId: event.target.value }))} placeholder="Optional" />
                </div>
              )}
              {selectedReport.fields.includes('accountNumber') && (
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-gray-500">Account Number</Label>
                  <Input value={filters.accountNumber} onChange={event => setFilters(prev => ({ ...prev, accountNumber: event.target.value }))} placeholder="1000234501" className="font-mono" />
                </div>
              )}
              {selectedReport.fields.includes('memberId') && (
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-gray-500">Member ID</Label>
                  <Input value={filters.memberId} onChange={event => setFilters(prev => ({ ...prev, memberId: event.target.value }))} placeholder="Optional" />
                </div>
              )}
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Results</h3>
                <p className="mt-0.5 text-xs text-gray-400">{rows.length} row{rows.length === 1 ? '' : 's'} returned</p>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={!rawPayload && rows.length === 0} onClick={exportJson} className="border-gray-200 text-xs text-gray-600">
                <Download className="h-3.5 w-3.5" />
                Export JSON
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm font-medium text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading report...
              </div>
            ) : rows.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm font-semibold text-gray-500">{hasRun ? 'No rows were returned for this report.' : 'Run a report to view results.'}</p>
                <p className="mt-1 text-xs text-gray-400">Adjust the filters above and run again when needed.</p>
              </div>
            ) : columns.length === 0 ? (
              <pre className="max-h-[520px] overflow-auto p-5 text-xs text-gray-700">{JSON.stringify(rawPayload, null, 2)}</pre>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {columns.map(column => (
                        <th key={column} className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                          {formatHeader(column)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row, index) => (
                      <tr key={index} className="transition-colors hover:bg-gray-50/60">
                        {columns.map(column => (
                          <td key={column} className="max-w-[280px] truncate px-5 py-3.5 text-xs font-medium text-gray-700" title={formatValue(row[column])}>
                            {formatValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
