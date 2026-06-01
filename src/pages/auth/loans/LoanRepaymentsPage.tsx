import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { T, Panel, PanelHead, Ava, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'
import { loansAPI } from '@/services/loans/loansAPI'

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function formatLoanDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateShort(raw: unknown): string {
  if (Array.isArray(raw) && raw.length >= 3) {
    const [, m, d] = raw as number[]
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${d} ${months[m - 1]}`
  }
  if (typeof raw === 'string' && raw) {
    const dt = new Date(raw)
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }
  return '—'
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

function extractTransactions(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.transactions)) return d.transactions as Record<string, unknown>[]
    if (Array.isArray(d.data)) return d.data as Record<string, unknown>[]
  }
  return []
}

interface RecentRepayment {
  id: string | number
  clientName: string
  initials: string
  color: string
  method: string
  date: string
  amount: string
}

// ── Component ─────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = ['MoMo', 'Bank', 'Cash']

export default function LoanRepaymentsPage() {
  const [loanIdInput, setLoanIdInput] = useState('')
  const [resolvedLoanId, setResolvedLoanId] = useState<string | null>(null)
  const [resolvedLoanLabel, setResolvedLoanLabel] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [amount, setAmount] = useState('')
  const [valueDate, setValueDate] = useState(todayIso())
  const [paymentMethod, setPaymentMethod] = useState('MoMo')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [submitError, setSubmitError] = useState('')

  const [recent, setRecent] = useState<RecentRepayment[]>([])
  const [recentLoading, setRecentLoading] = useState(false)

  // Load recent repayments when loan is resolved
  const loadRecent = useCallback((loanId: string) => {
    setRecentLoading(true)
    loansAPI.getTransactions(loanId, { _skipAuthRedirect: true })
      .then(res => {
        const txns = extractTransactions(res.data)
        const repayments = txns
          .filter(t => {
            const type = (t.type as Record<string, unknown> | undefined)
            return String(type?.code ?? '').toLowerCase().includes('repayment')
              || String(type?.value ?? '').toLowerCase().includes('repayment')
          })
          .slice(0, 10)
          .map(t => ({
            id: t.id as string | number,
            clientName: resolvedLoanLabel.split('·')[0]?.trim() || 'Client',
            initials: getInitials(resolvedLoanLabel.split('·')[0]?.trim() || 'CL'),
            color: getColor(t.id),
            method: 'Bank',
            date: formatDateShort(t.date),
            amount: `GH₵ ${Number(t.amount ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          }))
        setRecent(repayments)
      })
      .catch(() => setRecent([]))
      .finally(() => setRecentLoading(false))
  }, [resolvedLoanLabel])

  useEffect(() => {
    if (resolvedLoanId) loadRecent(resolvedLoanId)
  }, [resolvedLoanId, loadRecent])

  const handleLoanSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = loanIdInput.trim()
    if (!val) return
    setSearching(true)
    setSearchError('')
    setResolvedLoanId(null)
    setResolvedLoanLabel('')
    try {
      const res = await loansAPI.getApplicationById(val, { _skipAuthRedirect: true })
      const raw = res.data as unknown
      const loan = (() => {
        if (raw && typeof raw === 'object') {
          const d = raw as Record<string, unknown>
          if (d.data && typeof d.data === 'object') return d.data as Record<string, unknown>
          return d
        }
        return null
      })()
      if (!loan) { setSearchError('Loan not found.'); return }
      const loanNum = text(loan.accountNo) || `LN-${val}`
      const clientName = text(loan.clientName) || text(loan.clientDisplayName) || `Client #${text(loan.clientId)}`
      const product = text(loan.loanProductName) || '—'
      setResolvedLoanId(val)
      setResolvedLoanLabel(`${clientName} · ${loanNum} · ${product}`)
    } catch {
      setSearchError('Loan not found. Please check the loan ID.')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmitRepayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedLoanId) { setSubmitError('Please search and select a loan account.'); return }
    if (!amount || Number(amount) <= 0) { setSubmitError('Enter a valid repayment amount.'); return }
    if (!valueDate) { setSubmitError('Select a value date.'); return }
    setSubmitting(true)
    setSubmitError('')
    setSubmitMsg('')
    try {
      await loansAPI.makeRepayment(resolvedLoanId, {
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
        transactionDate: formatLoanDate(valueDate),
        transactionAmount: Number(amount),
        paymentTypeId: PAYMENT_METHODS.indexOf(paymentMethod) + 1,
        note: `Payment via ${paymentMethod}`,
      }, { _skipAuthRedirect: true })
      setSubmitMsg('Repayment posted successfully!')
      setAmount('')
      setValueDate(todayIso())
      loadRecent(resolvedLoanId)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string; responseMessage?: string; errors?: Array<{ developerMessage?: string }> } } }).response?.data
      const errText = msg?.errors?.[0]?.developerMessage ?? msg?.message ?? msg?.responseMessage ?? 'Failed to post repayment.'
      setSubmitError(errText)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '0px 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <LoanSubNav />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>LOAN MANAGEMENT</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Repayments
          </h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        <Panel>
          <PanelHead title="Record a Repayment" />
          <form onSubmit={handleSubmitRepayment} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Loan search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Loan Account <span style={{ color: T.red }}>*</span></label>
              <form onSubmit={handleLoanSearch} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Enter loan ID…"
                    value={loanIdInput}
                    onChange={e => { setLoanIdInput(e.target.value); setResolvedLoanId(null); setResolvedLoanLabel(''); setSearchError('') }}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 30px', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.ink, background: '#F9FAFB', border: `1px solid ${T.border}`, borderRadius: 9, outline: 'none' }}
                  />
                </div>
                <button type="submit" disabled={searching || !loanIdInput.trim()} style={{ padding: '9px 14px', borderRadius: 9, border: 'none', background: searching || !loanIdInput.trim() ? '#9CA3AF' : T.navy, color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: searching || !loanIdInput.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {searching ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 0.9s linear infinite' }} /> : <Search style={{ width: 13, height: 13 }} />}
                  Search
                </button>
              </form>
              {searchError && <p style={{ margin: 0, fontSize: 12, color: T.red, fontFamily: "'DM Sans',sans-serif" }}>{searchError}</p>}
              {resolvedLoanLabel && (
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 13, color: T.ink, background: '#F0FDF4', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                  ✓ {resolvedLoanLabel}
                </div>
              )}
            </div>

            {/* Amount & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Amount (GH₵) <span style={{ color: T.red }}>*</span></label>
                <input
                  type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans',sans-serif", outline: 'none', background: '#F9FAFB' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Value date <span style={{ color: T.red }}>*</span></label>
                <input
                  type="date" value={valueDate} onChange={e => setValueDate(e.target.value)}
                  style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans',sans-serif", outline: 'none', background: '#F9FAFB' }}
                />
              </div>
            </div>

            {/* Payment method */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#41506E', fontFamily: "'DM Sans',sans-serif" }}>Payment method</label>
              <div style={{ display: 'flex', gap: 7 }}>
                {PAYMENT_METHODS.map(m => (
                  <div key={m} onClick={() => setPaymentMethod(m)} style={{ flex: 1, border: `1px solid ${paymentMethod === m ? T.navy : T.border}`, borderRadius: 9, padding: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: paymentMethod === m ? T.navy : '#41506E', background: paymentMethod === m ? '#F4F6FB' : T.cardBg, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{m}</div>
                ))}
              </div>
            </div>

            {submitError && <p style={{ margin: 0, fontSize: 12, color: T.red, fontFamily: "'DM Sans',sans-serif" }}>{submitError}</p>}
            {submitMsg  && <p style={{ margin: 0, fontSize: 12, color: T.green, fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>{submitMsg}</p>}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <button
              type="submit"
              disabled={submitting || !resolvedLoanId}
              style={{ width: '100%', padding: '11px', background: submitting || !resolvedLoanId ? '#9CA3AF' : T.navy, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: submitting || !resolvedLoanId ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif" }}
            >
              {submitting ? 'Posting…' : 'Post Repayment'}
            </button>
          </form>
        </Panel>

        <Panel>
          <PanelHead title="Recent Repayments" action={<button style={{ background: 'none', border: 'none', color: T.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>View all →</button>} />
          {recentLoading ? (
            <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: T.muted, fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
              {resolvedLoanId ? 'No repayments found for this loan.' : 'Search for a loan to see its repayments.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={`${r.id}-${i}`}>
                    <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Ava initials={r.initials} color={r.color} /><div><div style={{ fontWeight: 700, fontSize: 13 }}>{r.clientName}</div><div style={{ fontSize: 11, color: T.muted }}>{r.method} · {r.date}</div></div></div></td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  )
}
