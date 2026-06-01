import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { T, Panel } from './loanShared'
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

function formatDateShort(raw: unknown): string {
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw as number[]
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${d} ${months[m - 1]} ${y}`
  }
  if (typeof raw === 'string' && raw) {
    const dt = new Date(raw)
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return '—'
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

interface ApprovalItem {
  id: string | number
  loanId: string
  clientName: string
  amount: string
  product: string
  officer: string
  submittedDate: string
  statusId: number
}

function toApprovalItem(loan: Record<string, unknown>): ApprovalItem {
  const id = loan.id as string | number
  const loanId = text(loan.accountNo) || `LN-${text(id)}`
  const clientName = text(loan.clientName) || text(loan.clientDisplayName) || `Client #${text(loan.clientId)}`
  const principal = Number(loan.principal ?? loan.approvedPrincipal ?? 0)
  const amount = formatCurrency(principal)
  const product = text(loan.loanProductName) || '—'
  const officer = text(loan.loanOfficerName) || '—'
  const timeline = loan.timeline as Record<string, unknown> | undefined
  const submittedDate = formatDateShort(timeline?.submittedOnDate ?? loan.submittedOnDate)
  const statusId = getStatusId(loan)
  return { id, loanId, clientName, amount, product, officer, submittedDate, statusId }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoanApprovalsPage() {
  const [tab, setTab] = useState(0)
  const tabs = ['Pending Approval', 'Approved', 'Rejected']

  const [items, setItems] = useState<ApprovalItem[]>([])
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
        setItems(raw.map(toApprovalItem))
      })
      .catch(() => setLoadError('Could not load loan applications.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const pending  = items.filter(i => i.statusId === 100)
  const approved = items.filter(i => i.statusId === 200)
  const rejected = items.filter(i => i.statusId === 500)

  const tabItems = [pending, approved, rejected][tab] ?? []

  const handleApprove = async (item: ApprovalItem) => {
    setProcessing(p => ({ ...p, [item.id]: true }))
    setActionMsg(m => ({ ...m, [item.id]: '' }))
    try {
      await loansAPI.approveApplication(item.id, {
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        approvedOnDate: todayFormatted(),
        note: 'Approved by checker',
      }, { _skipAuthRedirect: true })
      setActionMsg(m => ({ ...m, [item.id]: 'Approved!' }))
      setTimeout(() => loadData(), 1200)
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data
      const msg = String(data?.message ?? data?.responseMessage ?? data?.errors ?? 'Approval failed.')
      setActionMsg(m => ({ ...m, [item.id]: msg }))
    } finally {
      setProcessing(p => ({ ...p, [item.id]: false }))
    }
  }

  const handleReject = async (item: ApprovalItem) => {
    setProcessing(p => ({ ...p, [item.id]: true }))
    setActionMsg(m => ({ ...m, [item.id]: '' }))
    try {
      await loansAPI.rejectApplication(item.id, {
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        rejectedOnDate: todayFormatted(),
        note: 'Rejected by checker',
      }, { _skipAuthRedirect: true })
      setActionMsg(m => ({ ...m, [item.id]: 'Rejected.' }))
      setTimeout(() => loadData(), 1200)
    } catch (err) {
      const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data
      const msg = String(data?.message ?? data?.responseMessage ?? 'Rejection failed.')
      setActionMsg(m => ({ ...m, [item.id]: msg }))
    } finally {
      setProcessing(p => ({ ...p, [item.id]: false }))
    }
  }

  const statusColors = [T.amber, T.green, T.red]
  const statusBgs = [T.amberBg, T.greenBg, T.redBg]

  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <LoanSubNav />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Approvals
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
              {t} ({[pending, approved, rejected][i]?.length ?? 0})
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
            ) : tabItems.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderTop: i === 0 ? 'none' : `1px solid ${T.border}` }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusBgs[tab], color: statusColors[tab], whiteSpace: 'nowrap', fontFamily: "'DM Sans',sans-serif" }}>
                  {tabs[tab]}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>{a.clientName} · {a.amount}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 3, fontFamily: "'DM Sans',sans-serif" }}>
                    {a.product} · {a.loanId} · Submitted: {a.submittedDate} · Officer: {a.officer}
                  </div>
                  {actionMsg[a.id] && (
                    <div style={{ fontSize: 12, marginTop: 4, color: actionMsg[a.id].includes('!') ? T.green : T.red, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
                      {actionMsg[a.id]}
                    </div>
                  )}
                </div>
                {tab === 0 && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      disabled={processing[a.id]}
                      onClick={() => handleReject(a)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: processing[a.id] ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: processing[a.id] ? 0.6 : 1 }}
                    >
                      {processing[a.id] ? '…' : 'Reject'}
                    </button>
                    <button
                      disabled={processing[a.id]}
                      onClick={() => handleApprove(a)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: processing[a.id] ? '#9CA3AF' : '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: processing[a.id] ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                    >
                      {processing[a.id] ? 'Processing…' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </Panel>
        )}
      </div>
    </div>
  )
}
