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
  disabled?: boolean
}

function QuickActionButton({ label, icon: Icon, onClick, disabled = false }: QuickActionButtonProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-colors w-full h-full ${
        disabled
          ? 'cursor-not-allowed border-gray-100 bg-gray-50/60 opacity-35 select-none'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer'
      }`}
    >
      <Icon className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-[#002663]'}`} />
      <span className={`text-xs font-medium leading-tight ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
    </button>
  )
}

interface QuickActionProps {
  className?: string
  onCashDeposit?: () => void
  onCashWithdraw?: () => void
}

export function QuickAction({ className, onCashDeposit, onCashWithdraw }: QuickActionProps) {
  const navigate = useNavigate()

  const actions: { label: string; icon: LucideIcon; onClick: () => void; disabled?: boolean }[] = [
    { label: 'Transactions',      icon: ArrowRightLeft,  onClick: () => navigate(ROUTES.TRANSACTIONS) },
    { label: 'Cash Deposits',     icon: ArrowDownToLine, onClick: () => onCashDeposit?.() },
    { label: 'Cash Withdrawal',   icon: ArrowUpFromLine, onClick: () => onCashWithdraw?.() },
    { label: 'Clients',           icon: Users,           onClick: () => navigate(ROUTES.CLIENTS.LIST) },
    { label: 'Products',          icon: Package,         onClick: () => navigate(ROUTES.PRODUCTS.LIST) },
    { label: 'Reports',           icon: FileText,        onClick: () => navigate(ROUTES.REPORTS.ROOT) },
    { label: 'Offices',           icon: Building2,       onClick: () => {}, disabled: true },
    { label: 'User Management',   icon: UserCog,         onClick: () => {}, disabled: true },
    { label: 'Chart Of Accounts', icon: PieChart,        onClick: () => {}, disabled: true },
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
                onClick={action.onClick}
                disabled={action.disabled}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
