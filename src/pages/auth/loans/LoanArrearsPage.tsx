import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { T, mockOverdueLoans, Panel, PanelHead, Chip, Ava, thStyle, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'

export default function LoanArrearsPage() {
  const aging = [
    { label: '1–30 days · 51 loans',  amount: 'GH₵ 248K', pct: 62, color: T.amber },
    { label: '31–60 days · 24 loans', amount: 'GH₵ 190K', pct: 46, color: '#E07B39' },
    { label: '61–90 days · 11 loans', amount: 'GH₵ 102K', pct: 28, color: T.red },
    { label: '90+ days · 6 loans',    amount: 'GH₵ 72K',  pct: 18, color: '#9B1C1C' },
  ]

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Arrears &amp; PAR
          </h1>
          <Button variant="outline" style={{ fontSize: 13 }}>Run PAR report</Button>
        </div>
      </div>

      <LoanSubNav />

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
    </div>
  )
}
