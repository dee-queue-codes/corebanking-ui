import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, AlertTriangle, DollarSign, BarChart2, Clock, Download, Plus } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { T, mockApplications, Panel, PanelHead, Ava, thStyle, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'
import { NewLoanApplicationDialog } from '@/components/loans/NewLoanApplicationDialog'

export default function LoanOverviewPage() {
  const navigate = useNavigate()
  const [showDialog, setShowDialog] = useState(false)

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
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
            
      <LoanSubNav />
      
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Overview
          </h1>
          <div style={{ display: 'flex', gap: 9 }}>
            <Button variant="outline" style={{ fontSize: 13 }}><Download style={{ width: 14, height: 14 }} />Export</Button>
            <Button style={{ background: T.navy, fontSize: 13 }} onClick={() => setShowDialog(true)}><Plus style={{ width: 14, height: 14 }} />New Application</Button>
          </div>
        </div>
      </div>

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
            <button onClick={() => navigate('/loans/applications')} style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>View board →</button>
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
              <button onClick={() => navigate('/loans/applications')} style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>See all →</button>
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
              <button onClick={() => navigate('/loans/arrears')} style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>PAR report →</button>
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
      <NewLoanApplicationDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  )
}
