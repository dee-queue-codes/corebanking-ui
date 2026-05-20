import {
  ArrowRightLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Package,
  FileText,
  Building2,
  UserCog,
  PieChart,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/router/routes'

interface QuickActionButtonProps {
  label: string
  icon: LucideIcon
  onClick: () => void
}

function QuickActionButton({ label, icon: Icon, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-center transition-colors hover:bg-gray-100 cursor-pointer w-full h-full"
    >
      <Icon className="w-5 h-5 text-[#002663]" />
      <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
    </button>
  )
}

export function QuickAction({ className }: { className?: string }) {
  const navigate = useNavigate()

  const actions: { label: string; icon: LucideIcon; route: string }[] = [
    { label: 'Transactions',      icon: ArrowRightLeft,  route: ROUTES.TRANSACTIONS },
    { label: 'Cash Deposits',     icon: ArrowDownToLine, route: ROUTES.TRANSACTIONS },
    { label: 'Cash Withdrawal',   icon: ArrowUpFromLine, route: ROUTES.TRANSACTIONS },
    { label: 'Clients',           icon: Users,           route: ROUTES.CLIENTS.LIST },
    { label: 'Products',          icon: Package,         route: ROUTES.PRODUCTS.LIST },
    { label: 'Reports',           icon: FileText,        route: ROUTES.REPORTS.ROOT },
    { label: 'Offices',           icon: Building2,       route: ROUTES.ADMINISTRATION.OFFICES },
    { label: 'User Management',   icon: UserCog,         route: ROUTES.ADMINISTRATION.USERS },
    { label: 'Chart Of Accounts', icon: PieChart,        route: ROUTES.ACCOUNTING.CHART },
  ]

  const rows = [
    actions.slice(0, 3),
    actions.slice(3, 6),
    actions.slice(6, 9),
  ]

  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-gray-100 p-5 ${className ?? ''}`}>
      <h3 className="mb-4 text-sm font-bold text-gray-900">Quick Action</h3>
      <div className="flex flex-1 flex-col gap-2.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-1 gap-2.5">
            {row.map((action) => (
              <QuickActionButton
                key={action.label}
                label={action.label}
                icon={action.icon}
                onClick={() => navigate(action.route)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
