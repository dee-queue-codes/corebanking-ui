import { useState } from 'react'
import { CheckCircle2, Clock } from 'lucide-react'
import { T, mockDisbursements, Panel, Ava } from './loanShared'
import { LoanSubNav } from './LoanSubNav'

export default function LoanDisbursementsPage() {
  const [tab, setTab] = useState(0)
  const tabs = ['Pending (5)', 'Scheduled (8)', 'Disbursed']

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Disbursements
          </h1>
        </div>
      </div>

      <LoanSubNav />

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
    </div>
  )
}
