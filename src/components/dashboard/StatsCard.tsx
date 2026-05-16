interface StatsCardProps { title: string; value: string | number; }
export function StatsCard({ title, value }: StatsCardProps) {
  return <div className="bg-white p-4 rounded-lg border"><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold">{value}</p></div>
}
