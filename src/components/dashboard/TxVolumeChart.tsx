import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { reportsAPI } from '@/services/reports/reportsAPI'

const TODAY = new Date()
const FROM_DATE = '2000-01-01'
const TO_DATE = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`

type MonthlyEntry = Record<string, unknown>

// Response shape: { success, data: { grandTotal, data: [ { year, month, totalDeposits|totalCredits } ] } }
function extractArray(res: unknown): MonthlyEntry[] {
  if (!res || typeof res !== 'object') return []
  const outer = (res as Record<string, unknown>).data
  if (!outer || typeof outer !== 'object') return []
  const inner = (outer as Record<string, unknown>).data
  return Array.isArray(inner) ? (inner as MonthlyEntry[]) : []
}

function normalise(res: unknown, amountKey: string): { label: string; amountK: number }[] {
  return extractArray(res).map(e => {
    const val = e[amountKey] ?? 0
    const amountK = Math.round((typeof val === 'number' ? val : Number(val) || 0) / 1000)
    const year = typeof e.year === 'number' ? e.year : Number(e.year) || 0
    const mon  = typeof e.month === 'number' ? e.month : Number(e.month) || 1
    const label = new Date(year, mon - 1, 1).toLocaleDateString('en', { month: 'short' })
    return { label, amountK }
  })
}

interface ChartRow { month: string; deposits: number; credits: number }

function merge(
  deposits: { label: string; amountK: number }[],
  credits: { label: string; amountK: number }[],
): ChartRow[] {
  const labels = [...new Set([...deposits.map(d => d.label), ...credits.map(c => c.label)])]
  return labels
    .map(label => ({
      month: label,
      deposits: deposits.find(d => d.label === label)?.amountK ?? 0,
      credits:  credits.find(c => c.label === label)?.amountK  ?? 0,
    }))
    .slice(-7)
}

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

export function TxVolumeChart() {
  const [rows, setRows] = useState<ChartRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = { fromDate: FROM_DATE, toDate: TO_DATE }
    Promise.allSettled([
      reportsAPI.getDepositsMonthly(params),
      reportsAPI.getCreditsMonthly(params),
    ]).then(([dep, cred]) => {
      const deposits = dep.status  === 'fulfilled' ? normalise(dep.value.data,  'totalDeposits') : []
      const credits  = cred.status === 'fulfilled' ? normalise(cred.value.data, 'totalCredits')  : []
      setRows(merge(deposits, credits))
      setLoading(false)
    })
  }, [])

  return (
    <div className="col-span-1 sm:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Transaction Volume</h3>
          <p className="text-xs text-gray-400 mt-0.5">Deposits vs credits · last 7 months</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#002663] inline-block" />Deposits
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-200 inline-block" />Credits
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-[210px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#002663] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#002663" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#002663" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#93c5fd" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month"    tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <YAxis                    tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="deposits" stroke="#002663" strokeWidth={2.5} fill="url(#depGrad)"  dot={false} />
            <Area type="monotone" dataKey="credits"  stroke="#93c5fd" strokeWidth={2}   fill="url(#credGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
