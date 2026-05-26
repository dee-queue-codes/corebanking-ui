import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { reportsAPI } from '@/services/reports/reportsAPI'
import { clientsAPI } from '@/services/clients/clientsAPI'

const PAGE_SIZE = 4

interface TxRecord {
  id: number
  clientId: string
  displayName: string
  accountNumber: string
  narration: string
  amount: number
  entryType: 'DEBIT' | 'CREDIT'
  date: string
  reversed: boolean
  type: string
}

function extractTransactions(res: unknown): TxRecord[] {
  if (!res || typeof res !== 'object') return []
  const outer = (res as Record<string, unknown>).data
  if (!outer || typeof outer !== 'object') return []
  const accounts = (outer as Record<string, unknown>).accounts
  if (!Array.isArray(accounts)) return []

  const all: TxRecord[] = []
  for (const acc of accounts as Record<string, unknown>[]) {
    const accountNumber = (acc.accountNumber as string) || ''
    const txs = acc.transactions
    if (!Array.isArray(txs)) continue
    for (const t of txs as Record<string, unknown>[]) {
      const rawName = (t.clientName as string | null | undefined)
      all.push({
        id:            (t.id        as number) || Math.random(),
        clientId:      String(t.clientId ?? ''),
        displayName:   rawName?.trim() || accountNumber || 'N/A',
        accountNumber,
        narration:     (t.narration as string) || '—',
        amount:        (t.amount    as number) || 0,
        entryType:     (t.entryType as 'DEBIT' | 'CREDIT') || 'CREDIT',
        date:          (t.date      as string) || '',
        reversed:      !!(t.reversed),
        type:          (t.type      as string) || '',
      })
    }
  }

  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function initials(name: string): string {
  return name.split(/[\s-]/).map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'
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
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
}

function TxSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-50">
      <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-2.5 w-44 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function RecentActivity() {
  const [txs, setTxs]         = useState<TxRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [page, setPage]       = useState(0)

  useEffect(() => {
    reportsAPI.getBranchTransactions({ officeId: 1, window: 'EOD' })
      .then(async res => {
        const raw = extractTransactions(res.data)

        // Batch-fetch client names for unique clientIds
        const uniqueIds = [...new Set(raw.map(t => t.clientId).filter(Boolean))]
        const clientMap = new Map<string, string>()

        await Promise.allSettled(
          uniqueIds.map(id =>
            clientsAPI.getById(id).then(r => {
              const c = r.data as Record<string, unknown>
              const first = (c.firstName as string) || ''
              const last  = (c.lastName  as string) || ''
              const full  = `${first} ${last}`.trim()
              if (full) clientMap.set(id, full)
            })
          )
        )

        // Apply resolved names
        const resolved = raw.map(t => ({
          ...t,
          displayName: clientMap.get(t.clientId) || t.displayName,
        }))

        setTxs(resolved)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  const totalPages = Math.ceil(txs.length / PAGE_SIZE)
  const visible    = txs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="col-span-1 sm:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
          <p className="text-xs text-gray-400 mt-0.5">Latest client & account events</p>
        </div>
        <button className="text-xs font-semibold text-[#002663] hover:opacity-70 transition-opacity">View all</button>
      </div>

      {/* Column headers */}
      {!loading && !error && txs.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-1 pb-1.5 border-b border-gray-100">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Client / Account</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Amount (GHS)</span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right w-16">Type</span>
        </div>
      )}

      {/* List */}
      <div className="min-h-[200px]">
        {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => <TxSkeleton key={i} />)}

        {!loading && error && (
          <p className="text-xs text-gray-400 py-10 text-center">Could not load recent activity.</p>
        )}

        {!loading && !error && txs.length === 0 && (
          <p className="text-xs text-gray-400 py-10 text-center">No transactions today.</p>
        )}

        {!loading && !error && visible.map(tx => {
          const isCredit = tx.entryType === 'CREDIT'
          return (
            <div key={tx.id} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center py-3 border-b border-gray-50 last:border-0">

              {/* Left — avatar + name + account + narration */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <span className={`text-[11px] font-bold ${isCredit ? 'text-emerald-700' : 'text-red-600'}`}>
                    {initials(tx.displayName)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{tx.displayName}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {tx.accountNumber && <span className="font-medium text-gray-500">{tx.accountNumber}</span>}
                    {tx.accountNumber && tx.narration !== '—' && <span className="mx-1">·</span>}
                    {tx.narration !== '—' && tx.narration}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{fmtDate(tx.date)}</p>
                </div>
              </div>

              {/* Center — amount */}
              <div className="flex items-center gap-1 justify-end">
                {isCredit
                  ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  : <ArrowUpRight  className="w-3.5 h-3.5 text-red-500     shrink-0" />
                }
                <span className={`text-sm font-bold tabular-nums ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtAmount(tx.amount)}
                </span>
              </div>

              {/* Right — badge */}
              <div className="w-16 flex justify-end">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  tx.reversed
                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                    : isCredit
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {tx.reversed ? 'Reversed' : isCredit ? 'Credit' : 'Debit'}
                </span>
              </div>

            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-[11px] text-gray-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, txs.length)} of {txs.length}
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
