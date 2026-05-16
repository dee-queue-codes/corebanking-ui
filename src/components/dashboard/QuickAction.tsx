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
  onClick?: () => void
  disabled?: boolean
}

function QuickActionButton({ label, icon: Icon, onClick, disabled = false }: QuickActionButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg transition-colors text-left w-full ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
      }`}
    >
      <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  )
}

export function QuickAction() {
  const navigate = useNavigate()

  const iconMap: Record<string, LucideIcon> = {
    'Transactions':      ArrowRightLeft,
    'Cash Deposits':     ArrowDownToLine,
    'Cash Withdrawal':   ArrowUpFromLine,
    'Clients':           Users,
    'Products':          Package,
    'Reports':           FileText,
    'Offices':           Building2,
    'User Management':   UserCog,
    'Chart Of Accounts': PieChart,
  }

  const routeMap: Record<string, string> = {
    'Clients':         ROUTES.CLIENTS.LIST,
    'Products':        ROUTES.PRODUCTS.LIST,
    'User Management': ROUTES.ADMINISTRATION.USERS,
  }

  const enabledActions = new Set(['Clients', 'Products', 'User Management'])

  const rows = [
    ['Transactions',  'Cash Deposits',   'Cash Withdrawal'],
    ['Clients',       'Products',        'Reports'],
    ['Offices',       'User Management', 'Chart Of Accounts'],
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="mb-4 text-base font-medium text-gray-900">Quick Action</h3>
      <div className="space-y-2.5">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 gap-2.5">
            {row.map((action, colIndex) => {
              const isDisabled = !enabledActions.has(action)
              return (
                <QuickActionButton
                  key={`${rowIndex}-${colIndex}`}
                  label={action}
                  icon={iconMap[action]}
                  disabled={isDisabled}
                  onClick={isDisabled ? undefined : () => navigate(routeMap[action])}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
