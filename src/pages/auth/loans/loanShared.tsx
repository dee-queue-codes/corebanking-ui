import React from 'react'

// ── Design tokens ─────────────────────────────────────────────────────────────
export const T = {
  navy: '#002663',
  blue: '#0A2F6D',  blueBg: '#EEF2FF',  blueBorder: '#C7D2FE',
  green: '#059669', greenBg: '#ECFDF5',
  amber: '#B45309', amberBg: '#FFFBEB',
  red: '#DC2626',   redBg: '#FEF2F2',
  purple: '#7C3AED', purpleBg: '#F5F3FF',
  border: '#E6EAF2',
  muted: '#7A879F',
  ink: '#16233F',
  cardBg: '#fff',
  pageBg: '#F4F6FB',
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type LoanView = 'overview' | 'applications' | 'active' | 'disbursements' | 'repayments' | 'arrears' | 'products' | 'approvals' | 'collateral'

export interface ActiveLoan {
  id: string; clientName: string; initials: string; color: string
  product: string; outstanding: string; nextDue: string; repaidPct: number
  status: string; principal: string; rate: string; term: string
  disbursed: string; maturity: string; officer: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
export const mockApplications: Array<{
  id: string; clientName: string; initials: string; color: string
  product: string; amount: string; stage: string; officer: string; submitted: string
}> = [
  { id: 'LN-20451', clientName: 'Kwame Mensah',  initials: 'KM', color: '#0A2F6D', product: 'SME Working Capital', amount: 'GH₵ 85,000',  stage: 'Under Review', officer: 'A. Owusu',  submitted: '25 May' },
  { id: 'LN-20450', clientName: 'Nana Addai',    initials: 'NA', color: '#B45309', product: 'Asset Finance',       amount: 'GH₵ 64,000',  stage: 'Under Review', officer: 'K. Asante', submitted: '25 May' },
  { id: 'LN-20448', clientName: 'Abena Boateng', initials: 'AB', color: '#059669', product: 'Salary Advance',      amount: 'GH₵ 12,500',  stage: 'Approved',     officer: 'K. Asante', submitted: '24 May' },
  { id: 'LN-20439', clientName: 'Fiifi Brown',   initials: 'FB', color: '#0A2F6D', product: 'Group Loan',          amount: 'GH₵ 18,000',  stage: 'To Disburse',  officer: 'V. Yeboah', submitted: '23 May' },
  { id: 'LN-20445', clientName: 'Ama Owusu',     initials: 'AO', color: '#7C3AED', product: 'Mortgage',            amount: 'GH₵ 320,000', stage: 'Submitted',    officer: 'V. Yeboah', submitted: '25 May' },
  { id: 'LN-20444', clientName: 'Esi Tetteh',    initials: 'ET', color: '#059669', product: 'Salary Advance',      amount: 'GH₵ 9,500',   stage: 'Submitted',    officer: 'A. Owusu',  submitted: '25 May' },
  { id: 'LN-20441', clientName: 'Kofi Asare',    initials: 'KA', color: '#DC2626', product: 'Micro Group Loan',    amount: 'GH₵ 6,000',   stage: 'Rejected',     officer: 'K. Asante', submitted: '22 May' },
]

export const mockActiveLoans: ActiveLoan[] = [
  { id: 'LN-20310', clientName: 'Kwame Mensah',  initials: 'KM', color: '#0A2F6D', product: 'SME Working Capital', outstanding: 'GH₵ 62,400',  nextDue: '02 Jun',         repaidPct: 42,  status: 'Current',    principal: 'GH₵ 100,000', rate: '24% p.a.', term: '12 months', disbursed: '10 Jan 2026', maturity: '10 Jan 2027', officer: 'A. Owusu' },
  { id: 'LN-20288', clientName: 'Yaw Darko',     initials: 'YD', color: '#B45309', product: 'Asset Finance',       outstanding: 'GH₵ 118,900', nextDue: '28 May',         repaidPct: 18,  status: 'Due Soon',   principal: 'GH₵ 140,000', rate: '21% p.a.', term: '24 months', disbursed: '05 Mar 2026', maturity: '05 Mar 2028', officer: 'K. Asante' },
  { id: 'LN-20142', clientName: 'Adwoa Mensa',   initials: 'AM', color: '#DC2626', product: 'Group Loan',          outstanding: 'GH₵ 4,200',   nextDue: '14d overdue',    repaidPct: 71,  status: 'In Arrears', principal: 'GH₵ 8,000',   rate: '8% flat',  term: '12 months', disbursed: '12 Aug 2025', maturity: '12 Aug 2026', officer: 'V. Yeboah' },
  { id: 'LN-20097', clientName: 'Ama Owusu',     initials: 'AO', color: '#7C3AED', product: 'Mortgage',            outstanding: 'GH₵ 298,000', nextDue: '05 Jun',         repaidPct: 9,   status: 'Current',    principal: 'GH₵ 320,000', rate: '18% p.a.', term: '15 years',  disbursed: '20 Feb 2026', maturity: '20 Feb 2041', officer: 'A. Owusu' },
  { id: 'LN-19980', clientName: 'Kojo Baah',     initials: 'KB', color: '#059669', product: 'Salary Advance',      outstanding: 'GH₵ 0',       nextDue: '—',              repaidPct: 100, status: 'Closed',     principal: 'GH₵ 15,000',  rate: '5% flat',  term: '6 months',  disbursed: '01 Nov 2025', maturity: '01 May 2026', officer: 'K. Asante' },
]

export const mockDisbursements: Array<{ clientName: string; initials: string; color: string; loanId: string; product: string; amount: string; detail: string; approvedBy: string | null; status: string }> = [
  { clientName: 'Fiifi Brown',   initials: 'FB', color: '#0A2F6D', loanId: 'LN-20439', product: 'Group Loan',     amount: 'GH₵ 18,000', detail: 'value date 26 May',          approvedBy: 'V. Yeboah', status: 'approved' },
  { clientName: 'Abena Boateng', initials: 'AB', color: '#059669', loanId: 'LN-20448', product: 'Salary Advance', amount: 'GH₵ 12,500', detail: 'MoMo · value date 27 May',   approvedBy: null,        status: 'checker' },
  { clientName: 'Nana Addai',    initials: 'NA', color: '#B45309', loanId: 'LN-20450', product: 'Asset Finance',  amount: 'GH₵ 64,000', detail: 'bank transfer',              approvedBy: null,        status: 'checker' },
]

export const mockRepaymentHistory = [
  { clientName: 'Kwame Mensah', initials: 'KM', color: '#0A2F6D', method: 'MoMo', date: '25 May', amount: 'GH₵ 3,400' },
  { clientName: 'Kojo Baah',    initials: 'KB', color: '#059669', method: 'Bank', date: '25 May', amount: 'GH₵ 1,150' },
  { clientName: 'Ama Owusu',    initials: 'AO', color: '#7C3AED', method: 'Bank', date: '24 May', amount: 'GH₵ 5,900' },
  { clientName: 'Yaw Darko',    initials: 'YD', color: '#B45309', method: 'Cash', date: '24 May', amount: 'GH₵ 2,000' },
]

export const mockOverdueLoans = [
  { clientName: 'Adwoa Mensa', initials: 'AM', color: '#DC2626', outstanding: 'GH₵ 4,200',  overdue: '14 days', bucket: '1–30' },
  { clientName: 'Sena Ofori',  initials: 'SO', color: '#B45309', outstanding: 'GH₵ 9,800',  overdue: '42 days', bucket: '31–60' },
  { clientName: 'Paa Anann',   initials: 'PA', color: '#7C3AED', outstanding: 'GH₵ 21,500', overdue: '96 days', bucket: '90+' },
]

export const mockLoanProducts = [
  { name: 'SME Working Capital', type: 'Declining balance', typeColor: T.blue,   interest: '24% p.a.', term: '3–24 mo',  maxAmount: 'GH₵ 250K', extra: { label: 'Processing fee', value: '2.5%' },    active: true,  count: 412 },
  { name: 'Salary Advance',      type: 'Flat rate',         typeColor: T.green,  interest: '5% flat',  term: '1–6 mo',  maxAmount: 'GH₵ 30K',  extra: { label: 'Processing fee', value: 'GH₵ 50' }, active: true,  count: 538 },
  { name: 'Asset Finance',       type: 'Declining balance', typeColor: T.amber,  interest: '21% p.a.', term: '6–36 mo', maxAmount: 'GH₵ 500K', extra: { label: 'Collateral',      value: 'Required' }, active: true,  count: 176 },
  { name: 'Group Micro Loan',    type: 'Flat rate',         typeColor: T.purple, interest: '8% flat',  term: '2–12 mo', maxAmount: 'GH₵ 20K',  extra: { label: 'Group size',      value: '5–15' },    active: false, count: 0 },
  { name: 'Home Mortgage',       type: 'Declining balance', typeColor: T.red,    interest: '18% p.a.', term: '5–20 yr', maxAmount: 'GH₵ 2M',   extra: { label: 'Collateral',      value: 'Property' }, active: true,  count: 58 },
]

export const mockApprovals = [
  { type: 'Loan Approval', typeColor: T.blue,   typeBg: T.blueBg,   clientName: 'Kwame Mensah',        amount: 'GH₵ 85,000',  detail: 'SME Working Capital · LN-20451', maker: 'A. Owusu',  ago: '1h ago'  },
  { type: 'Disbursement',  typeColor: T.green,  typeBg: T.greenBg,  clientName: 'Abena Boateng',       amount: 'GH₵ 12,500',  detail: 'Salary Advance · LN-20448',     maker: 'K. Asante', ago: '3h ago'  },
  { type: 'Reschedule',    typeColor: T.amber,  typeBg: T.amberBg,  clientName: 'Yaw Darko',           amount: 'extend 6 mo', detail: 'Asset Finance · LN-20288',      maker: 'A. Owusu',  ago: '5h ago'  },
  { type: 'Write-off',     typeColor: T.red,    typeBg: T.redBg,    clientName: 'Paa Anann',           amount: 'GH₵ 21,500',  detail: 'Group Loan · LN-19877 · 96d overdue', maker: 'V. Yeboah', ago: '1d ago' },
  { type: 'Product Change', typeColor: T.purple, typeBg: T.purpleBg, clientName: 'Salary Advance',     amount: 'rate 5%→5.5%', detail: 'Affects 538 active loans',     maker: 'D. Quaidoo', ago: '1d ago' },
]

export const mockCollateral = [
  { asset: '3-bed house, East Legon', type: 'Property', valuation: 'GH₵ 1,850,000', loanId: 'LN-20097', ltv: '16%', status: 'Verified' },
  { asset: 'Toyota Hiace 2021',       type: 'Vehicle',  valuation: 'GH₵ 210,000',   loanId: 'LN-20288', ltv: '57%', status: 'Verified' },
  { asset: 'Shop inventory',          type: 'Stock',    valuation: 'GH₵ 95,000',    loanId: 'LN-20451', ltv: '89%', status: 'Pending valuation' },
]

export const mockGuarantors = [
  { name: 'Joseph Annan',  initials: 'JA', color: '#0A2F6D', relationship: 'Employer',         guaranteed: 'GH₵ 12,500', loanId: 'LN-20448', status: 'Active' },
  { name: 'Grace Mensah',  initials: 'GM', color: '#059669', relationship: 'Spouse',           guaranteed: 'GH₵ 40,000', loanId: 'LN-20451', status: 'Active' },
  { name: 'Samuel Koomson',initials: 'SK', color: '#B45309', relationship: 'Business partner', guaranteed: 'GH₵ 30,000', loanId: 'LN-20450', status: 'Verification' },
]

export const mockSchedule = [
  { no: 1,  date: '10 Feb 2026', principal: '7,538', interest: '2,000', total: '9,538', status: 'Paid' },
  { no: 2,  date: '10 Mar 2026', principal: '7,689', interest: '1,849', total: '9,538', status: 'Paid' },
  { no: 3,  date: '10 Apr 2026', principal: '7,842', interest: '1,696', total: '9,538', status: 'Paid' },
  { no: 4,  date: '10 May 2026', principal: '7,999', interest: '1,539', total: '9,538', status: 'Paid' },
  { no: 5,  date: '10 Jun 2026', principal: '8,159', interest: '1,379', total: '9,538', status: 'Due' },
  { no: 6,  date: '10 Jul 2026', principal: '8,322', interest: '1,216', total: '9,538', status: 'Upcoming' },
  { no: 7,  date: '10 Aug 2026', principal: '8,489', interest: '1,049', total: '9,538', status: 'Upcoming' },
  { no: 8,  date: '10 Sep 2026', principal: '8,659', interest: '879',   total: '9,538', status: 'Upcoming' },
  { no: 9,  date: '10 Oct 2026', principal: '8,832', interest: '706',   total: '9,538', status: 'Upcoming' },
  { no: 10, date: '10 Nov 2026', principal: '9,008', interest: '530',   total: '9,538', status: 'Upcoming' },
  { no: 11, date: '10 Dec 2026', principal: '9,188', interest: '350',   total: '9,538', status: 'Upcoming' },
  { no: 12, date: '10 Jan 2027', principal: '9,372', interest: '166',   total: '9,538', status: 'Upcoming' },
]

// ── Shared helpers ─────────────────────────────────────────────────────────────
export function Ava({ initials, color, size = 34 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, color: '#fff', fontWeight: 700,
      fontSize: size <= 28 ? 10 : size <= 34 ? 12 : 15,
      fontFamily: "'DM Sans', sans-serif",
    }}>{initials}</div>
  )
}

export function MiniBar({ pct, color = T.green }: { pct: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, verticalAlign: 'middle' }}>
      <span style={{ display: 'inline-block', width: 80, height: 6, background: '#EEF1F6', borderRadius: 20, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 20 }} />
      </span>
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{pct}%</span>
    </span>
  )
}

export function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(16,33,73,.05)', ...style }}>
      {children}
    </div>
  )
}

export function PanelHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{title}</span>
      {action}
    </div>
  )
}

export function Chip({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 140, boxShadow: '0 1px 3px rgba(16,33,73,.04)' }}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 5, color: valueColor ?? T.ink, letterSpacing: '-0.02em', fontFamily: "'Sora', sans-serif" }}>{value}</div>
    </div>
  )
}

export const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 11, letterSpacing: '0.05em', color: T.muted,
  fontWeight: 700, padding: '11px 20px', background: '#F8FAFD', textTransform: 'uppercase',
  fontFamily: "'DM Sans', sans-serif",
}

export const tdStyle: React.CSSProperties = {
  padding: '13px 20px', borderTop: `1px solid ${T.border}`, fontSize: 13,
  fontWeight: 500, color: T.ink, fontFamily: "'DM Sans', sans-serif",
}
