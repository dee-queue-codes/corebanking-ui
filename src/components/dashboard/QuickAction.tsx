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
      className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left w-full cursor-pointer"
    >
      <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  )
}

export function QuickAction() {
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
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="mb-4 text-base font-medium text-gray-900">Quick Action</h3>
      <div className="space-y-2.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-2.5">
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
