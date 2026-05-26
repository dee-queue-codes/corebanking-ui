import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { KpiStrip } from '@/components/dashboard/KpiStrip'
import { TxVolumeChart } from '@/components/dashboard/TxVolumeChart'
import { ClientGrowthChart } from '@/components/dashboard/ClientGrowthChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { WithdrawalsTable } from '@/components/dashboard/WithdrawalsTable'
import { QuickAction } from '@/components/dashboard/QuickAction'
import { CashTransactionDrawer, type CashTxType } from '@/components/dashboard/CashTransactionDrawer'

export default function DashboardPage() {
  const [cashTxType, setCashTxType] = useState<CashTxType | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  function handleRefresh() {
    setRefreshing(true)
    setRefreshKey(k => k + 1)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div className="p-4 sm:p-5 lg:p-7 bg-[#f8f9fc] min-h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Welcome back — here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <span className="hidden sm:inline px-4 py-1.5 bg-blue-50 text-blue-500 border border-blue-100 rounded-lg text-xs font-semibold opacity-50 cursor-not-allowed pointer-events-none select-none">
            Teller Account
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <KpiStrip key={refreshKey} />

      {/* Main grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Quick Actions */}
        <div className="col-span-1">
          <QuickAction
            className="h-full"
            onCashDeposit={() => setCashTxType('deposit')}
            onCashWithdraw={() => setCashTxType('withdraw')}
          />
        </div>

        {/* Transaction Volume */}
        <TxVolumeChart key={refreshKey} />

        {/* Client Growth */}
        <ClientGrowthChart />

        {/* Recent Activity */}
        <RecentActivity key={refreshKey} />

      </div>

      {/* Withdrawals Table */}
      <div className="mt-4">
        <WithdrawalsTable key={refreshKey} />
      </div>

      <CashTransactionDrawer type={cashTxType} onClose={() => setCashTxType(null)} />
    </div>
  )
}
