import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Download, Search, ChevronDown, MoreVertical,
  CheckCircle2, Clock, XCircle, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { reportsAPI } from '@/services/reports/reportsAPI'
import type { Office } from '@/services/reports/reportsAPI'

// ── Types ─────────────────────────────────────────────────────────────────────

type TxType   = 'Credit' | 'Debit' | 'Transfer'
type TxStatus = 'Completed' | 'Pending' | 'Failed' | 'Reversed'

interface TxRow {
  id: string
  reference: string
  accountNo: string
  clientName: string
  type: TxType
  amount: number
  currency: string
  status: TxStatus
  narration: string
  date: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function nestedName(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') return text((v as Record<string, unknown>).name)
  return ''
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  if (Array.isArray(value)) {
    const [y, m, d] = value as number[]
    if (y && m && d) return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  if (typeof value === 'string') {
    const p = new Date(value)
    if (!Number.isNaN(p.getTime())) return p.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    return value
  }
  return '—'
}

function normaliseType(raw: unknown): TxType {
  const s = text(raw).toLowerCase()
  if (s.includes('credit') || s.includes('deposit')) return 'Credit'
  if (s.includes('debit')  || s.includes('withdraw')) return 'Debit'
  if (s.includes('transfer')) return 'Transfer'
  // entryType fallback
  return 'Credit'
}

function normaliseStatus(raw: unknown, reversed: unknown): TxStatus {
  if (reversed === true) return 'Reversed'
  const s = text(raw).toLowerCase()
  if (s.includes('complet') || s.includes('success')) return 'Completed'
  if (s.includes('pend'))   return 'Pending'
  if (s.includes('fail'))   return 'Failed'
  if (s.includes('revers')) return 'Reversed'
  return 'Completed'
}

function flattenBranchAccounts(r: Record<string, unknown>): unknown[] | null {
  if (Array.isArray(r.accounts)) {
    const rows = (r.accounts as Record<string, unknown>[]).flatMap(acc => {
      if (!Array.isArray(acc.transactions)) return []
      return (acc.transactions as Record<string, unknown>[]).map(tx => ({
        ...tx,
        accountNumber: acc.accountNumber, // inject parent account number
      }))
    })
    if (rows.length > 0) return rows
  }
  return null
}

function extractArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>
    // branch transactions: { accounts: [{ transactions: [] }] }
    const branch = flattenBranchAccounts(r)
    if (branch) return branch
    if (Array.isArray(r.transactions)) return r.transactions
    if (Array.isArray(r.content))      return r.content
    if (Array.isArray(r.data))         return r.data
    if (r.data && typeof r.data === 'object') {
      const d = r.data as Record<string, unknown>
      const branchNested = flattenBranchAccounts(d)
      if (branchNested) return branchNested
      if (Array.isArray(d.transactions)) return d.transactions
      if (Array.isArray(d.content))      return d.content
      if (Array.isArray(d.data))         return d.data
    }
  }
  return []
}

function mapTx(raw: unknown): TxRow {
  const tx = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const entryType = text(tx.entryType)
  const type = normaliseType(tx.type ?? (entryType === 'CREDIT' ? 'Credit' : entryType === 'DEBIT' ? 'Debit' : tx.entryType))
  const clientName = text(tx.clientName) || nestedName(tx.client) || nestedName(tx.account) || '—'
  const paymentType = tx.paymentType as Record<string, unknown> | null | undefined
  const transfer    = tx.transfer    as Record<string, unknown> | null | undefined
  const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
  const narration =
    str(tx.narration) ??
    str(tx.description) ??
    str(paymentType?.name) ??
    str(transfer?.transferDescription) ??
    '—'
  return {
    id:          text(tx.id) || String(Math.random()),
    reference:   text(tx.reference) || text(tx.transactionId) || text(tx.id) || '—',
    accountNo:   text(tx.accountNo) || text(tx.accountNumber) || '—',
    clientName,
    type,
    amount:      Number(tx.amount ?? tx.transactionAmount ?? 0),
    currency:    text(tx.currency) || 'GHS',
    status:      normaliseStatus(tx.status, tx.reversed),
    narration,
    date:        formatDate(tx.date ?? tx.createdAt ?? tx.submittedOnDate),
  }
}

function getApiError(error: unknown): string {
  const err = error as { response?: { data?: unknown }; message?: string }
  const data = err.response?.data
  if (data && typeof data === 'object') {
    const r = data as Record<string, unknown>
    if (typeof r.responseMessage === 'string') return r.responseMessage
    if (typeof r.message         === 'string') return r.message
  }
  return err.message ?? 'Failed to load transactions.'
}

// ── Config ────────────────────────────────────────────────────────────────────

const typeConfig: Record<TxType, { icon: React.ElementType; bg: string; text: string }> = {
  Credit:   { icon: ArrowDownToLine, bg: 'bg-emerald-50', text: 'text-emerald-700' },
  Debit:    { icon: ArrowUpFromLine, bg: 'bg-red-50',     text: 'text-red-700'     },
  Transfer: { icon: ArrowLeftRight,  bg: 'bg-blue-50',    text: 'text-blue-700'    },
}

const statusConfig: Record<TxStatus, { icon: React.ElementType; bg: string; color: string }> = {
  Completed: { icon: CheckCircle2, bg: '#ECFDF5', color: '#059669' },
  Pending:   { icon: Clock,        bg: '#FFFBEB', color: '#B45309' },
  Failed:    { icon: XCircle,      bg: '#FEF2F2', color: '#DC2626' },
  Reversed:  { icon: RefreshCw,    bg: '#F1F5F9', color: '#64748B' },
}

const ALL_TYPES:    Array<'All' | TxType>   = ['All', 'Credit', 'Debit', 'Transfer']
const ALL_STATUSES: Array<'All' | TxStatus> = ['All', 'Completed', 'Pending', 'Failed', 'Reversed']
const PAGE_SIZE = 15

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  const [offices, setOffices]           = useState<Office[]>([])
  const [officeId, setOfficeId]         = useState<number | null>(null)
  const [officeOpen, setOfficeOpen]     = useState(false)
  const officeRef                       = useRef<HTMLDivElement>(null)
  const [txWindow, setTxWindow]         = useState('EOM')

  const [search, setSearch]             = useState('')
  const [typeFilter, setTypeFilter]     = useState<'All' | TxType>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | TxStatus>('All')
  const [typeOpen, setTypeOpen]         = useState(false)
  const [statusOpen, setStatusOpen]     = useState(false)
  const [actionMenu, setActionMenu]     = useState<string | null>(null)
  const [page, setPage]                 = useState(1)

  const typeRef    = useRef<HTMLDivElement>(null)
  const statusRef  = useRef<HTMLDivElement>(null)
  const actionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Load offices once, then set default to first office
  useEffect(() => {
    reportsAPI.getOffices().then(res => {
      const list = (res as { data?: { data?: Office[] } }).data?.data ?? []
      setOffices(list)
      if (list.length > 0) setOfficeId(list[0].id)
    }).catch(() => {})
  }, [])

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = { window: txWindow }
      if (officeId != null) params.officeId = officeId
      const res  = await reportsAPI.getBranchTransactions(params)
      const body = (res as { data?: unknown }).data
      const rows = extractArray(body).map(mapTx)
      setTransactions(rows)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [officeId, txWindow])

  // Fetch whenever officeId is set or changes
  useEffect(() => {
    if (officeId != null) fetchTransactions()
  }, [officeId, txWindow, fetchTransactions])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (officeRef.current && !officeRef.current.contains(e.target as Node)) setOfficeOpen(false)
      if (typeRef.current   && !typeRef.current.contains(e.target as Node))   setTypeOpen(false)
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
      if (actionMenu) {
        const ref = actionRefs.current[actionMenu]
        if (ref && !ref.contains(e.target as Node)) setActionMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [actionMenu])

  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      tx.reference.toLowerCase().includes(q)   ||
      tx.clientName.toLowerCase().includes(q)  ||
      tx.accountNo.toLowerCase().includes(q)   ||
      tx.narration.toLowerCase().includes(q)
    const matchesType   = typeFilter   === 'All' || tx.type   === typeFilter
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalCredit  = filtered.filter(t => t.type === 'Credit'   && t.status === 'Completed').reduce((s, t) => s + t.amount, 0)
  const totalDebit   = filtered.filter(t => t.type === 'Debit'    && t.status === 'Completed').reduce((s, t) => s + t.amount, 0)
  const totalPending = filtered.filter(t => t.status === 'Pending').length

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, typeFilter, statusFilter])

  return (
    <div className="p-7 bg-[#f8f9fc] min-h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Monitor all account transactions across branches</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchTransactions} disabled={loading}
            className="flex items-center gap-2 text-xs border-gray-200 text-gray-600 hover:bg-gray-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" variant="outline"
            className="flex items-center gap-2 text-xs border-gray-200 text-gray-600 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Transactions', value: filtered.length.toString(),                                         sub: 'Matching filters',     color: 'text-gray-900'    },
          { label: 'Total Credits',      value: `GHS ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: 'Completed credits',  color: 'text-emerald-600' },
          { label: 'Total Debits',       value: `GHS ${totalDebit.toLocaleString(undefined,  { minimumFractionDigits: 2 })}`, sub: 'Completed debits',   color: 'text-red-500'     },
          { label: 'Pending',            value: totalPending.toString(),                                            sub: 'Awaiting processing',  color: 'text-orange-500'  },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{card.label}</p>
            <p className={`text-2xl font-extrabold leading-none mb-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference, client, account..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Office filter */}
          {offices.length > 0 && (
            <div className="relative" ref={officeRef}>
              <button onClick={() => { setOfficeOpen(v => !v); setTypeOpen(false); setStatusOpen(false) }}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600 font-medium">
                Office: <span className="text-gray-900">{offices.find(o => o.id === officeId)?.name ?? '—'}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${officeOpen ? 'rotate-180' : ''}`} />
              </button>
              {officeOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[160px]">
                  {offices.map(o => (
                    <button key={o.id} onClick={() => { setOfficeId(o.id); setOfficeOpen(false) }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${officeId === o.id ? 'bg-blue-50 text-[#002663] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                      {o.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Type filter */}
          <div className="relative" ref={typeRef}>
            <button onClick={() => { setTypeOpen(v => !v); setStatusOpen(false) }}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600 font-medium">
              Type: <span className="text-gray-900">{typeFilter}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
            </button>
            {typeOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[130px]">
                {ALL_TYPES.map(t => (
                  <button key={t} onClick={() => { setTypeFilter(t); setTypeOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${typeFilter === t ? 'bg-blue-50 text-[#002663] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="relative" ref={statusRef}>
            <button onClick={() => { setStatusOpen(v => !v); setTypeOpen(false) }}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600 font-medium">
              Status: <span className="text-gray-900">{statusFilter}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[140px]">
                {ALL_STATUSES.map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setStatusOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${statusFilter === s ? 'bg-blue-50 text-[#002663] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Window filter */}
          <select
            value={txWindow}
            onChange={e => setTxWindow(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 transition-all"
          >
            <option value="EOD">End of Day</option>
            <option value="EOW">End of Week</option>
            <option value="EOM">End of Month</option>
          </select>

          <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* States */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading transactions...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm font-semibold text-red-500">{error}</p>
            <button onClick={fetchTransactions} className="text-xs text-[#002663] font-semibold hover:opacity-70">Try again</button>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Account No.', 'Client', 'Type', 'Amount', 'Narration', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                        {transactions.length === 0 ? 'No transactions found.' : 'No results match your filters.'}
                      </td>
                    </tr>
                  ) : paged.map(tx => {
                    const tCfg = typeConfig[tx.type]
                    const sCfg = statusConfig[tx.status]
                    const TIcon = tCfg.icon
                    const SIcon = sCfg.icon
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-[#002663] font-mono">{tx.accountNo}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#002663] flex items-center justify-center shrink-0">
                              <span className="text-white text-[9px] font-bold">
                                {tx.clientName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-800 whitespace-nowrap">{tx.clientName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${tCfg.bg} ${tCfg.text}`}>
                            <TIcon className="w-3 h-3" />
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-bold ${tx.type === 'Credit' ? 'text-emerald-600' : tx.type === 'Debit' ? 'text-red-500' : 'text-gray-800'}`}>
                            {tx.type === 'Credit' ? '+' : tx.type === 'Debit' ? '-' : ''}
                            {tx.currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-500 truncate max-w-[160px] block">{tx.narration}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ background: sCfg.bg, color: sCfg.color }}>
                            <SIcon className="w-3 h-3" />
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-400 whitespace-nowrap">{tx.date}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="relative" ref={el => { actionRefs.current[tx.id] = el }}>
                            <button
                              onClick={() => setActionMenu(prev => prev === tx.id ? null : tx.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {actionMenu === tx.id && (
                              <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[150px]">
                                <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">View Details</button>
                                <button className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">Print Receipt</button>
                                {tx.status === 'Completed' && (
                                  <button className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">Reverse Transaction</button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30">‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) => p === '…'
                      ? <span key={`e${idx}`} className="px-1 text-xs text-gray-400">…</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-[#002663] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                          {p}
                        </button>
                    )}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30">›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
