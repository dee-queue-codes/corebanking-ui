import { useState } from 'react'
import { KpiStrip } from '@/components/dashboard/KpiStrip'
import { TxVolumeChart } from '@/components/dashboard/TxVolumeChart'
import { ClientGrowthChart } from '@/components/dashboard/ClientGrowthChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickAction } from '@/components/dashboard/QuickAction'
import { CashTransactionDrawer, type CashTxType } from '@/components/dashboard/CashTransactionDrawer'

export default function DashboardPage() {
  const [cashTxType, setCashTxType] = useState<CashTxType | null>(null)

  return (
    <div className="p-7 bg-[#f8f9fc] min-h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Welcome back — here's what's happening today.</p>
        </div>
        <span className="px-4 py-1.5 bg-blue-50 text-blue-500 border border-blue-100 rounded-lg text-xs font-semibold opacity-50 cursor-not-allowed pointer-events-none select-none">
          Teller Account
        </span>
      </div>

      {/* KPI strip — fetches active account count, client count, deposits */}
      <KpiStrip />

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4">

        {/* Quick Actions */}
        <div className="col-span-1">
          <QuickAction
            className="h-full"
            onCashDeposit={() => setCashTxType('deposit')}
            onCashWithdraw={() => setCashTxType('withdraw')}
          />
        </div>

        {/* Transaction Volume — fetches deposits + credits monthly */}
        <TxVolumeChart />

        {/* Client Growth */}
        <ClientGrowthChart />

        {/* Recent Activity */}
        <RecentActivity />

      </div>

      <CashTransactionDrawer type={cashTxType} onClose={() => setCashTxType(null)} />
    </div>
  )
}
