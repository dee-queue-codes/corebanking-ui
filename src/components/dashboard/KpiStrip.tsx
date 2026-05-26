import { useEffect, useState } from 'react'
import { Users, CreditCard, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { accountsAPI } from '@/services/clients/accountsAPI'
import { clientsAPI } from '@/services/clients/clientsAPI'
import { reportsAPI } from '@/services/reports/reportsAPI'

const TODAY = new Date()
const FROM_DATE = '2000-01-01'
const TO_DATE = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`
const CURRENT_MONTH = TODAY.toLocaleDateString('en', { month: 'short' })

function extractCount(data: unknown): number {
  if (typeof data === 'number') return data
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (typeof d.count === 'number') return d.count
    if (typeof d.data === 'number') return d.data
    if (typeof d.totalElements === 'number') return d.totalElements
  }
  return 0
}

// Response: { success, data: { grandTotal, data: [ { year, month, totalDeposits } ] } }
function extractMonthlyArray(res: unknown): Record<string, unknown>[] {
  if (!res || typeof res !== 'object') return []
  const outer = (res as Record<string, unknown>).data
  if (!outer || typeof outer !== 'object') return []
  const inner = (outer as Record<string, unknown>).data
  return Array.isArray(inner) ? (inner as Record<string, unknown>[]) : []
}

function extractLatestAmount(res: unknown): number {
  const arr = extractMonthlyArray(res)
  if (arr.length === 0) return 0
  const last = arr[arr.length - 1]
  const val = last.totalDeposits ?? last.totalCredits ?? last.amount ?? last.totalAmount ?? 0
  return typeof val === 'number' ? val : Number(val) || 0
}

function fmtAmount(n: number): string {
  if (n >= 1_000_000) return `GHS ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `GHS ${(n / 1_000).toFixed(0)}K`
  return `GHS ${n.toLocaleString()}`
}

interface StatCardProps {
  label: string
  value: string
  sub: string
  up: boolean
  icon: React.ReactNode
  iconBg: string
  loading: boolean
}

function StatCard({ label, value, sub, up, icon, iconBg, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {loading
          ? <div className="h-6 w-20 bg-gray-100 rounded-md animate-pulse mb-1" />
          : <p className="text-xl font-extrabold text-gray-900 leading-none mb-1">{value}</p>
        }
        <div className="flex items-center gap-1">
          {up
            ? <ArrowUpRight className="w-3 h-3 text-emerald-500 shrink-0" />
            : <ArrowDownRight className="w-3 h-3 text-red-400 shrink-0" />}
          <span className={`text-[11px] font-semibold ${up ? 'text-emerald-500' : 'text-red-400'}`}>{sub}</span>
          <span className="text-[11px] text-gray-400">vs last month</span>
        </div>
      </div>
    </div>
  )
}

interface KpiData {
  totalClients: number
  activeAccounts: number
  depositsThisMonth: number
}

export function KpiStrip() {
  const [data, setData] = useState<KpiData>({ totalClients: 0, activeAccounts: 0, depositsThisMonth: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      clientsAPI.getCount(),
      accountsAPI.getActiveCount(),
      reportsAPI.getDepositsMonthly({ fromDate: FROM_DATE, toDate: TO_DATE }),
    ]).then(([clients, accounts, deposits]) => {
      setData({
        totalClients:      clients.status   === 'fulfilled' ? extractCount(clients.value.data)          : 0,
        activeAccounts:    accounts.status  === 'fulfilled' ? extractCount(accounts.value.data)         : 0,
        depositsThisMonth: deposits.status  === 'fulfilled' ? extractLatestAmount(deposits.value.data) : 0,
      })
      setLoading(false)
    })
  }, [])

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard loading={loading} label="Total Clients"            value={data.totalClients.toLocaleString()}     sub="+12.4%" up={true}  iconBg="bg-blue-50"    icon={<Users      className="w-5 h-5 text-blue-600"    />} />
      <StatCard loading={loading} label="Active Accounts"          value={data.activeAccounts.toLocaleString()}   sub="+8.1%"  up={true}  iconBg="bg-violet-50"  icon={<CreditCard className="w-5 h-5 text-violet-600"  />} />
      <StatCard loading={loading} label={`Deposits (${CURRENT_MONTH})`} value={fmtAmount(data.depositsThisMonth)} sub="+25.8%" up={true}  iconBg="bg-emerald-50" icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} />
      <StatCard loading={false}   label="Pending KYC"              value="23"                                     sub="-4.2%"  up={false} iconBg="bg-orange-50"  icon={<Clock      className="w-5 h-5 text-orange-500"  />} />
    </div>
  )
}
