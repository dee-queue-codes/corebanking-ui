import { T, mockRepaymentHistory, Panel, PanelHead, Ava, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'

export default function LoanRepaymentsPage() {
  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Repayments
          </h1>
        </div>
      </div>

      <LoanSubNav />

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
    </div>
  )
}

