import { useState, useEffect } from 'react'
import { ChevronDown, Download, ArrowLeft, FileText, DollarSign } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { T, ActiveLoan, Panel, PanelHead, Ava, MiniBar, thStyle, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'
import { loansAPI } from '@/services/loans/loansAPI'

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A'
  return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDateArr(raw: unknown): string {
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw as number[]
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${d < 10 ? '0' + d : d} ${months[m - 1]} ${y}`
  }
  if (typeof raw === 'string' && raw) {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return '—'
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'NA'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const COLORS = ['#0A2F6D', '#B45309', '#059669', '#7C3AED', '#DC2626', '#0891B2']
function getColor(id: unknown): string {
  const num = typeof id === 'number' ? id : parseInt(String(id), 10) || 0
  return COLORS[Math.abs(num) % COLORS.length]
}

function getLoanStatus(loan: Record<string, unknown>): string {
  const status = loan.status as Record<string, unknown> | undefined
  if (!status) return 'Current'
  const id = Number(status.id ?? 0)
  if (id === 300) {
    // Check if in arrears
    const overdue = Number(loan.numberOfInstallmentsInArrears ?? loan.overdueSinceDate ?? 0)
    if (overdue > 0) return 'In Arrears'
    return 'Current'
  }
  const code = String(status.code ?? '').toLowerCase()
  if (code.includes('arrear') || code.includes('overdue')) return 'In Arrears'
  if (code.includes('active')) return 'Current'
  if (code.includes('closed')) return 'Closed'
  return 'Current'
}

function extractLoans(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.pageItems)) return d.pageItems as Record<string, unknown>[]
    if (Array.isArray(d.content)) return d.content as Record<string, unknown>[]
    if (Array.isArray(d.data)) return d.data as Record<string, unknown>[]
  }
  return []
}

function toLoanActive(loan: Record<string, unknown>): ActiveLoan {
  const id = text(loan.accountNo) || `LN-${text(loan.id)}`
  const clientName = text(loan.clientName) || text(loan.clientDisplayName) || `Client #${text(loan.clientId)}`
  const initials = getInitials(clientName)
  const color = getColor(loan.id)
  const product = text(loan.loanProductName) || text(loan.productName) || '—'
  const principal = Number(loan.principal ?? loan.approvedPrincipal ?? 0)
  const summary = loan.summary as Record<string, unknown> | undefined
  const outstanding = Number(summary?.principalOutstanding ?? loan.principalOutstanding ?? 0)
  const interestRate = Number(loan.annualInterestRate ?? loan.interestRatePerPeriod ?? 0)
  const repayments = Number(loan.numberOfRepayments ?? 0)
  const repaid = Number(summary?.principalPaid ?? loan.principalPaid ?? 0)
  const repaidPct = principal > 0 ? Math.round((repaid / principal) * 100) : 0
  const timeline = loan.timeline as Record<string, unknown> | undefined
  const disbursed = formatDateArr(timeline?.actualDisbursementDate ?? loan.disbursementDate)
  const status = getLoanStatus(loan)
  const officer = text(loan.loanOfficerName) || '—'
  const term = repayments > 0 ? `${repayments} months` : '—'

  return {
    id,
    clientName,
    initials,
    color,
    product,
    outstanding: formatCurrency(outstanding),
    nextDue: '—',
    repaidPct,
    status,
    principal: formatCurrency(principal),
    rate: `${interestRate}% p.a.`,
    term,
    disbursed,
    maturity: '—',
    officer,
  }
}

// ── Repayment schedule types ──────────────────────────────────────────────────

interface ScheduleRow {
  no: number
  date: string
  principal: string
  interest: string
  total: string
  status: string
}

function extractSchedule(data: unknown): ScheduleRow[] {
  const scheduleData = (() => {
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      if (Array.isArray(d.periods)) return d.periods as Record<string, unknown>[]
      if (d.repaymentSchedule && typeof d.repaymentSchedule === 'object') {
        const rs = d.repaymentSchedule as Record<string, unknown>
        if (Array.isArray(rs.periods)) return rs.periods as Record<string, unknown>[]
      }
    }
    return []
  })()

  return scheduleData
    .filter(p => Number(p.period ?? 0) > 0)
    .map((p, i) => ({
      no: Number(p.period ?? i + 1),
      date: formatDateArr(p.dueDate),
      principal: Number(p.principalDue ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      interest: Number(p.interestDue ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      total: Number(p.totalDueForPeriod ?? p.totalOutstandingForPeriod ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      status: p.complete === true ? 'Paid' : (p.dueDate && new Date() > new Date((p.dueDate as number[]).join('-'))) ? 'Due' : 'Upcoming',
    }))
}

// ── Detail View ───────────────────────────────────────────────────────────────

function LoanDetailView({ loan, onBack }: { loan: ActiveLoan; onBack: () => void }) {
  const [tab, setTab] = useState(0)
  const tabs = ['Repayment Schedule', 'Transactions', 'Documents']
  const [schedule, setSchedule] = useState<ScheduleRow[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(true)

  useEffect(() => {
    setScheduleLoading(true)
    const loanId = loan.id.replace('LN-', '')
    loansAPI.getRepaymentSchedule(loanId, { _skipAuthRedirect: true })
      .then(res => setSchedule(extractSchedule(res.data)))
      .catch(() => setSchedule([]))
      .finally(() => setScheduleLoading(false))
  }, [loan.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[['Principal', loan.principal], ['Outstanding', loan.outstanding], ['Interest rate', loan.rate], ['Term', loan.term]].map(([l, v]) => (
          <div key={l} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 13, padding: '15px 17px', boxShadow: '0 1px 3px rgba(16,33,73,.04)' }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{l}</div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 5, letterSpacing: '-0.02em', color: T.ink, fontFamily: "'Sora',sans-serif" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#EEF1F6', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{ padding: '7px 15px', borderRadius: 7, border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === i ? T.cardBg : 'none', color: tab === i ? T.ink : T.muted, boxShadow: tab === i ? '0 1px 3px rgba(16,33,73,.08)' : 'none' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
          <Panel>
            <PanelHead title="Repayment Schedule" action={<button style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Download CSV →</button>} />
            {scheduleLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Loading schedule…</div>
            ) : schedule.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>No schedule available.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['#', 'Due Date', 'Principal', 'Interest', 'Total Due', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {schedule.map(r => (
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
            )}
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LoanActiveLoansPage() {
  const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)
  const [loans, setLoans] = useState<ActiveLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const isDetail = selectedLoan !== null

  useEffect(() => {
    setLoading(true)
    setLoadError('')
    loansAPI.getApplications({ loanStatus: 'active', limit: 200, offset: 0 }, { _skipAuthRedirect: true })
      .then(res => {
        const raw = extractLoans(res.data)
        setLoans(raw.map(toLoanActive))
      })
      .catch(() => setLoadError('Could not load active loans.'))
      .finally(() => setLoading(false))
  }, [])

  const totalOutstanding = loans.reduce((sum, l) => {
    const num = parseFloat(l.outstanding.replace(/[^0-9.]/g, '')) || 0
    return sum + num
  }, 0)
  const inArrears = loans.filter(l => l.status === 'In Arrears').length
  const onTime = loans.length - inArrears

  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <LoanSubNav />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            {isDetail ? selectedLoan!.clientName : 'Active Loans'}
          </h1>
          {!isDetail && (
            <Button variant="outline" style={{ fontSize: 13 }}><Download style={{ width: 14, height: 14 }} />Export</Button>
          )}
        </div>
      </div>

      {isDetail ? (
        <LoanDetailView loan={selectedLoan!} onBack={() => setSelectedLoan(null)} />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Loading active loans…</div>
      ) : loadError ? (
        <div style={{ textAlign: 'center', padding: 40, color: T.red, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>{loadError}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Outstanding', value: formatCurrency(totalOutstanding) },
              { label: 'On-time', value: String(onTime), valueColor: T.green },
              { label: 'In Arrears', value: String(inArrears), valueColor: T.red },
              { label: 'Total Active', value: String(loans.length) },
            ].map(chip => (
              <div key={chip.label} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 140, boxShadow: '0 1px 3px rgba(16,33,73,.04)' }}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{chip.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 5, color: chip.valueColor ?? T.ink, letterSpacing: '-0.02em', fontFamily: "'Sora', sans-serif" }}>{chip.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {['Status: All', 'All Products'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#41506E', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                {f} <ChevronDown style={{ width: 14, height: 14, color: T.muted }} />
              </div>
            ))}
          </div>
          <Panel>
            {loans.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>No active loans found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Loan', 'Client', 'Product', 'Outstanding', 'Repaid', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id} onClick={() => setSelectedLoan(loan)} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFD')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600, fontSize: 12, color: T.navy }}>{loan.id}</td>
                      <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Ava initials={loan.initials} color={loan.color} /><span style={{ fontWeight: 600 }}>{loan.clientName}</span></div></td>
                      <td style={tdStyle}>{loan.product}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{loan.outstanding}</td>
                      <td style={tdStyle}><MiniBar pct={loan.repaidPct} color={loan.status === 'In Arrears' ? T.red : T.green} /></td>
                      <td style={tdStyle}><StatusBadge status={loan.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}

