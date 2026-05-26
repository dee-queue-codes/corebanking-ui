import { useState } from 'react'
import { ChevronDown, Download, ArrowLeft, FileText, DollarSign } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  T, ActiveLoan, mockActiveLoans, mockSchedule,
  Panel, PanelHead, Ava, MiniBar, thStyle, tdStyle,
} from './loanShared'
import { LoanSubNav } from './LoanSubNav'

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

export default function LoanActiveLoansPage() {
  const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)
  const isDetail = selectedLoan !== null

  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>

      <LoanSubNav />
      
      {/* Page header */}
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Outstanding', value: 'GH₵ 18.4M' },
              { label: 'On-time', value: '1,192', valueColor: T.green },
              { label: 'In Arrears', value: '92', valueColor: T.red },
              { label: 'Avg. Loan Size', value: 'GH₵ 14,300' },
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Loan', 'Client', 'Product', 'Outstanding', 'Next Due', 'Repaid', 'Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {mockActiveLoans.map(loan => (
                  <tr key={loan.id} onClick={() => setSelectedLoan(loan)} style={{ cursor: 'pointer' }}
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
      )}
    </div>
  )
}
