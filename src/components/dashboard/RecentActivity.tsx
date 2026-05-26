import { useEffect, useState } from 'react'
import { reportsAPI } from '@/services/reports/reportsAPI'

interface TxRecord {
  id: number
  clientName: string
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
    const txs = acc.transactions
    if (!Array.isArray(txs)) continue
    for (const t of txs as Record<string, unknown>[]) {
      all.push({
        id:          t.id          as number,
        clientName:  (t.clientName as string)  || 'Unknown',
        narration:   (t.narration  as string)  || (t.type as string) || '—',
        amount:      (t.amount     as number)  || 0,
        entryType:   (t.entryType  as 'DEBIT' | 'CREDIT') || 'CREDIT',
        date:        (t.date       as string)  || '',
        reversed:    !!(t.reversed),
        type:        (t.type       as string)  || '',
      })
    }
  }

  // sort newest first, take last 8
  return all
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return `GHS ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `GHS ${(n / 1_000).toFixed(1)}K`
  return `GHS ${n.toLocaleString()}`
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

const DOT_COLORS: Record<string, string> = {
  CREDIT:   'bg-emerald-400',
  DEBIT:    'bg-blue-400',
  reversed: 'bg-orange-400',
}

function TxSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
        <div className="h-2.5 w-40 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
    </div>
  )
}

export function RecentActivity() {
  const [txs, setTxs]       = useState<TxRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]    = useState(false)

  useEffect(() => {
    reportsAPI.getBranchTransactions({ officeId: 1, window: 'EOD' })
      .then(res => {
        setTxs(extractTransactions(res.data))
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  return (
    <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
          <p className="text-xs text-gray-400 mt-0.5">Latest client & account events</p>
        </div>
        <button className="text-xs font-semibold text-[#002663] hover:opacity-70 transition-opacity">
          View all
        </button>
      </div>

      <div className="space-y-0.5">
        {loading && Array.from({ length: 5 }).map((_, i) => <TxSkeleton key={i} />)}

        {!loading && error && (
          <p className="text-xs text-gray-400 py-6 text-center">Could not load recent activity.</p>
        )}

        {!loading && !error && txs.length === 0 && (
          <p className="text-xs text-gray-400 py-6 text-center">No transactions today.</p>
        )}

        {!loading && !error && txs.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-8 h-8 rounded-full bg-[#002663] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">{initials(tx.clientName)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{tx.clientName}</p>
              <p className="text-[11px] text-gray-400 truncate">
                {tx.entryType === 'CREDIT' ? 'Deposit' : 'Withdrawal'} · {fmtAmount(tx.amount)}
                {tx.narration && tx.narration !== tx.type ? ` · ${tx.narration}` : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${tx.reversed ? DOT_COLORS.reversed : DOT_COLORS[tx.entryType]}`} />
              <span className="text-[10px] text-gray-400">{fmtDate(tx.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
