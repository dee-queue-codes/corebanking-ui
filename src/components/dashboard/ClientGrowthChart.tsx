import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const data = [
  { month: 'Nov', clients: 180 },
  { month: 'Dec', clients: 210 },
  { month: 'Jan', clients: 245 },
  { month: 'Feb', clients: 280 },
  { month: 'Mar', clients: 320 },
  { month: 'Apr', clients: 355 },
  { month: 'May', clients: 398 },
]

export function ClientGrowthChart() {
  return (
    <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-900">Client Growth</h3>
        <p className="text-xs text-gray-400 mt-0.5">New registrations · 7 months</p>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
          <YAxis                 tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
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
  )
}
