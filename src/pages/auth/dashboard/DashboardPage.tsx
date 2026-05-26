import { useState } from 'react'
import { KpiStrip } from '@/components/dashboard/KpiStrip'
import { TxVolumeChart } from '@/components/dashboard/TxVolumeChart'
import { ClientGrowthChart } from '@/components/dashboard/ClientGrowthChart'
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
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest client & account events</p>
            </div>
            <button className="text-xs font-semibold text-[#002663] hover:opacity-70 transition-opacity">View all</button>
          </div>
          <div className="space-y-0.5">
            {[
              { name: 'Pearl Adzoko',  action: 'Account activated',        time: '2 min ago',  type: 'success' },
              { name: 'Kwame Mensah',  action: 'KYC documents submitted',  time: '18 min ago', type: 'info'    },
              { name: 'Ama Boateng',   action: 'Deposit · GHS 4,500',      time: '1 hr ago',   type: 'success' },
              { name: 'Kofi Asare',    action: 'Loan application pending',  time: '2 hr ago',   type: 'warning' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-[#002663] flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">
                    {item.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.action}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    item.type === 'success' ? 'bg-emerald-400' :
                    item.type === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                  }`} />
                  <span className="text-[10px] text-gray-400">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <CashTransactionDrawer type={cashTxType} onClose={() => setCashTxType(null)} />
    </div>
  )
}
