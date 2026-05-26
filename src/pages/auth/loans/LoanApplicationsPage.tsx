import { useState } from 'react'
import { ChevronDown, LayoutGrid, List, Plus } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { T, mockApplications, Panel, Ava, thStyle, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'

export default function LoanApplicationsPage() {
  const [view, setView] = useState<'board' | 'table'>('board')
  const stages = ['Submitted', 'Under Review', 'Approved', 'To Disburse', 'Rejected']
  const stageDots: Record<string, string> = { Submitted: T.muted, 'Under Review': T.blue, Approved: T.amber, 'To Disburse': T.green, Rejected: T.red }
  const grouped = stages.reduce<Record<string, typeof mockApplications>>((acc, s) => {
    acc[s] = mockApplications.filter(a => a.stage === s); return acc
  }, {})

  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
            
      <LoanSubNav />
      
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Applications
          </h1>
          <Button style={{ background: T.navy, fontSize: 13 }}><Plus style={{ width: 14, height: 14 }} />New Application</Button>
        </div>
      </div>

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
    </div>
  )
}
