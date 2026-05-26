import { useState } from 'react'
import { T, mockApprovals, Panel } from './loanShared'
import { LoanSubNav } from './LoanSubNav'

export default function LoanApprovalsPage() {
  const [tab, setTab] = useState(0)
  const tabs = ['My queue (9)', 'All pending', 'History']

  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
            
      <LoanSubNav />
      
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Approvals
          </h1>
        </div>
      </div>

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
    </div>
  )
}
