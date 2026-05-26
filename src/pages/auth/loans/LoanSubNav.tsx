import { useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/router/routes'

const TABS: Array<{ route: string; label: string; badge?: number }> = [
  { route: ROUTES.LOANS.OVERVIEW,      label: 'Overview' },
  { route: ROUTES.LOANS.APPLICATIONS,  label: 'Applications',  badge: 36 },
  { route: ROUTES.LOANS.ACTIVE,        label: 'Active Loans',  badge: 1300 },
  { route: ROUTES.LOANS.DISBURSEMENTS, label: 'Disbursements', badge: 5 },
  { route: ROUTES.LOANS.REPAYMENTS,    label: 'Repayments' },
  { route: ROUTES.LOANS.ARREARS,       label: 'Arrears & PAR', badge: 92 },
  { route: ROUTES.LOANS.PRODUCTS,      label: 'Loan Products' },
  { route: ROUTES.LOANS.APPROVALS,     label: 'Approvals',     badge: 9 },
  { route: ROUTES.LOANS.COLLATERAL,    label: 'Collateral & Guarantors' },
]

export function LoanSubNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #E6EAF2',
      marginBottom: 24,
      marginLeft: -28,
      marginRight: -28,
      paddingLeft: 28,
      paddingRight: 28,
      display: 'flex',
      gap: 0,
      overflowX: 'auto',
    }}>
      {TABS.map(tab => {
        const active = pathname === tab.route
        return (
          <button
            key={tab.route}
            onClick={() => navigate(tab.route)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '14px 4px',
              marginRight: 28,
              background: 'none',
              border: 'none',
              borderBottom: active ? '2px solid #0A2F6D' : '2px solid transparent',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: active ? 700 : 400,
              color: active ? '#0A2F6D' : '#7A879F',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
              outline: 'none',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#0A2F6D' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#7A879F' }}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 20,
                background: '#DBEAFE',
                color: '#1D4ED8',
              }}>
                {tab.badge >= 1000 ? `${(tab.badge / 1000).toFixed(1)}k` : tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
