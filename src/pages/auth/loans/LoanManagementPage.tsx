import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  TrendingUp, AlertTriangle, DollarSign, BarChart2, Download,
  Plus, ChevronDown, LayoutGrid, List, ArrowLeft, FileText,
  CheckCircle2, Clock,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/router/routes'

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  navy: '#002663',
  blue: '#3B5BDB',  blueBg: '#EEF2FF',  blueBorder: '#C7D2FE',
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
type LoanView = 'overview' | 'applications' | 'active' | 'disbursements' | 'repayments' | 'arrears' | 'products' | 'approvals' | 'collateral'

interface ActiveLoan {
  id: string; clientName: string; initials: string; color: string
  product: string; outstanding: string; nextDue: string; repaidPct: number
  status: string; principal: string; rate: string; term: string
  disbursed: string; maturity: string; officer: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const mockApplications: Array<{
  id: string; clientName: string; initials: string; color: string
  product: string; amount: string; stage: string; officer: string; submitted: string
}> = [
  { id: 'LN-20451', clientName: 'Kwame Mensah',  initials: 'KM', color: '#3B5BDB', product: 'SME Working Capital', amount: 'GH₵ 85,000',  stage: 'Under Review', officer: 'A. Owusu',  submitted: '25 May' },
  { id: 'LN-20450', clientName: 'Nana Addai',    initials: 'NA', color: '#B45309', product: 'Asset Finance',       amount: 'GH₵ 64,000',  stage: 'Under Review', officer: 'K. Asante', submitted: '25 May' },
  { id: 'LN-20448', clientName: 'Abena Boateng', initials: 'AB', color: '#059669', product: 'Salary Advance',      amount: 'GH₵ 12,500',  stage: 'Approved',     officer: 'K. Asante', submitted: '24 May' },
  { id: 'LN-20439', clientName: 'Fiifi Brown',   initials: 'FB', color: '#3B5BDB', product: 'Group Loan',          amount: 'GH₵ 18,000',  stage: 'To Disburse',  officer: 'V. Yeboah', submitted: '23 May' },
  { id: 'LN-20445', clientName: 'Ama Owusu',     initials: 'AO', color: '#7C3AED', product: 'Mortgage',            amount: 'GH₵ 320,000', stage: 'Submitted',    officer: 'V. Yeboah', submitted: '25 May' },
  { id: 'LN-20444', clientName: 'Esi Tetteh',    initials: 'ET', color: '#059669', product: 'Salary Advance',      amount: 'GH₵ 9,500',   stage: 'Submitted',    officer: 'A. Owusu',  submitted: '25 May' },
  { id: 'LN-20441', clientName: 'Kofi Asare',    initials: 'KA', color: '#DC2626', product: 'Micro Group Loan',    amount: 'GH₵ 6,000',   stage: 'Rejected',     officer: 'K. Asante', submitted: '22 May' },
]

const mockActiveLoans: ActiveLoan[] = [
  { id: 'LN-20310', clientName: 'Kwame Mensah',  initials: 'KM', color: '#3B5BDB', product: 'SME Working Capital', outstanding: 'GH₵ 62,400',  nextDue: '02 Jun',         repaidPct: 42,  status: 'Current',    principal: 'GH₵ 100,000', rate: '24% p.a.', term: '12 months', disbursed: '10 Jan 2026', maturity: '10 Jan 2027', officer: 'A. Owusu' },
  { id: 'LN-20288', clientName: 'Yaw Darko',     initials: 'YD', color: '#B45309', product: 'Asset Finance',       outstanding: 'GH₵ 118,900', nextDue: '28 May',         repaidPct: 18,  status: 'Due Soon',   principal: 'GH₵ 140,000', rate: '21% p.a.', term: '24 months', disbursed: '05 Mar 2026', maturity: '05 Mar 2028', officer: 'K. Asante' },
  { id: 'LN-20142', clientName: 'Adwoa Mensa',   initials: 'AM', color: '#DC2626', product: 'Group Loan',          outstanding: 'GH₵ 4,200',   nextDue: '14d overdue',    repaidPct: 71,  status: 'In Arrears', principal: 'GH₵ 8,000',   rate: '8% flat',  term: '12 months', disbursed: '12 Aug 2025', maturity: '12 Aug 2026', officer: 'V. Yeboah' },
  { id: 'LN-20097', clientName: 'Ama Owusu',     initials: 'AO', color: '#7C3AED', product: 'Mortgage',            outstanding: 'GH₵ 298,000', nextDue: '05 Jun',         repaidPct: 9,   status: 'Current',    principal: 'GH₵ 320,000', rate: '18% p.a.', term: '15 years',  disbursed: '20 Feb 2026', maturity: '20 Feb 2041', officer: 'A. Owusu' },
  { id: 'LN-19980', clientName: 'Kojo Baah',     initials: 'KB', color: '#059669', product: 'Salary Advance',      outstanding: 'GH₵ 0',       nextDue: '—',              repaidPct: 100, status: 'Closed',     principal: 'GH₵ 15,000',  rate: '5% flat',  term: '6 months',  disbursed: '01 Nov 2025', maturity: '01 May 2026', officer: 'K. Asante' },
]

const mockDisbursements = [
  { clientName: 'Fiifi Brown',   initials: 'FB', color: '#3B5BDB', loanId: 'LN-20439', product: 'Group Loan',     amount: 'GH₵ 18,000', detail: 'value date 26 May',          approvedBy: 'V. Yeboah', status: 'approved' },
  { clientName: 'Abena Boateng', initials: 'AB', color: '#059669', loanId: 'LN-20448', product: 'Salary Advance', amount: 'GH₵ 12,500', detail: 'MoMo · value date 27 May',   approvedBy: null,        status: 'checker' },
  { clientName: 'Nana Addai',    initials: 'NA', color: '#B45309', loanId: 'LN-20450', product: 'Asset Finance',  amount: 'GH₵ 64,000', detail: 'bank transfer',              approvedBy: null,        status: 'checker' },
]

const mockRepaymentHistory = [
  { clientName: 'Kwame Mensah', initials: 'KM', color: '#3B5BDB', method: 'MoMo', date: '25 May', amount: 'GH₵ 3,400' },
  { clientName: 'Kojo Baah',    initials: 'KB', color: '#059669', method: 'Bank', date: '25 May', amount: 'GH₵ 1,150' },
  { clientName: 'Ama Owusu',    initials: 'AO', color: '#7C3AED', method: 'Bank', date: '24 May', amount: 'GH₵ 5,900' },
  { clientName: 'Yaw Darko',    initials: 'YD', color: '#B45309', method: 'Cash', date: '24 May', amount: 'GH₵ 2,000' },
]

const mockOverdueLoans = [
  { clientName: 'Adwoa Mensa', initials: 'AM', color: '#DC2626', outstanding: 'GH₵ 4,200',  overdue: '14 days', bucket: '1–30' },
  { clientName: 'Sena Ofori',  initials: 'SO', color: '#B45309', outstanding: 'GH₵ 9,800',  overdue: '42 days', bucket: '31–60' },
  { clientName: 'Paa Anann',   initials: 'PA', color: '#7C3AED', outstanding: 'GH₵ 21,500', overdue: '96 days', bucket: '90+' },
]

const mockLoanProducts = [
  { name: 'SME Working Capital', type: 'Declining balance', typeColor: T.blue,   interest: '24% p.a.', term: '3–24 mo',  maxAmount: 'GH₵ 250K', extra: { label: 'Processing fee', value: '2.5%' },    active: true,  count: 412 },
  { name: 'Salary Advance',      type: 'Flat rate',         typeColor: T.green,  interest: '5% flat',  term: '1–6 mo',  maxAmount: 'GH₵ 30K',  extra: { label: 'Processing fee', value: 'GH₵ 50' }, active: true,  count: 538 },
  { name: 'Asset Finance',       type: 'Declining balance', typeColor: T.amber,  interest: '21% p.a.', term: '6–36 mo', maxAmount: 'GH₵ 500K', extra: { label: 'Collateral',      value: 'Required' }, active: true,  count: 176 },
  { name: 'Group Micro Loan',    type: 'Flat rate',         typeColor: T.purple, interest: '8% flat',  term: '2–12 mo', maxAmount: 'GH₵ 20K',  extra: { label: 'Group size',      value: '5–15' },    active: false, count: 0 },
  { name: 'Home Mortgage',       type: 'Declining balance', typeColor: T.red,    interest: '18% p.a.', term: '5–20 yr', maxAmount: 'GH₵ 2M',   extra: { label: 'Collateral',      value: 'Property' }, active: true,  count: 58 },
]

const mockApprovals = [
  { type: 'Loan Approval', typeColor: T.blue,   typeBg: T.blueBg,   clientName: 'Kwame Mensah',        amount: 'GH₵ 85,000',  detail: 'SME Working Capital · LN-20451', maker: 'A. Owusu',  ago: '1h ago'  },
  { type: 'Disbursement',  typeColor: T.green,  typeBg: T.greenBg,  clientName: 'Abena Boateng',       amount: 'GH₵ 12,500',  detail: 'Salary Advance · LN-20448',     maker: 'K. Asante', ago: '3h ago'  },
  { type: 'Reschedule',    typeColor: T.amber,  typeBg: T.amberBg,  clientName: 'Yaw Darko',           amount: 'extend 6 mo', detail: 'Asset Finance · LN-20288',      maker: 'A. Owusu',  ago: '5h ago'  },
  { type: 'Write-off',     typeColor: T.red,    typeBg: T.redBg,    clientName: 'Paa Anann',           amount: 'GH₵ 21,500',  detail: 'Group Loan · LN-19877 · 96d overdue', maker: 'V. Yeboah', ago: '1d ago' },
  { type: 'Product Change', typeColor: T.purple, typeBg: T.purpleBg, clientName: 'Salary Advance',     amount: 'rate 5%→5.5%', detail: 'Affects 538 active loans',     maker: 'D. Quaidoo', ago: '1d ago' },
]

const mockCollateral = [
  { asset: '3-bed house, East Legon', type: 'Property', valuation: 'GH₵ 1,850,000', loanId: 'LN-20097', ltv: '16%', status: 'Verified' },
  { asset: 'Toyota Hiace 2021',       type: 'Vehicle',  valuation: 'GH₵ 210,000',   loanId: 'LN-20288', ltv: '57%', status: 'Verified' },
  { asset: 'Shop inventory',          type: 'Stock',    valuation: 'GH₵ 95,000',    loanId: 'LN-20451', ltv: '89%', status: 'Pending valuation' },
]

const mockGuarantors = [
  { name: 'Joseph Annan',  initials: 'JA', color: '#3B5BDB', relationship: 'Employer',         guaranteed: 'GH₵ 12,500', loanId: 'LN-20448', status: 'Active' },
  { name: 'Grace Mensah',  initials: 'GM', color: '#059669', relationship: 'Spouse',           guaranteed: 'GH₵ 40,000', loanId: 'LN-20451', status: 'Active' },
  { name: 'Samuel Koomson',initials: 'SK', color: '#B45309', relationship: 'Business partner', guaranteed: 'GH₵ 30,000', loanId: 'LN-20450', status: 'Verification' },
]

const mockSchedule = [
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
function Ava({ initials, color, size = 34 }: { initials: string; color: string; size?: number }) {
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

function MiniBar({ pct, color = T.green }: { pct: number; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, verticalAlign: 'middle' }}>
      <span style={{ display: 'inline-block', width: 80, height: 6, background: '#EEF1F6', borderRadius: 20, overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 20 }} />
      </span>
      <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{pct}%</span>
    </span>
  )
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(16,33,73,.05)', ...style }}>
      {children}
    </div>
  )
}

function PanelHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{title}</span>
      {action}
    </div>
  )
}

function Chip({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 140, boxShadow: '0 1px 3px rgba(16,33,73,.04)' }}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 5, color: valueColor ?? T.ink, letterSpacing: '-0.02em', fontFamily: "'Sora', sans-serif" }}>{value}</div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 11, letterSpacing: '0.05em', color: T.muted,
  fontWeight: 700, padding: '11px 20px', background: '#F8FAFD', textTransform: 'uppercase',
  fontFamily: "'DM Sans', sans-serif",
}
const tdStyle: React.CSSProperties = {
  padding: '13px 20px', borderTop: `1px solid ${T.border}`, fontSize: 13,
  fontWeight: 500, color: T.ink, fontFamily: "'DM Sans', sans-serif",
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function OverviewView({ onNavigate }: { onNavigate: (v: LoanView) => void }) {
  const stats = [
    { icon: <DollarSign style={{ width: 16, height: 16 }} />, iconBg: T.blueBg, iconColor: T.blue, label: 'Active Loans', value: '1,284', meta: 'GH₵ 18.4M out', metaColor: T.muted },
    { icon: <Clock style={{ width: 16, height: 16 }} />,      iconBg: T.amberBg, iconColor: T.amber, label: 'Pending Disb.', value: '37', meta: 'GH₵ 2.1M', metaColor: T.muted },
    { icon: <AlertTriangle style={{ width: 16, height: 16 }} />, iconBg: T.redBg, iconColor: T.red, label: 'PAR (30+)', value: '4.8%', meta: '▲ 0.6%', metaColor: T.red },
    { icon: <TrendingUp style={{ width: 16, height: 16 }} />, iconBg: T.purpleBg, iconColor: T.purple, label: 'Arrears', value: 'GH₵ 612K', meta: '92 loans', metaColor: T.muted },
    { icon: <BarChart2 style={{ width: 16, height: 16 }} />,  iconBg: T.greenBg, iconColor: T.green, label: 'Collections', value: 'GH₵ 3.2M', meta: '▲ 91%', metaColor: T.green },
  ]
  const pipeline = [
    { label: 'Submitted',    color: T.muted,  count: 24, amount: 'GH₵ 1.9M' },
    { label: 'Under Review', color: T.blue,   count: 12, amount: 'GH₵ 980K' },
    { label: 'Approved',     color: T.amber,  count: 9,  amount: 'GH₵ 720K' },
    { label: 'To Disburse',  color: T.green,  count: 5,  amount: 'GH₵ 410K' },
    { label: 'Rejected',     color: T.red,    count: 3,  amount: 'GH₵ 240K' },
  ]
  const recentApps = mockApplications.slice(0, 3)
  const aging = [
    { label: '1–30 days',  amount: 'GH₵ 248K', pct: 62, color: T.amber },
    { label: '31–60 days', amount: 'GH₵ 190K', pct: 46, color: '#E07B39' },
    { label: '61–90 days', amount: 'GH₵ 102K', pct: 28, color: T.red },
    { label: '90+ days',   amount: 'GH₵ 72K',  pct: 18, color: '#9B1C1C' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px', boxShadow: '0 1px 3px rgba(16,33,73,.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.iconColor }}>{s.icon}</div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink, fontFamily: "'Sora',sans-serif", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.metaColor, fontFamily: "'DM Sans',sans-serif" }}>{s.meta}</div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <Panel>
        <PanelHead title="Application Pipeline" action={
          <button onClick={() => onNavigate('applications')} style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>View board →</button>
        } />
        <div style={{ display: 'flex', gap: 10, padding: '16px 20px', flexWrap: 'wrap' }}>
          {pipeline.map(p => (
            <div key={p.label} style={{ flex: 1, minWidth: 100, border: `1px solid ${T.border}`, borderRadius: 11, padding: 14 }}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans',sans-serif" }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />{p.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 7, color: T.ink, fontFamily: "'Sora',sans-serif" }}>{p.count}</div>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>{p.amount}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Recent Apps + Arrears Aging */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        <Panel>
          <PanelHead title="Recent Applications" action={
            <button onClick={() => onNavigate('applications')} style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>See all →</button>
          } />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              {['Applicant', 'Product', 'Amount', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {recentApps.map(a => (
                <tr key={a.id}>
                  <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Ava initials={a.initials} color={a.color} /><div><div style={{ fontWeight: 700, fontSize: 13 }}>{a.clientName}</div><div style={{ fontSize: 11, color: T.muted }}>{a.id}</div></div></div></td>
                  <td style={tdStyle}>{a.product}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{a.amount}</td>
                  <td style={tdStyle}><StatusBadge status={a.stage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel>
          <PanelHead title="Arrears Aging" action={
            <button onClick={() => onNavigate('arrears')} style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>PAR report →</button>
          } />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {aging.map(a => (
              <div key={a.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                  <span style={{ color: T.ink }}>{a.label}</span>
                  <span style={{ color: T.muted }}>{a.amount}</span>
                </div>
                <div style={{ height: 7, background: '#EEF1F6', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${a.pct}%`, background: a.color, borderRadius: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ApplicationsView() {
  const [view, setView] = useState<'board' | 'table'>('board')
  const stages = ['Submitted', 'Under Review', 'Approved', 'To Disburse', 'Rejected']
  const stageDots: Record<string, string> = { Submitted: T.muted, 'Under Review': T.blue, Approved: T.amber, 'To Disburse': T.green, Rejected: T.red }
  const grouped = stages.reduce<Record<string, typeof mockApplications>>((acc, s) => {
    acc[s] = mockApplications.filter(a => a.stage === s); return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {['All Products', 'All Branches', 'Officer'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#41506E', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            {f} <ChevronDown style={{ width: 14, height: 14, color: T.muted }} />
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, background: '#EEF1F6', padding: 3, borderRadius: 9 }}>
          {(['board', 'table'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: view === v ? T.cardBg : 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, color: view === v ? T.ink : T.muted, padding: '7px 13px', borderRadius: 7, cursor: 'pointer', boxShadow: view === v ? '0 1px 3px rgba(16,33,73,.08)' : 'none' }}>
              {v === 'board' ? <LayoutGrid style={{ width: 14, height: 14 }} /> : <List style={{ width: 14, height: 14 }} />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, alignItems: 'start' }}>
          {stages.map(stage => (
            <div key={stage} style={{ background: '#F4F6FB', border: `1px solid #E9EDF5`, borderRadius: 13, padding: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 3px 3px' }}>
                <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: stageDots[stage], display: 'inline-block' }} />{stage}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '1px 7px', fontFamily: "'DM Sans',sans-serif" }}>{grouped[stage]?.length ?? 0}</span>
              </div>
              {(grouped[stage] ?? []).map(app => (
                <div key={app.id} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 11, boxShadow: '0 1px 2px rgba(16,33,73,.04)', cursor: 'grab' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ava initials={app.initials} color={app.color} size={26} />
                    <div><div style={{ fontWeight: 700, fontSize: 12, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>{app.clientName}</div><div style={{ fontSize: 11, color: T.muted }}>{app.id}</div></div>
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{app.product}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 7, color: T.ink, fontFamily: "'Sora',sans-serif" }}>{app.amount}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, fontSize: 11, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                    <span>{app.submitted}</span><span>{app.officer}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <Panel>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Applicant', 'Product', 'Amount', 'Stage', 'Officer', 'Submitted'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {mockApplications.map(a => (
                <tr key={a.id} style={{ cursor: 'pointer' }}>
                  <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Ava initials={a.initials} color={a.color} /><div><div style={{ fontWeight: 700 }}>{a.clientName}</div><div style={{ fontSize: 11, color: T.muted }}>{a.id}</div></div></div></td>
                  <td style={tdStyle}>{a.product}</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{a.amount}</td>
                  <td style={tdStyle}><StatusBadge status={a.stage} /></td>
                  <td style={tdStyle}>{a.officer}</td>
                  <td style={{ ...tdStyle, color: T.muted }}>{a.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  )
}

function ActiveLoansView({ onSelectLoan }: { onSelectLoan: (loan: ActiveLoan) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Chip label="Total Outstanding" value="GH₵ 18.4M" />
        <Chip label="On-time" value="1,192" valueColor={T.green} />
        <Chip label="In Arrears" value="92" valueColor={T.red} />
        <Chip label="Avg. Loan Size" value="GH₵ 14,300" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {['Status: All', 'All Products'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#41506E', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            {f} <ChevronDown style={{ width: 14, height: 14, color: T.muted }} />
          </div>
        ))}
      </div>
      <Panel>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Loan', 'Client', 'Product', 'Outstanding', 'Next Due', 'Repaid', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {mockActiveLoans.map(loan => (
              <tr key={loan.id} onClick={() => onSelectLoan(loan)} style={{ cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: T.navy }}>{loan.id}</td>
                <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Ava initials={loan.initials} color={loan.color} /><span style={{ fontWeight: 600 }}>{loan.clientName}</span></div></td>
                <td style={tdStyle}>{loan.product}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{loan.outstanding}</td>
                <td style={{ ...tdStyle, color: loan.status === 'In Arrears' ? T.red : T.ink, fontWeight: loan.status === 'In Arrears' ? 700 : 500 }}>{loan.nextDue}</td>
                <td style={tdStyle}><MiniBar pct={loan.repaidPct} color={loan.status === 'In Arrears' ? T.red : T.green} /></td>
                <td style={tdStyle}><StatusBadge status={loan.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}

function DisbursementsView() {
  const [tab, setTab] = useState(0)
  const tabs = ['Pending (5)', 'Scheduled (8)', 'Disbursed']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, background: '#EEF1F6', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '7px 15px', borderRadius: 7, border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === i ? T.cardBg : 'none', color: tab === i ? T.ink : T.muted, boxShadow: tab === i ? '0 1px 3px rgba(16,33,73,.08)' : 'none' }}>
            {t}
          </button>
        ))}
      </div>
      <Panel>
        {mockDisbursements.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
            <Ava initials={d.initials} color={d.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>{d.clientName} · {d.amount}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>{d.product} · {d.loanId} · {d.detail}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
              {d.status === 'approved' ? (
                <><CheckCircle2 style={{ width: 13, height: 13, color: T.green }} />Approved by {d.approvedBy}</>
              ) : (
                <><Clock style={{ width: 13, height: 13, color: T.amber }} />Awaiting checker</>
              )}
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#EEF1F6', color: '#41506E', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>View</button>
              {d.status === 'approved' ? (
                <button style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: T.green, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Disburse</button>
              ) : (
                <button style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: T.navy, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Approve</button>
              )}
            </div>
          </div>
        ))}
      </Panel>
    </div>
  )
}

function RepaymentsView() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
      <Panel>
        <PanelHead title="Record a Repayment" />
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Loan account</label>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 13, color: T.ink, background: T.cardBg, fontFamily: "'DM Sans',sans-serif" }}>LN-20142 · Adwoa Mensa · Group Loan</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Amount (GH₵)</label>
              <input defaultValue="1,200.00" style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans',sans-serif", outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Value date</label>
              <input type="date" defaultValue="2026-05-26" style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans',sans-serif", outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Payment method</label>
            <div style={{ display: 'flex', gap: 7 }}>
              {['MoMo', 'Bank', 'Cash'].map((m, i) => (
                <div key={m} style={{ flex: 1, border: `1px solid ${i === 0 ? T.navy : T.border}`, borderRadius: 9, padding: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: i === 0 ? T.navy : '#41506E', background: i === 0 ? '#F4F6FB' : T.cardBg, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{m}</div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Allocation preview</label>
            <div style={{ background: '#F8FAFD', border: `1px solid ${T.border}`, borderRadius: 11, padding: '14px 16px' }}>
              {[['Penalty / late fee', 'GH₵ 80.00'], ['Interest', 'GH₵ 210.00'], ['Fees', 'GH₵ 35.00'], ['Principal', 'GH₵ 875.00']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                  <span style={{ color: T.muted }}>{l}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '10px 0 0', borderTop: `1px dashed #D5DCE8`, marginTop: 5, fontWeight: 800, fontFamily: "'Sora',sans-serif" }}>
                <span>Total applied</span><span>GH₵ 1,200.00</span>
              </div>
            </div>
          </div>
          <button style={{ width: '100%', padding: '11px', background: T.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Post Repayment</button>
        </div>
      </Panel>
      <Panel>
        <PanelHead title="Recent Repayments" action={<button style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>View all →</button>} />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {mockRepaymentHistory.map((r, i) => (
              <tr key={i}>
                <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Ava initials={r.initials} color={r.color} /><div><div style={{ fontWeight: 700, fontSize: 13 }}>{r.clientName}</div><div style={{ fontSize: 11, color: T.muted }}>{r.method} · {r.date}</div></div></div></td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{r.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}

function ArrearsView() {
  const aging = [
    { label: '1–30 days · 51 loans',  amount: 'GH₵ 248K', pct: 62, color: T.amber },
    { label: '31–60 days · 24 loans', amount: 'GH₵ 190K', pct: 46, color: '#E07B39' },
    { label: '61–90 days · 11 loans', amount: 'GH₵ 102K', pct: 28, color: T.red },
    { label: '90+ days · 6 loans',    amount: 'GH₵ 72K',  pct: 18, color: '#9B1C1C' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Chip label="PAR > 30 days"    value="4.8%"       valueColor={T.amber} />
        <Chip label="PAR > 90 days"    value="1.4%"       valueColor={T.red} />
        <Chip label="Loans in Arrears" value="92" />
        <Chip label="Recovered (May)"  value="GH₵ 188K"  valueColor={T.green} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        <Panel>
          <PanelHead title="Overdue Loans" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Client', 'Outstanding', 'Overdue', 'Bucket'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {mockOverdueLoans.map((l, i) => (
                <tr key={i}>
                  <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Ava initials={l.initials} color={l.color} /><span style={{ fontWeight: 600 }}>{l.clientName}</span></div></td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{l.outstanding}</td>
                  <td style={{ ...tdStyle, color: T.red, fontWeight: 700 }}>{l.overdue}</td>
                  <td style={tdStyle}><StatusBadge status={l.bucket} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel>
          <PanelHead title="Aging Distribution" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {aging.map(a => (
              <div key={a.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                  <span style={{ color: T.ink }}>{a.label}</span>
                  <span style={{ color: T.muted }}>{a.amount}</span>
                </div>
                <div style={{ height: 7, background: '#EEF1F6', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${a.pct}%`, background: a.color, borderRadius: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ProductsView() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      {mockLoanProducts.map(p => (
        <div key={p.name} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 1px 3px rgba(16,33,73,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, fontFamily: "'Sora',sans-serif" }}>{p.name}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, color: p.typeColor, fontFamily: "'DM Sans',sans-serif" }}>● {p.type}</div>
            </div>
            <div style={{ width: 36, height: 21, borderRadius: 20, background: p.active ? T.green : '#CBD3E0', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: p.active ? 'auto' : 2, right: p.active ? 2 : 'auto', width: 17, height: 17, borderRadius: '50%', background: '#fff', transition: '0.2s' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            {[['Interest', p.interest], ['Term', p.term], ['Max amount', p.maxAmount], [p.extra.label, p.extra.value]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 11, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{l}</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>{v}</div></div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.border}`, paddingTop: 13, fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
            <span>{p.active ? `${p.count} active loans` : 'Inactive · 0 loans'}</span>
            <button style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Edit</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ApprovalsView() {
  const [tab, setTab] = useState(0)
  const tabs = ['My queue (9)', 'All pending', 'History']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 4, background: '#EEF1F6', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '7px 15px', borderRadius: 7, border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === i ? T.cardBg : 'none', color: tab === i ? T.ink : T.muted, boxShadow: tab === i ? '0 1px 3px rgba(16,33,73,.08)' : 'none' }}>{t}</button>
        ))}
      </div>
      <Panel>
        {mockApprovals.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: a.typeBg, color: a.typeColor, whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif", border: `1px solid ${a.typeBg === T.blueBg ? T.blueBorder : 'transparent'}` }}>{a.type}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>{a.clientName} · {a.amount}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>{a.detail} · maker: {a.maker} · {a.ago}</div>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <button style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#EEF1F6', color: '#41506E', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Reject</button>
              <button style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: T.navy, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Approve</button>
            </div>
          </div>
        ))}
      </Panel>
    </div>
  )
}

function CollateralView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Panel>
        <PanelHead title="Collateral Register" />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Asset', 'Type', 'Valuation', 'Linked Loan', 'LTV', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {mockCollateral.map((c, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{c.asset}</td>
                <td style={tdStyle}>{c.type}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{c.valuation}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: T.navy }}>{c.loanId}</td>
                <td style={tdStyle}>{c.ltv}</td>
                <td style={tdStyle}><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel>
        <PanelHead title="Guarantors" />
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Guarantor', 'Relationship', 'Guaranteed', 'For Loan', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {mockGuarantors.map((g, i) => (
              <tr key={i}>
                <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Ava initials={g.initials} color={g.color} /><span style={{ fontWeight: 700 }}>{g.name}</span></div></td>
                <td style={tdStyle}>{g.relationship}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{g.guaranteed}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: T.navy }}>{g.loanId}</td>
                <td style={tdStyle}><StatusBadge status={g.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}

function LoanDetailView({ loan, onBack }: { loan: ActiveLoan; onBack: () => void }) {
  const [tab, setTab] = useState(0)
  const tabs = ['Repayment Schedule', 'Transactions', 'Documents']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back + header */}
      <div>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>
          <ArrowLeft style={{ width: 15, height: 15 }} />Back to Active Loans
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Ava initials={loan.initials} color={loan.color} size={48} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif" }}>LOAN · {loan.id}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, fontFamily: "'Sora',sans-serif", marginTop: 2 }}>{loan.clientName}</div>
              <div style={{ fontSize: 14, color: T.muted, marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>{loan.product}</div>
            </div>
            <StatusBadge status={loan.status} />
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.cardBg, color: '#41506E', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}><FileText style={{ width: 15, height: 15 }} />Statement</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.cardBg, color: '#41506E', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Reschedule</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 9, border: 'none', background: T.navy, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}><DollarSign style={{ width: 15, height: 15 }} />Record Repayment</button>
          </div>
        </div>
      </div>

      {/* 4 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[['Principal', loan.principal], ['Outstanding', loan.outstanding], ['Interest rate', loan.rate], ['Next due', loan.nextDue]].map(([l, v]) => (
          <div key={l} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 13, padding: '15px 17px', boxShadow: '0 1px 3px rgba(16,33,73,.04)' }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{l}</div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 5, letterSpacing: '-0.02em', color: T.ink, fontFamily: "'Sora',sans-serif" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#EEF1F6', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '7px 15px', borderRadius: 7, border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === i ? T.cardBg : 'none', color: tab === i ? T.ink : T.muted, boxShadow: tab === i ? '0 1px 3px rgba(16,33,73,.08)' : 'none' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
          <Panel>
            <PanelHead title="Repayment Schedule" action={<button style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Download CSV →</button>} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Due Date', 'Principal', 'Interest', 'Total Due', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {mockSchedule.map(r => (
                  <tr key={r.no}>
                    <td style={{ ...tdStyle, color: T.muted, fontSize: 12 }}>{r.no}</td>
                    <td style={tdStyle}>{r.date}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.principal}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.interest}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.total}</td>
                    <td style={tdStyle}><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel>
            <PanelHead title="Loan Details" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px 22px', padding: '18px 20px' }}>
              {[['Term', loan.term], ['Disbursed', loan.disbursed], ['Maturity', loan.maturity], ['Interest method', 'Declining balance'], ['Repayment', 'Monthly'], ['Officer', loan.officer]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{l}</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>{v}</div></div>
              ))}
            </div>
          </Panel>
        </div>
      )}
      {tab === 1 && (
        <Panel><div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Transaction history will appear here once the backend is connected.</div></Panel>
      )}
      {tab === 2 && (
        <Panel><div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Documents will appear here once the backend is connected.</div></Panel>
      )}
    </div>
  )
}

const VIEW_TITLES: Record<LoanView, string> = {
  overview: 'Overview', applications: 'Applications', active: 'Active Loans',
  disbursements: 'Disbursements', repayments: 'Repayments', arrears: 'Arrears & PAR',
  products: 'Loan Products', approvals: 'Approvals', collateral: 'Collateral & Guarantors',
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoanManagementPage() {
  const [searchParams] = useSearchParams()
  const routerNavigate = useNavigate()
  const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)

  const activeView = (searchParams.get('view') ?? 'overview') as LoanView

  const navigateToView = (v: LoanView) => {
    setSelectedLoan(null)
    routerNavigate(`${ROUTES.LOANS}?view=${v}`)
  }

  const isDetail = activeView === 'active' && selectedLoan !== null

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            {isDetail ? selectedLoan!.clientName : VIEW_TITLES[activeView]}
          </h1>
          {activeView === 'overview' && (
            <div style={{ display: 'flex', gap: 9 }}>
              <Button variant="outline" style={{ fontSize: 13 }}><Download style={{ width: 14, height: 14 }} />Export</Button>
              <Button style={{ background: T.navy, fontSize: 13 }}><Plus style={{ width: 14, height: 14 }} />New Application</Button>
            </div>
          )}
          {activeView === 'applications' && (
            <Button style={{ background: T.navy, fontSize: 13 }}><Plus style={{ width: 14, height: 14 }} />New Application</Button>
          )}
          {activeView === 'active' && !isDetail && (
            <Button variant="outline" style={{ fontSize: 13 }}><Download style={{ width: 14, height: 14 }} />Export</Button>
          )}
          {activeView === 'arrears' && (
            <Button variant="outline" style={{ fontSize: 13 }}>Run PAR report</Button>
          )}
          {activeView === 'products' && (
            <Button style={{ background: T.navy, fontSize: 13 }}><Plus style={{ width: 14, height: 14 }} />New Product</Button>
          )}
          {activeView === 'collateral' && (
            <div style={{ display: 'flex', gap: 9 }}>
              <Button variant="outline" style={{ fontSize: 13 }}>Add guarantor</Button>
              <Button style={{ background: T.navy, fontSize: 13 }}>Register collateral</Button>
            </div>
          )}
        </div>
      </div>

      {/* View content */}
      {isDetail
        ? <LoanDetailView loan={selectedLoan!} onBack={() => setSelectedLoan(null)} />
        : activeView === 'overview'      ? <OverviewView onNavigate={navigateToView} />
        : activeView === 'applications'  ? <ApplicationsView />
        : activeView === 'active'        ? <ActiveLoansView onSelectLoan={setSelectedLoan} />
        : activeView === 'disbursements' ? <DisbursementsView />
        : activeView === 'repayments'    ? <RepaymentsView />
        : activeView === 'arrears'       ? <ArrearsView />
        : activeView === 'products'      ? <ProductsView />
        : activeView === 'approvals'     ? <ApprovalsView />
        : <CollateralView />
      }
    </div>
  )
}
