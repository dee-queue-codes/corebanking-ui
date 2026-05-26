import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { reportsAPI } from '@/services/reports/reportsAPI'

const PAGE_SIZE = 5

interface WithdrawalRow {
  id: number
  accountNumber: string
  displayName: string
  amount: number
  narration: string
  date: string
  reversed: boolean
}

function extractWithdrawals(res: unknown): WithdrawalRow[] {
  if (!res || typeof res !== 'object') return []
  const outer = (res as Record<string, unknown>).data
  if (!outer || typeof outer !== 'object') return []
  const accounts = (outer as Record<string, unknown>).accounts
  if (!Array.isArray(accounts)) return []

  const rows: WithdrawalRow[] = []
  for (const acc of accounts as Record<string, unknown>[]) {
    const accountNumber = (acc.accountNumber as string) || ''
    const txs = acc.transactions
    if (!Array.isArray(txs)) continue
    for (const t of txs as Record<string, unknown>[]) {
      if ((t.entryType as string) !== 'DEBIT') continue
      const rawName = (t.clientName as string | null | undefined)
      rows.push({
        id:            (t.id        as number) || Math.random(),
        accountNumber,
        displayName:   rawName?.trim() || accountNumber || 'N/A',
        amount:        (t.amount    as number) || 0,
        narration:     (t.narration as string) || (t.type as string) || '—',
        date:          (t.date      as string) || '',
        reversed:      !!(t.reversed),
      })
    }
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(2)}K`
  return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(raw: string): string {
  if (!raw) return '—'
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const d = new Date(raw)
  if (d >= today)     return 'Today'
  if (d >= yesterday) return 'Yesterday'
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function WithdrawalsTable() {
  const [rows, setRows]       = useState<WithdrawalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [page, setPage]       = useState(0)

  useEffect(() => {
    reportsAPI.getBranchTransactions({ officeId: 1, window: 'EOD' })
      .then(res => { setRows(extractWithdrawals(res.data)); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const visible    = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const totalAmt   = rows.reduce((s, r) => s + r.amount, 0)

  const thCls = 'px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap'
  const tdCls = 'px-4 py-3 text-xs text-gray-700'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Withdrawals</h3>
          <p className="text-xs text-gray-400 mt-0.5">Today's debit transactions</p>
        </div>
        {!loading && !error && rows.length > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</p>
            <p className="text-sm font-extrabold text-red-500 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              GHS {fmtAmount(totalAmt)}
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={thCls}>Account</th>
              <th className={thCls}>Client</th>
              <th className={thCls}>Narration</th>
              <th className={`${thCls} text-right`}>Amount (GHS)</th>
              <th className={`${thCls} text-right`}>Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-gray-400">Could not load withdrawals.</td></tr>
            )}

            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-gray-400">No withdrawals today.</td></tr>
            )}

            {!loading && !error && visible.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className={tdCls}>
                  <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {row.accountNumber || '—'}
                  </span>
                </td>
                <td className={`${tdCls} font-semibold text-gray-900`}>{row.displayName}</td>
                <td className={`${tdCls} text-gray-400 max-w-50 truncate`}>{row.narration}</td>
                <td className={`${tdCls} text-right font-bold text-red-500`}>
                  <span className="flex items-center justify-end gap-1">
                    <ArrowUpRight className="w-3 h-3 shrink-0" />
                    {fmtAmount(row.amount)}
                  </span>
                </td>
                <td className={`${tdCls} text-right text-gray-400 whitespace-nowrap`}>{fmtDate(row.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50">
          <span className="text-[11px] text-gray-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length} withdrawals
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-colors ${
                  i === page ? 'bg-[#002663] text-white' : 'border border-gray-200 text-gray-400 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages - 1}
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
