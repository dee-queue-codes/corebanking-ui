import { useState, useRef, useEffect } from 'react'
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  Download, Search, ChevronDown, MoreVertical,
  CheckCircle2, Clock, XCircle, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  description: string
  date: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockTransactions: TxRow[] = [
  { id: '1',  reference: 'TXN-2024-001', accountNo: '1000234501', clientName: 'Pearl Adzoko',    type: 'Credit',   amount: 4500,   currency: 'GHS', status: 'Completed', description: 'Cash deposit',          date: '07 May 2025'      },
  { id: '2',  reference: 'TXN-2024-002', accountNo: '1000876302', clientName: 'Kwame Mensah',    type: 'Debit',    amount: 1200,   currency: 'GHS', status: 'Completed', description: 'Withdrawal',            date: '06 May 2025'      },
  { id: '3',  reference: 'TXN-2024-003', accountNo: '1000345678', clientName: 'Ama Boateng',     type: 'Transfer', amount: 8000,   currency: 'GHS', status: 'Completed', description: 'Internal transfer',    date: '06 May 2025'      },
  { id: '4',  reference: 'TXN-2024-004', accountNo: '1000192837', clientName: 'Kofi Asare',      type: 'Credit',   amount: 15000,  currency: 'GHS', status: 'Pending',   description: 'Loan disbursement',    date: '05 May 2025'      },
  { id: '5',  reference: 'TXN-2024-005', accountNo: '1000576428', clientName: 'Akosua Owusu',    type: 'Debit',    amount: 300,    currency: 'GHS', status: 'Failed',    description: 'Bill payment',         date: '05 May 2025'      },
  { id: '6',  reference: 'TXN-2024-006', accountNo: '1000284759', clientName: 'Yaw Boakye',      type: 'Credit',   amount: 22000,  currency: 'GHS', status: 'Completed', description: 'Salary credit',        date: '04 May 2025'      },
  { id: '7',  reference: 'TXN-2024-007', accountNo: '1000639182', clientName: 'Efua Darko',      type: 'Transfer', amount: 5500,   currency: 'GHS', status: 'Reversed',  description: 'Erroneous transfer',   date: '04 May 2025'      },
  { id: '8',  reference: 'TXN-2024-008', accountNo: '1000481726', clientName: 'Kwabena Opoku',   type: 'Credit',   amount: 7200,   currency: 'GHS', status: 'Completed', description: 'Cash deposit',         date: '03 May 2025'      },
  { id: '9',  reference: 'TXN-2024-009', accountNo: '1000725394', clientName: 'Abena Frimpong',  type: 'Debit',    amount: 950,    currency: 'GHS', status: 'Pending',   description: 'Mobile money payout',  date: '03 May 2025'      },
  { id: '10', reference: 'TXN-2024-010', accountNo: '1000863527', clientName: 'Kojo Ansah',      type: 'Credit',   amount: 3100,   currency: 'GHS', status: 'Completed', description: 'Cash deposit',         date: '02 May 2025'      },
  { id: '11', reference: 'TXN-2024-011', accountNo: '1000374619', clientName: 'Adwoa Asante',    type: 'Debit',    amount: 1800,   currency: 'GHS', status: 'Completed', description: 'Withdrawal',           date: '02 May 2025'      },
  { id: '12', reference: 'TXN-2024-012', accountNo: '1000951357', clientName: 'Yaa Owusu',       type: 'Transfer', amount: 12500,  currency: 'GHS', status: 'Completed', description: 'External transfer',    date: '01 May 2025'      },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const typeConfig: Record<TxType, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  Credit:   { icon: ArrowDownToLine,  bg: 'bg-emerald-50',  text: 'text-emerald-700', label: 'Credit'   },
  Debit:    { icon: ArrowUpFromLine,  bg: 'bg-red-50',      text: 'text-red-700',     label: 'Debit'    },
  Transfer: { icon: ArrowLeftRight,   bg: 'bg-blue-50',     text: 'text-blue-700',    label: 'Transfer' },
}

const statusConfig: Record<TxStatus, { icon: React.ElementType; bg: string; color: string }> = {
  Completed: { icon: CheckCircle2, bg: '#ECFDF5', color: '#059669' },
  Pending:   { icon: Clock,        bg: '#FFFBEB', color: '#B45309' },
  Failed:    { icon: XCircle,      bg: '#FEF2F2', color: '#DC2626' },
  Reversed:  { icon: RefreshCw,    bg: '#F1F5F9', color: '#64748B' },
}

const ALL_TYPES:   Array<'All' | TxType>   = ['All', 'Credit', 'Debit', 'Transfer']
const ALL_STATUSES: Array<'All' | TxStatus> = ['All', 'Completed', 'Pending', 'Failed', 'Reversed']

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter]     = useState<'All' | TxType>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | TxStatus>('All')
  const [typeOpen, setTypeOpen]         = useState(false)
  const [statusOpen, setStatusOpen]     = useState(false)
  const [actionMenu, setActionMenu]     = useState<string | null>(null)

  const typeRef   = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const actionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const handler = (e: MouseEvent) => {
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

  const filtered = mockTransactions.filter(tx => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      tx.reference.toLowerCase().includes(q) ||
      tx.clientName.toLowerCase().includes(q) ||
      tx.accountNo.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q)
    const matchesType   = typeFilter   === 'All' || tx.type   === typeFilter
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const totalCredit = filtered.filter(t => t.type === 'Credit' && t.status === 'Completed')
    .reduce((s, t) => s + t.amount, 0)
  const totalDebit = filtered.filter(t => t.type === 'Debit' && t.status === 'Completed')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="p-7 bg-[#f8f9fc] min-h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Monitor all account transactions across branches</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-2 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Transactions', value: mockTransactions.length.toString(),                      sub: 'All time',         color: 'text-gray-900' },
          { label: 'Total Credits',      value: `GHS ${totalCredit.toLocaleString()}`,                  sub: 'Completed credits', color: 'text-emerald-600' },
          { label: 'Total Debits',       value: `GHS ${totalDebit.toLocaleString()}`,                   sub: 'Completed debits',  color: 'text-red-500' },
          { label: 'Pending',            value: mockTransactions.filter(t => t.status === 'Pending').length.toString(), sub: 'Awaiting processing', color: 'text-orange-500' },
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
          {/* Search */}
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

          {/* Type filter */}
          <div className="relative" ref={typeRef}>
            <button
              onClick={() => { setTypeOpen(v => !v); setStatusOpen(false) }}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600 font-medium"
            >
              Type: <span className="text-gray-900">{typeFilter}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
            </button>
            {typeOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[130px]">
                {ALL_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTypeFilter(t); setTypeOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${typeFilter === t ? 'bg-blue-50 text-[#002663] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >{t}</button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => { setStatusOpen(v => !v); setTypeOpen(false) }}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-xs text-gray-600 font-medium"
            >
              Status: <span className="text-gray-900">{statusFilter}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[140px]">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setStatusOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${statusFilter === s ? 'bg-blue-50 text-[#002663] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >{s}</button>
                ))}
              </div>
            )}
          </div>

          <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Reference', 'Client', 'Account No.', 'Type', 'Amount', 'Description', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">No transactions found</td>
                </tr>
              ) : filtered.map(tx => {
                const tCfg = typeConfig[tx.type]
                const sCfg = statusConfig[tx.status]
                const TIcon = tCfg.icon
                const SIcon = sCfg.icon
                return (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-[#002663]">{tx.reference}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#002663] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[9px] font-bold">
                            {tx.clientName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-800 whitespace-nowrap">{tx.clientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-600 font-mono">{tx.accountNo}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${tCfg.bg} ${tCfg.text}`}>
                        <TIcon className="w-3 h-3" />
                        {tCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold ${tx.type === 'Credit' ? 'text-emerald-600' : tx.type === 'Debit' ? 'text-red-500' : 'text-gray-800'}`}>
                        {tx.type === 'Credit' ? '+' : tx.type === 'Debit' ? '-' : ''}
                        {tx.currency} {tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-500 truncate max-w-[160px] block">{tx.description}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: sCfg.bg, color: sCfg.color }}>
                        <SIcon className="w-3 h-3" />
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{tx.date}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className="relative"
                        ref={el => { actionRefs.current[tx.id] = el }}
                      >
                        <button
                          onClick={() => setActionMenu(prev => prev === tx.id ? null : tx.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                        >
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

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100">
            <span className="text-xs text-gray-400">Showing {filtered.length} of {mockTransactions.length} transactions</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === 1 ? 'bg-[#002663] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
