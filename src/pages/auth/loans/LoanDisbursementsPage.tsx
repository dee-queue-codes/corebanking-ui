import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { T, Panel, Ava } from './loanShared'
import { LoanSubNav } from './LoanSubNav'
import { loansAPI } from '@/services/loans/loansAPI'

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function formatCurrency(amount: number): string {
  if (isNaN(amount)) return 'GH₵ 0'
  return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
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

function getStatusId(loan: Record<string, unknown>): number {
  const status = loan.status as Record<string, unknown> | undefined
  return Number(status?.id ?? 0)
}

interface DisbursementItem {
  id: string | number
  loanId: string
  clientName: string
  initials: string
  color: string
  product: string
  amount: string
  detail: string
  statusId: number
  approvedBy: string | null
  disbursed: boolean
}

function toLoanDisbursement(loan: Record<string, unknown>): DisbursementItem {
  const id = loan.id as string | number
  const loanId = text(loan.accountNo) || `LN-${text(id)}`
  const clientName = text(loan.clientName) || text(loan.clientDisplayName) || `Client #${text(loan.clientId)}`
  const initials = getInitials(clientName)
  const color = getColor(id)
  const product = text(loan.loanProductName) || '—'
  const principal = Number(loan.approvedPrincipal ?? loan.principal ?? 0)
  const amount = formatCurrency(principal)
  const detail = text(loan.loanOfficerName) ? `Officer: ${text(loan.loanOfficerName)}` : 'Pending disbursement'
  const statusId = getStatusId(loan)
  const disbursed = statusId === 300
  return { id, loanId, clientName, initials, color, product, amount, detail, statusId, approvedBy: null, disbursed }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoanDisbursementsPage() {
  const [tab, setTab] = useState(0)
  const tabs = ['Pending Approval', 'Ready to Disburse', 'Disbursed']

  const [items, setItems] = useState<DisbursementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [processing, setProcessing] = useState<Record<string | number, boolean>>({})
  const [actionMsg, setActionMsg] = useState<Record<string | number, string>>({})

  const loadData = useCallback(() => {
    setLoading(true)
    setLoadError('')
    loansAPI.getApplications({ limit: 200, offset: 0 }, { _skipAuthRedirect: true })
      .then(res => {
        const raw = extractLoans(res.data)
        // Show submitted (100), approved (200), and recently active (300) loans
        const filtered = raw.filter(l => [100, 200, 300].includes(getStatusId(l)))
        setItems(filtered.map(toLoanDisbursement))
      })
      .catch(() => setLoadError('Could not load disbursements.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const pendingApproval = items.filter(i => i.statusId === 100)
  const readyToDisburse = items.filter(i => i.statusId === 200)
  const disbursed = items.filter(i => i.disbursed)

  const tabItems = [pendingApproval, readyToDisburse, disbursed][tab] ?? []

  const handleApprove = async (item: DisbursementItem) => {
    setProcessing(p => ({ ...p, [item.id]: true }))
    setActionMsg(m => ({ ...m, [item.id]: '' }))
    try {
      await loansAPI.approveApplication(item.id, {
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        approvedOnDate: todayFormatted(),
        note: 'Approved',
      }, { _skipAuthRedirect: true })
      setActionMsg(m => ({ ...m, [item.id]: 'Approved!' }))
      setTimeout(() => loadData(), 1000)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string; responseMessage?: string } } }).response?.data?.message
        ?? (err as { response?: { data?: { responseMessage?: string } } }).response?.data?.responseMessage
        ?? 'Approval failed.'
      setActionMsg(m => ({ ...m, [item.id]: msg }))
    } finally {
      setProcessing(p => ({ ...p, [item.id]: false }))
    }
  }

  const handleDisburse = async (item: DisbursementItem) => {
    setProcessing(p => ({ ...p, [item.id]: true }))
    setActionMsg(m => ({ ...m, [item.id]: '' }))
    try {
      await loansAPI.disburse(item.id, {
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        actualDisbursementDate: todayFormatted(),
        note: 'Disbursed',
      }, { _skipAuthRedirect: true })
      setActionMsg(m => ({ ...m, [item.id]: 'Disbursed!' }))
      setTimeout(() => loadData(), 1000)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string; responseMessage?: string } } }).response?.data?.message
        ?? (err as { response?: { data?: { responseMessage?: string } } }).response?.data?.responseMessage
        ?? 'Disbursement failed.'
      setActionMsg(m => ({ ...m, [item.id]: msg }))
    } finally {
      setProcessing(p => ({ ...p, [item.id]: false }))
    }
  }

  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <LoanSubNav />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Disbursements
          </h1>
          <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.cardBg, color: '#41506E', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            <RefreshCw style={{ width: 14, height: 14 }} />Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: '#EEF1F6', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{ padding: '7px 15px', borderRadius: 7, border: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', background: tab === i ? T.cardBg : 'none', color: tab === i ? T.ink : T.muted, boxShadow: tab === i ? '0 1px 3px rgba(16,33,73,.08)' : 'none' }}>
              {t} ({[pendingApproval, readyToDisburse, disbursed][i]?.length ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.red, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>{loadError}</div>
        ) : (
          <Panel>
            {tabItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>No items in this tab.</div>
            ) : tabItems.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
                <Ava initials={d.initials} color={d.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>{d.clientName} · {d.amount}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>{d.product} · {d.loanId} · {d.detail}</div>
                  {actionMsg[d.id] && (
                    <div style={{ fontSize: 12, marginTop: 4, color: actionMsg[d.id].includes('!') ? T.green : T.red, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                      {actionMsg[d.id]}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.muted, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                  {d.disbursed ? (
                    <><CheckCircle2 style={{ width: 13, height: 13, color: T.green }} />Disbursed</>
                  ) : d.statusId === 200 ? (
                    <><CheckCircle2 style={{ width: 13, height: 13, color: T.green }} />Approved</>
                  ) : (
                    <><Clock style={{ width: 13, height: 13, color: T.amber }} />Awaiting approval</>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#EEF1F6', color: '#41506E', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>View</button>
                  {d.disbursed ? null : d.statusId === 200 ? (
                    <button
                      disabled={processing[d.id]}
                      onClick={() => handleDisburse(d)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: processing[d.id] ? '#9CA3AF' : 'rgb(22, 163, 74)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: processing[d.id] ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {processing[d.id] ? 'Processing…' : 'Disburse'}
                    </button>
                  ) : (
                    <button
                      disabled={processing[d.id]}
                      onClick={() => handleApprove(d)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: processing[d.id] ? '#9CA3AF' : T.navy, color: '#fff', fontSize: 12, fontWeight: 700, cursor: processing[d.id] ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {processing[d.id] ? 'Processing…' : 'Approve'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </Panel>
        )}
      </div>
    </div>
  )
}
