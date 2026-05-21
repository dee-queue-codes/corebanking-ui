import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  Filter,
  RefreshCw,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import { reportsAPI } from '@/services/reports/reportsAPI'
import type { Office } from '@/services/reports/reportsAPI'
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

type CategoryKey = 'contributions' | 'account' | 'branch'

type ReportRow = Record<string, unknown>
type ReportField = 'dateRange' | 'officeId' | 'accountNumber' | 'memberId' | 'window'

const WINDOW_OPTIONS = [
  { value: 'EOD', label: 'End of Day' },
  { value: 'EOW', label: 'End of Week' },
  { value: 'EOM', label: 'End of Month' },
  { value: 'CUSTOM_RANGE', label: 'Custom Range' },
]

interface ReportConfig {
  key: ReportKey
  title: string
  description: string
  icon: typeof BarChart3
  fields: ReportField[]
  run: (params: Record<string, string>) => Promise<unknown>
  transform?: (payload: unknown, params: Record<string, string>) => ReportRow[]
}

interface Category {
  key: CategoryKey
  label: string
  icon: typeof BarChart3
  reports: ReportConfig[]
}

const today = new Date().toISOString().split('T')[0]
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

function formatDateForApi(date: string): string {
  return date // HTML date inputs already produce yyyy-MM-dd which the backend expects
}

const categories: Category[] = [
  {
    key: 'contributions',
    label: 'Contributions',
    icon: Wallet,
    reports: [
      {
        key: 'contributions',
        title: 'All Contributions',
        description: 'Total contributions across all products.',
        icon: Wallet,
        fields: ['dateRange'],
        run: params => reportsAPI.getContributions(params),
        transform: (payload, params) => {
          if (!payload || typeof payload !== 'object') return toRows(payload)
          const record = payload as Record<string, unknown>
          const products = Array.isArray(record.products) ? record.products as Record<string, unknown>[] : []
          if (products.length === 0) return toRows(payload)
          const fromDate = record.fromDate === 'ALL' ? (params.fromDate ?? params.startDate ?? 'ALL') : record.fromDate
          return products.map(p => ({
            productName: p.productName,
            fromDate,
            toDate: record.toDate,
            totalContributions: p.totalContributions,
          }))
        },
      },
      {
        key: 'contributionMembers',
        title: 'Contributions Member',
        description: 'Member-level contribution breakdown.',
        icon: Users,
        fields: ['dateRange', 'memberId'],
        run: params => reportsAPI.getContributionMembers(params),
        transform: (payload, params) => {
          if (!payload || typeof payload !== 'object') return toRows(payload)
          const record = payload as Record<string, unknown>
          const members = Array.isArray(record.members) ? record.members as Record<string, unknown>[] : []
          if (members.length === 0) return toRows(payload)
          const fromDate = record.fromDate === 'ALL' ? (params.fromDate ?? params.startDate ?? 'ALL') : record.fromDate
          return members.map(m => ({
            clientName: m.clientName,
            productName: m.productName,
            fromDate,
            toDate: record.toDate,
            totalContributions: m.totalContributions,
          }))
        },
      },
    ],
  },
  {
    key: 'account',
    label: 'Account',
    icon: CreditCard,
    reports: [
      {
        key: 'account',
        title: 'Account Report',
        description: 'Account summary and current position.',
        icon: CreditCard,
        fields: ['accountNumber', 'window'],
        run: params => reportsAPI.getAccountReport(params),
      },
      {
        key: 'accountTransactions',
        title: 'Account Transactions',
        description: 'Transaction history for a single account.',
        icon: FileText,
        fields: ['accountNumber', 'window'],
        run: params => reportsAPI.getAccountTransactions(params),
        transform: (payload) => {
          if (!payload || typeof payload !== 'object') return toRows(payload)
          const record = payload as Record<string, unknown>
          const transactions = Array.isArray(record.transactions) ? record.transactions as Record<string, unknown>[] : []
          if (transactions.length === 0) return toRows(payload)
          return transactions.map(t => ({
            date: t.date,
            type: t.type,
            entryType: t.entryType,
            amount: t.amount,
            runningBalance: t.runningBalance,
            narration: t.narration ?? t.note ?? t.description ?? (t.transfer && typeof t.transfer === 'object' ? (t.transfer as Record<string,unknown>).transferDescription : undefined) ?? '-',
            reversed: t.reversed ? 'Yes' : 'No',
          }))
        },
      },
      {
        key: 'accountDailyBalance',
        title: 'Daily Balance',
        description: 'Daily balance movement for an account.',
        icon: CalendarDays,
        fields: ['dateRange', 'accountNumber'],
        run: params => reportsAPI.getAccountDailyBalance(params),
        transform: (payload) => {
          if (!payload || typeof payload !== 'object') return toRows(payload)
          const record = payload as Record<string, unknown>
          const balances = Array.isArray(record.dailyBalances) ? record.dailyBalances as Record<string, unknown>[] : []
          if (balances.length === 0) return toRows(payload)
          return balances.map(b => ({ ...b, accountNumber: record.accountNumber }))
        },
      },
    ],
  },
  {
    key: 'branch',
    label: 'Branch',
    icon: Building2,
    reports: [
      {
        key: 'branch',
        title: 'Branch Report',
        description: 'Branch-level balances and activity.',
        icon: Building2,
        fields: ['officeId', 'window'],
        run: params => reportsAPI.getBranchReport(params),
      },
      {
        key: 'branchTransactions',
        title: 'Branch Transactions',
        description: 'Transactions grouped by branch.',
        icon: BarChart3,
        fields: ['officeId', 'window'],
        run: params => reportsAPI.getBranchTransactions(params),
        transform: (payload) => {
          if (!payload || typeof payload !== 'object') return toRows(payload)
          const record = payload as Record<string, unknown>
          const accounts = Array.isArray(record.accounts) ? record.accounts as Record<string, unknown>[] : []
          if (accounts.length === 0) return toRows(payload)
          return accounts.flatMap(acc => {
            const txs = Array.isArray(acc.transactions) ? acc.transactions as Record<string, unknown>[] : []
            if (txs.length === 0) return []
            return txs.map(tx => {
              const paymentType = tx.paymentType as Record<string, unknown> | null | undefined
              const transfer    = tx.transfer    as Record<string, unknown> | null | undefined
              const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
              const narration =
                str(tx.narration) ??
                str(tx.note) ??
                str(tx.description) ??
                str(paymentType?.name) ??
                str(transfer?.transferDescription) ??
                '—'
              return {
                accountNumber:  acc.accountNumber,
                date:           tx.date,
                type:           tx.type,
                entryType:      tx.entryType,
                amount:         tx.amount,
                runningBalance: tx.runningBalance,
                narration,
                reversed:       tx.reversed ? 'Yes' : 'No',
              }
            })
          })
        },
      },
    ],
  },
]

const AMOUNT_KEYWORDS = ['amount', 'total', 'balance', 'contribution', 'credit', 'debit', 'value', 'fee', 'charge', 'payment', 'deposit', 'withdrawal']

function isAmountColumn(col: string): boolean {
  const lower = col.toLowerCase()
  return AMOUNT_KEYWORDS.some(k => lower.includes(k))
}

function extractPayload(response: unknown): unknown {
  if (response && typeof response === 'object' && 'data' in response) {
    const body = (response as Record<string, unknown>).data
    if (body && typeof body === 'object' && 'data' in body) return (body as Record<string, unknown>).data
    return body
  }
  return response
}

function toRows(payload: unknown): ReportRow[] {
  if (Array.isArray(payload)) return payload.map(item => item && typeof item === 'object' ? item as ReportRow : { value: item })
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const nestedKey = ['items', 'content', 'transactions', 'entries', 'members', 'balances', 'data', 'accounts', 'dailyBalances'].find(k => Array.isArray(record[k]))
    if (nestedKey) return (record[nestedKey] as unknown[]).map(item => item && typeof item === 'object' ? item as ReportRow : { value: item })
    return [record]
  }
  return payload === undefined || payload === null ? [] : [{ value: payload }]
}

function formatHeader(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatValue(value: unknown, asAmount = false): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') {
    if (asAmount) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return value.toLocaleString()
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map(v => formatValue(v)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const NO_TOTAL_KEYWORDS = ['runningbalance', 'balance', 'runningbal']

function columnTotal(rows: ReportRow[], col: string): number | null {
  const lower = col.toLowerCase().replace(/[^a-z]/g, '')
  if (NO_TOTAL_KEYWORDS.some(k => lower === k || lower.includes('running'))) return null
  if (!rows.every(r => typeof r[col] === 'number')) return null
  return rows.reduce((sum, r) => sum + Number(r[col]), 0)
}

function getErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: unknown }; message?: string }
  const data = err.response?.data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.responseMessage === 'string' && record.responseMessage) return record.responseMessage
    if (typeof record.message === 'string' && record.message) return record.message
    if (typeof record.error === 'string' && record.error) return record.error
  }
  if (typeof err.message === 'string' && err.message) return err.message
  return 'Could not load report. Check your inputs and try again.'
}

const CATEGORY_COLORS: Record<CategoryKey, string> = {
  contributions: '#059669',
  account: '#1565C0',
  branch: '#7C3AED',
}

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('contributions')
  const [selectedKey, setSelectedKey] = useState<ReportKey>('contributions')

  const [filters, setFilters] = useState({
    startDate: monthStart,
    endDate: today,
    officeId: '',
    accountNumber: '',
    memberId: '',
    window: 'EOM',
  })

  const [offices, setOffices] = useState<Office[]>([])

  useEffect(() => {
    reportsAPI.getOffices()
      .then(res => {
        const body = (res as { data?: { data?: Office[] } }).data
        setOffices(body?.data ?? [])
      })
      .catch(() => {})
  }, [])

  const [rows, setRows] = useState<ReportRow[]>([])
  const [rawPayload, setRawPayload] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasRun, setHasRun] = useState(false)
  const [tableFilters, setTableFilters] = useState<Record<string, string>>({})
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentCategory = categories.find(c => c.key === selectedCategory) ?? categories[0]
  const selectedReport = currentCategory.reports.find(r => r.key === selectedKey) ?? currentCategory.reports[0]
  const Icon = selectedReport.icon
  const accentColor = CATEGORY_COLORS[selectedCategory]

  const EXCLUDED_COLUMNS = new Set(['officeId', 'accountNumber'])

  const columns = useMemo(() => {
    const keys = rows.flatMap(row => Object.keys(row))
    return Array.from(new Set(keys)).filter(k => !EXCLUDED_COLUMNS.has(k)).slice(0, 12)
  }, [rows])

  const columnUniqueValues = useMemo(() => {
    const result: Record<string, string[]> = {}
    columns.forEach(col => {
      if (isAmountColumn(col)) return
      const vals = Array.from(new Set(rows.map(r => String(r[col] ?? '')).filter(Boolean)))
      if (vals.length > 1 && vals.length <= 50) result[col] = vals.sort()
    })
    return result
  }, [rows, columns])

  const filteredRows = useMemo(() => {
    const active = Object.entries(tableFilters).filter(([, v]) => v !== '')
    if (active.length === 0) return rows
    return rows.filter(row => active.every(([col, val]) => String(row[col] ?? '') === val))
  }, [rows, tableFilters])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const params = useMemo(() => {
    const next: Record<string, string> = {}
    const fmtStart = formatDateForApi(filters.startDate)
    const fmtEnd = formatDateForApi(filters.endDate)

    if (selectedReport.fields.includes('dateRange')) {
      // Send both naming conventions — endpoints differ
      next.startDate = fmtStart
      next.endDate = fmtEnd
      next.fromDate = fmtStart
      next.toDate = fmtEnd
    }
    if (selectedReport.fields.includes('window')) {
      next.window = filters.window
      if (filters.window === 'CUSTOM_RANGE') {
        next.fromDate = fmtStart
        next.toDate = fmtEnd
        next.startDate = fmtStart
        next.endDate = fmtEnd
      }
    }
    if (selectedReport.fields.includes('officeId') && filters.officeId.trim()) next.officeId = filters.officeId.trim()
    if (selectedReport.fields.includes('accountNumber') && filters.accountNumber.trim()) next.accountNumber = filters.accountNumber.trim()
    if (selectedReport.fields.includes('memberId') && filters.memberId.trim()) next.memberId = filters.memberId.trim()
    return next
  }, [filters, selectedReport])

  const selectCategory = (key: CategoryKey) => {
    const cat = categories.find(c => c.key === key)!
    setSelectedCategory(key)
    setSelectedKey(cat.reports[0].key)
    setRows([])
    setRawPayload(null)
    setError('')
    setHasRun(false)
    setTableFilters({})
    setFilterOpen(false)
    setCurrentPage(1)
  }

  const selectReport = (key: ReportKey) => {
    setSelectedKey(key)
    setRows([])
    setRawPayload(null)
    setError('')
    setHasRun(false)
    setTableFilters({})
    setFilterOpen(false)
    setCurrentPage(1)
  }

  const runReport = async () => {
    setLoading(true)
    setError('')
    setHasRun(true)
    try {
      const response = await selectedReport.run(params)
      const payload = extractPayload(response)
      setRawPayload(payload)
      setRows(selectedReport.transform ? selectedReport.transform(payload, params) : toRows(payload))
      setCurrentPage(1)
    } catch (err) {
      console.error('[ReportsPage] error:', err)
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
    <div className="flex h-full flex-col bg-[#f8f9fc]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex h-full">

        {/* ── Right sidebar ── */}
        <aside className="order-last flex w-72 shrink-0 flex-col gap-5 border-l border-gray-200 bg-white p-6 overflow-y-auto">
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-gray-900">Reports</h1>
            <p className="mt-0.5 text-xs font-medium text-gray-400">Run contribution, branch, and account reports</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" size="lg" onClick={runReport} disabled={loading} className="w-full bg-[#002663] text-base font-bold text-white hover:bg-[#001f52]">
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5 shrink-0" />}
              Run Report
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!rawPayload && rows.length === 0} onClick={exportJson} className="w-full border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
              <Download className="h-3.5 w-3.5" />Export
            </Button>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Category</p>
            {categories.map(cat => {
              const CatIcon = cat.icon
              const active = cat.key === selectedCategory
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => selectCategory(cat.key)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors text-left"
                  style={active
                    ? { backgroundColor: CATEGORY_COLORS[cat.key], color: '#fff' }
                    : { color: '#374151' }}
                >
                  <CatIcon className="h-4 w-4 shrink-0" />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Report Type */}
          {currentCategory.reports.length > 1 && (
            <div className="flex flex-col gap-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Report Type</p>
              {currentCategory.reports.map(report => {
                const active = report.key === selectedKey
                return (
                  <button
                    key={report.key}
                    type="button"
                    onClick={() => selectReport(report.key)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left"
                    style={active
                      ? { backgroundColor: `${accentColor}12`, color: accentColor, fontWeight: 700 }
                      : { color: '#6b7280' }}
                  >
                    {report.title}
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        {/* ── Right content ── */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">

          {/* Filter bar */}
          <div className="flex items-end justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900">Reports</h2>
              <p className="mt-0.5 text-xs text-gray-400">Run contribution, branch, and account reports</p>
            </div>
            <div className="flex items-end gap-3">
              {selectedReport.fields.includes('window') && (
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-gray-500">Window</Label>
                  <select
                    value={filters.window}
                    onChange={e => setFilters(p => ({ ...p, window: e.target.value }))}
                    className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {WINDOW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )}
              {selectedReport.fields.includes('officeId') && (
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-gray-500">Office / Branch</Label>
                  <select
                    value={filters.officeId}
                    onChange={e => setFilters(p => ({ ...p, officeId: e.target.value }))}
                    className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select office</option>
                    {offices.map(o => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
                  </select>
                </div>
              )}
              {selectedReport.fields.includes('accountNumber') && (
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-gray-500">Account Number</Label>
                  <Input value={filters.accountNumber} onChange={e => setFilters(p => ({ ...p, accountNumber: e.target.value }))} placeholder="1000234501" className="w-40 font-mono" />
                </div>
              )}
              {selectedReport.fields.includes('memberId') && (
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-gray-500">Member ID</Label>
                  <Input value={filters.memberId} onChange={e => setFilters(p => ({ ...p, memberId: e.target.value }))} placeholder="Optional" className="w-32" />
                </div>
              )}
              {(selectedReport.fields.includes('dateRange') || (selectedReport.fields.includes('window') && filters.window === 'CUSTOM_RANGE')) && (
                <>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">Start Date</Label>
                    <Input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="w-40" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium text-gray-500">End Date</Label>
                    <Input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="w-40" />
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</div>
          )}

          {/* Results table */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {/* Table header bar */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{selectedReport.title}</h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  {hasRun
                    ? `${filteredRows.length}${filteredRows.length !== rows.length ? ` of ${rows.length}` : ''} row${filteredRows.length === 1 ? '' : 's'}`
                    : 'Run the report to see results'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {rows.length > 0 && Object.keys(columnUniqueValues).length > 0 && (
                  <div className="relative" ref={filterRef}>
                    <button
                      type="button"
                      onClick={() => setFilterOpen(o => !o)}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors"
                      style={Object.values(tableFilters).some(v => v)
                        ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}10` }
                        : { borderColor: '#e5e7eb', color: '#6b7280', backgroundColor: '#fff' }}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Filter
                      {Object.values(tableFilters).filter(Boolean).length > 0 && (
                        <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: accentColor }}>
                          {Object.values(tableFilters).filter(Boolean).length}
                        </span>
                      )}
                    </button>
                    {filterOpen && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-3 shadow-lg space-y-3">
                        {Object.entries(columnUniqueValues).map(([col, vals]) => (
                          <div key={col}>
                            <Label className="mb-1 block text-xs font-medium text-gray-500">{formatHeader(col)}</Label>
                            <select
                              value={tableFilters[col] ?? ''}
                              onChange={e => { setTableFilters(p => ({ ...p, [col]: e.target.value })); setFilterOpen(false); setCurrentPage(1) }}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">All</option>
                              {vals.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                        ))}
                        {Object.values(tableFilters).some(Boolean) && (
                          <button
                            type="button"
                            onClick={() => { setTableFilters({}); setCurrentPage(1) }}
                            className="w-full rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" disabled={rows.length === 0} onClick={exportJson} className="border-gray-200 text-xs text-gray-600">
                  <Download className="h-3.5 w-3.5" />Export JSON
                </Button>
              </div>
            </div>

            {/* Table body */}
            {loading ? (
              <div className="flex flex-1 items-center justify-center gap-2 py-20 text-sm font-medium text-gray-400">
                <RefreshCw className="h-4 w-4 animate-spin" />Loading report...
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
                <p className="text-sm font-semibold text-gray-500">{hasRun ? 'No data returned for this report.' : 'Run a report to view results.'}</p>
                <p className="mt-1 text-xs text-gray-400">Set your filters and click Run Report.</p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-16 text-center">
                <p className="text-sm font-semibold text-gray-500">No results match your filter.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {columns.map(col => (
                          <th key={col} className={`whitespace-nowrap px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500 ${isAmountColumn(col) ? 'text-right' : 'text-left'}`}>
                            {formatHeader(col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pagedRows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          {columns.map((col, ci) => {
                            const val = row[col]
                            const formatted = formatValue(val, isAmountColumn(col))

                            // Entry type badge
                            if (col === 'entryType') {
                              const et = String(val ?? '').toUpperCase()
                              const isCredit = et === 'CREDIT'
                              const isDebit  = et === 'DEBIT'
                              return (
                                <td key={col} className="px-5 py-3">
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '3px 10px', borderRadius: 20,
                                    fontSize: 11, fontWeight: 600,
                                    background: isCredit ? '#ECFDF5' : isDebit ? '#FEF2F2' : '#F1F5F9',
                                    color:      isCredit ? '#059669' : isDebit ? '#DC2626' : '#6b7280',
                                  }}>
                                    {isCredit && <span style={{ fontSize: 10 }}>↓</span>}
                                    {isDebit  && <span style={{ fontSize: 10 }}>↑</span>}
                                    {formatted}
                                  </span>
                                </td>
                              )
                            }

                            // Type column — colour by value
                            if (col === 'type') {
                              const tv = String(val ?? '').toLowerCase()
                              const color = tv.includes('deposit') ? '#1565C0' : tv.includes('withdraw') ? '#DC2626' : '#374151'
                              return (
                                <td key={col} className="px-5 py-4 text-sm font-medium" style={{ color }}>
                                  {formatted}
                                </td>
                              )
                            }

                            // Reversed — dot pill
                            if (col === 'reversed') {
                              const isYes = String(val).toLowerCase() === 'yes'
                              return (
                                <td key={col} className="px-5 py-3">
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: 12, fontWeight: 500,
                                    color: isYes ? '#6b7280' : '#059669',
                                  }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isYes ? '#9ca3af' : '#059669', flexShrink: 0 }} />
                                    {isYes ? 'Reversed' : 'Completed'}
                                  </span>
                                </td>
                              )
                            }

                            return (
                              <td
                                key={col}
                                className={`px-5 py-4 text-sm ${isAmountColumn(col) ? 'text-right tabular-nums font-semibold text-gray-800' : ci === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
                                title={formatted}
                              >
                                {formatted}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                    {columns.some(col => columnTotal(filteredRows, col) !== null) && (
                      <tfoot>
                        <tr style={{ borderTop: `2px solid ${accentColor}`, background: `${accentColor}08` }}>
                          {columns.map((col, i) => {
                            const total = columnTotal(filteredRows, col)
                            return (
                              <td
                                key={col}
                                className={`px-5 py-4 ${isAmountColumn(col) ? 'text-right tabular-nums' : ''}`}
                              >
                                {i === 0 ? (
                                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accentColor }}>
                                    Total
                                  </span>
                                ) : total !== null ? (
                                  <span style={{ fontSize: 14, fontWeight: 800, color: accentColor, fontFamily: "'Sora', sans-serif" }}>
                                    {formatValue(total, isAmountColumn(col))}
                                  </span>
                                ) : ''}
                              </td>
                            )
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
                    <p className="text-xs text-gray-400">
                      Page {currentPage} of {totalPages} &middot; {filteredRows.length} rows
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      >«</button>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      >‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
                          acc.push(p)
                          return acc
                        }, [])
                        .map((p, idx) =>
                          p === '…'
                            ? <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400">…</span>
                            : (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setCurrentPage(p as number)}
                                className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                                style={p === currentPage
                                  ? { backgroundColor: accentColor, color: '#fff' }
                                  : { color: '#6b7280' }}
                              >{p}</button>
                            )
                        )}
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      >›</button>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      >»</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
          </div>
        </main>
      </div>
    </div>
  )
}
