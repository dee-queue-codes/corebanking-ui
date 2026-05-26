import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { T, mockCollateral, mockGuarantors, Panel, PanelHead, Ava, thStyle, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'

export default function LoanCollateralPage() {
  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
            
      <LoanSubNav />
      
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Collateral &amp; Guarantors
          </h1>
          <div style={{ display: 'flex', gap: 9 }}>
            <Button variant="outline" style={{ fontSize: 13 }}>Add guarantor</Button>
            <Button style={{ background: T.navy, fontSize: 13 }}>Register collateral</Button>
          </div>
        </div>
      </div>

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
    </div>
  )
}
