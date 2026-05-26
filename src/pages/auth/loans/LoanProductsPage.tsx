import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { T, mockLoanProducts } from './loanShared'
import { LoanSubNav } from './LoanSubNav'

export default function LoanProductsPage() {
  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>

      <LoanSubNav />

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Loan Products
          </h1>
          <Button style={{ background: T.navy, fontSize: 13 }}><Plus style={{ width: 14, height: 14 }} />New Product</Button>
        </div>
      </div>

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
    </div>
  )
}
