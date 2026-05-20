import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Users, CreditCard, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { QuickAction } from '@/components/dashboard/QuickAction'

// ── Mock chart data ───────────────────────────────────────────────────────

const txVolumeData = [
  { month: 'Nov', deposits: 420, withdrawals: 310 },
  { month: 'Dec', deposits: 580, withdrawals: 390 },
  { month: 'Jan', deposits: 490, withdrawals: 340 },
  { month: 'Feb', deposits: 620, withdrawals: 410 },
  { month: 'Mar', deposits: 710, withdrawals: 480 },
  { month: 'Apr', deposits: 660, withdrawals: 430 },
  { month: 'May', deposits: 830, withdrawals: 560 },
]

const clientGrowthData = [
  { month: 'Nov', clients: 180 },
  { month: 'Dec', clients: 210 },
  { month: 'Jan', clients: 245 },
  { month: 'Feb', clients: 280 },
  { month: 'Mar', clients: 320 },
  { month: 'Apr', clients: 355 },
  { month: 'May', clients: 398 },
]

// ── Stat card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub: string
  up: boolean
  icon: React.ReactNode
  iconBg: string
}

function StatCard({ label, value, sub, up, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 leading-none mb-1">{value}</p>
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

// ── Custom tooltip ────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-bold text-gray-800">GHS {p.value.toLocaleString()}K</span>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
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

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Clients"    value="398"        sub="+12.4%" up={true}  iconBg="bg-blue-50"    icon={<Users       className="w-5 h-5 text-blue-600"    />} />
        <StatCard label="Active Accounts"  value="214"        sub="+8.1%"  up={true}  iconBg="bg-violet-50"  icon={<CreditCard  className="w-5 h-5 text-violet-600"  />} />
        <StatCard label="Deposits (May)"   value="GHS 830K"   sub="+25.8%" up={true}  iconBg="bg-emerald-50" icon={<TrendingUp  className="w-5 h-5 text-emerald-600" />} />
        <StatCard label="Pending KYC"      value="23"         sub="-4.2%"  up={false} iconBg="bg-orange-50"  icon={<Clock       className="w-5 h-5 text-orange-500"  />} />
      </div>

      {/* Main grid — left (1/3) + right (2/3) */}
      <div className="grid grid-cols-3 gap-4">

        {/* ── Left column: Quick Actions + Client Growth ── */}
        <div className="col-span-1 flex flex-col gap-4">

          {/* Quick Actions */}
          <QuickAction />

          {/* Client Growth */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900">Client Growth</h3>
              <p className="text-xs text-gray-400 mt-0.5">New registrations · 7 months</p>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={clientGrowthData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-gray-700 mb-1">{label}</p>
                        <p className="font-bold text-gray-900">{payload[0].value} clients</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="clients" fill="#002663" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Right column: Transaction Volume + Recent Activity ── */}
        <div className="col-span-2 flex flex-col gap-4">

          {/* Transaction Volume */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Transaction Volume</h3>
                <p className="text-xs text-gray-400 mt-0.5">Deposits vs withdrawals · last 7 months</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#002663] inline-block" />Deposits
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-200 inline-block" />Withdrawals
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={txVolumeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#002663" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#002663" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#93c5fd" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="deposits"    stroke="#002663" strokeWidth={2.5} fill="url(#depGrad)" dot={false} />
                <Area type="monotone" dataKey="withdrawals" stroke="#93c5fd" strokeWidth={2}   fill="url(#wdGrad)"  dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
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
                { name: 'Akosua Owusu',  action: 'Profile updated',           time: '3 hr ago',   type: 'info'    },
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
      </div>
    </div>
  )
}
