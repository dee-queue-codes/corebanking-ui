import { useState } from 'react'
import { LayoutDashboard, Receipt, CheckSquare, Users, UserCog, FileText, Calculator, Settings, Package, ChevronLeft, ChevronRight, CreditCard, Landmark, ChevronDown } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/router/routes'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

const routeMap: Record<string, string> = {
  dashboard:        ROUTES.DASHBOARD,
  transactions:     ROUTES.TRANSACTIONS,
  tasks:            ROUTES.TASKS,
  clients:          ROUTES.CLIENTS.LIST,
  'account':        ROUTES.CLIENTS.ACCOUNT_LOOKUP,
  products:         ROUTES.PRODUCTS.LIST,
  administrations:  ROUTES.ADMINISTRATION.ROOT,
  reports:          ROUTES.REPORTS.ROOT,
  accounting:       ROUTES.ACCOUNTING.ROOT,
  settings:         ROUTES.SETTINGS,
}

function getActiveId(pathname: string): string {
  if (pathname === '/') return 'dashboard'
  if (pathname === '/clients/account-lookup') return 'account'
  if (pathname.startsWith('/clients'))        return 'clients'
  if (pathname.startsWith('/products'))       return 'products'
  if (pathname.startsWith('/administration')) return 'administrations'
  if (pathname.startsWith('/reports'))        return 'reports'
  if (pathname.startsWith('/accounting'))     return 'accounting'
  if (pathname.startsWith('/transactions'))   return 'transactions'
  if (pathname.startsWith('/tasks'))          return 'tasks'
  if (pathname.startsWith('/loans'))          return 'loans'
  if (pathname.startsWith('/settings'))       return 'settings'
  return 'dashboard'
}

interface NavItemProps {
  id: string
  icon: React.ReactNode
  label: string
  active: boolean
  disabled?: boolean
  collapsed: boolean
  onClick: () => void
}

function NavItem({ id, icon, label, active, disabled = false, collapsed, onClick }: NavItemProps) {
  return (
    <div style={{ position: 'relative' }}>
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: 6, bottom: 6,
          width: 3, background: '#fff', borderRadius: '0 2px 2px 0',
        }} />
      )}
      <button
        key={id}
        disabled={disabled}
        onClick={onClick}
        title={label}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none',
          fontSize: 13, fontFamily: "'DM Sans', sans-serif",
          fontWeight: active ? 600 : 400,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
          color: active ? '#fff' : disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)',
          transition: 'background 0.15s, color 0.15s',
          textAlign: 'left',
        }}
        onMouseEnter={e => {
          if (!disabled && !active) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
          }
        }}
        onMouseLeave={e => {
          if (!disabled && !active) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
          }
        }}
      >
        <span style={{ width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
        {!collapsed && (
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        )}
      </button>
    </div>
  )
}

const LOAN_SUB_ITEMS: Array<{ view: string; label: string; badge?: number }> = [
  { view: 'overview',      label: 'Overview' },
  { view: 'applications',  label: 'Applications',          badge: 36 },
  { view: 'active',        label: 'Active Loans',          badge: 1300 },
  { view: 'disbursements', label: 'Disbursements',         badge: 5 },
  { view: 'repayments',    label: 'Repayments' },
  { view: 'arrears',       label: 'Arrears & PAR',         badge: 92 },
  { view: 'products',      label: 'Loan Products' },
  { view: 'approvals',     label: 'Approvals',             badge: 9 },
  { view: 'collateral',    label: 'Collateral & Guarantors' },
]

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const activeKey  = getActiveId(location.pathname)
  const isOnLoans  = activeKey === 'loans'
  const [loansOpen, setLoansOpen] = useState(isOnLoans)

  const activeView = new URLSearchParams(location.search).get('view') ?? 'overview'

  const nav = (id: string, icon: React.ReactNode, label: string, disabled = false) => (
    <NavItem
      key={id} id={id} icon={icon} label={label}
      active={activeKey === id} disabled={disabled}
      collapsed={collapsed}
      onClick={() => { if (!disabled && routeMap[id]) navigate(routeMap[id]) }}
    />
  )

  const loanParentActive = isOnLoans && !loansOpen

  return (
    <div style={{
      width: collapsed ? 64 : 220,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.3s',
      background: 'linear-gradient(135deg, #001844 0%, #002663 60%, #1a4080 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dot texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '20px 20px',
      }} />

      {/* Logo */}
      <div style={{
        height: 60, borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: collapsed ? '0 14px' : '0 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 6v6c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-4z" fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p style={{
              margin: 0, color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: "'Sora', sans-serif", lineHeight: 1.2,
              letterSpacing: '-0.01em', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>Chelsea Bank</p>
            <p style={{
              margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 11,
              fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4,
            }}>Head Office</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 10px',
        display: 'flex', flexDirection: 'column', gap: 20, position: 'relative',
      }}>
        {/* Main Menu */}
        <div>
          {!collapsed && (
            <p style={{
              margin: '0 0 6px', padding: '0 4px',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
              fontFamily: "'DM Sans', sans-serif",
            }}>Main Menu</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {nav('dashboard',    <LayoutDashboard style={{ width: 15, height: 15 }} />, 'Dashboard')}
            {nav('transactions', <Receipt style={{ width: 15, height: 15 }} />,         'Transactions')}
            {nav('tasks',        <CheckSquare style={{ width: 15, height: 15 }} />,     'Tasks', true)}
          </div>
        </div>

        {/* Admin */}
        <div>
          {!collapsed && (
            <p style={{
              margin: '0 0 6px', padding: '0 4px',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
              fontFamily: "'DM Sans', sans-serif",
            }}>Admin</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {nav('clients',  <Users style={{ width: 15, height: 15 }} />,      'Clients')}
            {nav('account',  <CreditCard style={{ width: 15, height: 15 }} />, 'Account')}
            {nav('products', <Package style={{ width: 15, height: 15 }} />,    'Products')}

            {/* ── Loan Management dropdown ── */}
            <div style={{ position: 'relative' }}>
              {loanParentActive && (
                <span style={{
                  position: 'absolute', left: 0, top: 6, bottom: 6,
                  width: 3, background: '#fff', borderRadius: '0 2px 2px 0',
                }} />
              )}
              <button
                onClick={() => {
                  if (collapsed) { navigate(ROUTES.LOANS + '?view=overview'); return }
                  const opening = !loansOpen
                  setLoansOpen(opening)
                  if (opening && !isOnLoans) navigate(ROUTES.LOANS + '?view=overview')
                }}
                title="Loan Management"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none',
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isOnLoans ? 600 : 400,
                  cursor: 'pointer',
                  background: loanParentActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isOnLoans ? '#fff' : 'rgba(255,255,255,0.55)',
                  transition: 'background 0.15s, color 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!loanParentActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
                  }
                }}
                onMouseLeave={e => {
                  if (!loanParentActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = isOnLoans ? '#fff' : 'rgba(255,255,255,0.55)'
                  }
                }}
              >
                <span style={{ width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Landmark style={{ width: 15, height: 15 }} />
                </span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Loan Management
                    </span>
                    <ChevronDown style={{
                      width: 13, height: 13, flexShrink: 0,
                      transition: 'transform 0.2s',
                      transform: loansOpen ? 'rotate(180deg)' : 'none',
                      color: 'rgba(255,255,255,0.4)',
                    }} />
                  </>
                )}
              </button>

              {/* Sub-items */}
              {!collapsed && loansOpen && (
                <div style={{
                  margin: '3px 0 3px 14px',
                  paddingLeft: 12,
                  borderLeft: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', flexDirection: 'column', gap: 1,
                }}>
                  {LOAN_SUB_ITEMS.map(item => {
                    const isActive = isOnLoans && activeView === item.view
                    return (
                      <button
                        key={item.view}
                        onClick={() => navigate(`${ROUTES.LOANS}?view=${item.view}`)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', gap: 8,
                          padding: '8px 10px', borderRadius: 8, border: 'none',
                          fontSize: 12.5, fontFamily: "'DM Sans', sans-serif",
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          background: isActive ? 'rgba(91,124,219,0.22)' : 'transparent',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                          transition: 'background 0.15s, color 0.15s',
                          textAlign: 'left',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                            e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                          }
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                        {item.badge !== undefined && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                            padding: '1px 6px', borderRadius: 20,
                            background: isActive ? '#3B5BDB' : 'rgba(255,255,255,0.12)',
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                          }}>
                            {item.badge >= 1000 ? `${(item.badge / 1000).toFixed(1)}k` : item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {nav('administrations', <UserCog style={{ width: 15, height: 15 }} />,    'Administrations', true)}
            {nav('reports',         <FileText style={{ width: 15, height: 15 }} />,   'Reports')}
            {nav('accounting',      <Calculator style={{ width: 15, height: 15 }} />, 'Accounting', true)}
            {nav('settings',        <Settings style={{ width: 15, height: 15 }} />,   'Settings', true)}
          </div>
        </div>
      </div>

      {/* Collapse toggle */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: 10, flexShrink: 0, position: 'relative' }}>
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse sidebar'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, padding: 8,
            borderRadius: 8, border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.35)', fontSize: 12,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
        >
          {collapsed
            ? <ChevronRight style={{ width: 15, height: 15 }} />
            : <><ChevronLeft style={{ width: 15, height: 15 }} /><span>Collapse</span></>
          }
        </button>
      </div>
    </div>
  )
}
