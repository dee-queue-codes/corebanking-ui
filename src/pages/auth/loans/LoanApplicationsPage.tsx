import { useState, useEffect } from 'react'
import { ChevronDown, LayoutGrid, List, Plus, Search, RefreshCw, User } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { T, Panel, Ava, thStyle, tdStyle } from './loanShared'
import { LoanSubNav } from './LoanSubNav'
import { loansAPI } from '@/services/loans/loansAPI'
import { productsAPI, type LoanProduct } from '@/services/products/productsAPI'
import { clientsAPI } from '@/services/clients/clientsAPI'

// ── Helpers ──────────────────────────────────────────────────────────────────

function text(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function getApiError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return fallback
  const r = data as Record<string, unknown>
  return String(r.responseMessage ?? r.message ?? fallback)
}

function formatLoanDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'NA'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const COLORS = ['#0A2F6D', '#B45309', '#059669', '#7C3AED', '#DC2626', '#0891B2', '#4F46E5']
function getColor(id: string | number): string {
  const num = typeof id === 'number' ? id : parseInt(String(id), 10) || 0
  return COLORS[Math.abs(num) % COLORS.length]
}

function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A'
  return `GH₵ ${amount.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatSubmittedDate(raw: unknown): string {
  if (!raw) return '—'
  if (Array.isArray(raw) && raw.length >= 3) {
    const [, m, d] = raw as number[]
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${d} ${months[m - 1]}`
  }
  if (typeof raw === 'string') {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  }
  return '—'
}

function getLoanStage(loan: Record<string, unknown>): string {
  const status = loan.status
  if (!status) return 'Submitted'
  if (typeof status === 'object' && status !== null) {
    const s = status as Record<string, unknown>
    const id = Number(s.id ?? 0)
    if (id === 500) return 'Rejected'
    if (id === 200) return 'Approved'
    if (id === 300) return 'To Disburse'
    const code = String(s.code ?? '').toLowerCase()
    if (code.includes('reject')) return 'Rejected'
    if (code.includes('active')) return 'To Disburse'
    if (code.includes('approved') && !code.includes('pending')) return 'Approved'
  }
  const s = String(status).toLowerCase()
  if (s.includes('reject')) return 'Rejected'
  if (s.includes('active')) return 'To Disburse'
  if (s.includes('approved')) return 'Approved'
  return 'Submitted'
}

function toLoanDisplay(loan: Record<string, unknown>) {
  const id = text(loan.accountNo) || text(loan.id)
  const clientName = text(loan.clientName) || text(loan.clientDisplayName) || `Client #${text(loan.clientId)}`
  const initials = getInitials(clientName)
  const color = getColor(loan.id as string | number ?? 0)
  const product = text(loan.loanProductName) || text(loan.productName) || '—'
  const amount = formatCurrency(Number(loan.principal ?? 0))
  const stage = getLoanStage(loan)
  const officer = text(loan.loanOfficerName) || '—'
  const timeline = loan.timeline as Record<string, unknown> | undefined
  const submitted = formatSubmittedDate(timeline?.submittedOnDate ?? loan.submittedOnDate)
  return { id, clientName, initials, color, product, amount, stage, officer, submitted }
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

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientResult {
  id: string
  name: string
}

const emptyForm = () => ({
  clientSearch: '',
  selectedClient: null as ClientResult | null,
  productId: '',
  principal: '',
  numberOfRepayments: '',
  interestRatePerPeriod: '',
  expectedDisbursementDate: todayIso(),
  submittedOnDate: todayIso(),
})

// ── Component ─────────────────────────────────────────────────────────────────

export default function LoanApplicationsPage() {
  const [view, setView] = useState<'board' | 'table'>('board')
  const stages = ['Submitted', 'Under Review', 'Approved', 'To Disburse', 'Rejected']
  const stageDots: Record<string, string> = {
    Submitted: T.muted, 'Under Review': T.blue, Approved: T.amber, 'To Disburse': T.green, Rejected: T.red,
  }

  // Real data state
  const [loans, setLoans] = useState<ReturnType<typeof toLoanDisplay>[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const loadLoans = () => {
    setLoading(true)
    setLoadError('')
    loansAPI.getApplications({}, { _skipAuthRedirect: true })
      .then(res => {
        const raw = extractLoans(res.data)
        setLoans(raw.map(toLoanDisplay))
      })
      .catch(() => setLoadError('Could not load loan applications.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadLoans() }, [])

  const grouped = stages.reduce<Record<string, typeof loans>>((acc, s) => {
    acc[s] = loans.filter(a => a.stage === s); return acc
  }, {})

  // New application dialog
  const [showDialog, setShowDialog]         = useState(false)
  const [form, setForm]                     = useState(emptyForm())
  const [clientResults, setClientResults]   = useState<ClientResult[]>([])
  const [clientSearching, setClientSearching] = useState(false)
  const [loanProducts, setLoanProducts]     = useState<LoanProduct[]>([])
  const [saving, setSaving]                 = useState(false)
  const [formError, setFormError]           = useState('')
  const [formSuccess, setFormSuccess]       = useState('')

  useEffect(() => {
    if (!showDialog) return
    productsAPI.getLoans()
      .then(res => {
        const data = res.data as unknown
        const items = data && typeof data === 'object' && Array.isArray((data as Record<string,unknown>).data)
          ? (data as Record<string,unknown>).data as LoanProduct[]
          : Array.isArray(data) ? data as LoanProduct[] : []
        setLoanProducts(items)
      })
      .catch(() => setLoanProducts([]))
  }, [showDialog])

  const handleClientSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = form.clientSearch.trim()
    if (!val) return
    setClientSearching(true)
    setClientResults([])
    setForm(p => ({ ...p, selectedClient: null }))
    try {
      if (/^\d+$/.test(val)) {
        try {
          const res = await clientsAPI.getById(val, { _skipAuthRedirect: true })
          const d = ((res.data as unknown as Record<string,unknown>).data ?? res.data) as Record<string,unknown>
          const id = text(d.id) || val
          const name = text(d.displayName) || text(d.name) ||
            [text(d.firstName), text(d.middleName), text(d.lastName)].filter(Boolean).join(' ') || id
          setForm(p => ({ ...p, selectedClient: { id, name } }))
          setClientSearching(false)
          return
        } catch { /* fall through */ }
      }
      const res = await clientsAPI.getAll({}, { _skipAuthRedirect: true })
      const raw = res.data as unknown
      const items: Record<string,unknown>[] = (() => {
        if (Array.isArray(raw)) return raw as Record<string,unknown>[]
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string,unknown>
          if (Array.isArray(r.content)) return r.content as Record<string,unknown>[]
          if (Array.isArray(r.data)) return r.data as Record<string,unknown>[]
        }
        return []
      })()
      const getName = (c: Record<string,unknown>) => {
        const display = text(c.displayName) || text(c.name)
        if (display) return display
        return [text(c.firstName), text(c.middleName), text(c.lastName)].filter(Boolean).join(' ') || text(c.id)
      }
      const matched = items
        .map(c => ({ id: text(c.id) || text(c.clientId), name: getName(c) }))
        .filter(c => c.id && c.name.toLowerCase().includes(val.toLowerCase()))
      setClientResults(matched.slice(0, 8))
      if (matched.length === 0) setFormError(`No clients found matching "${val}".`)
    } catch {
      setFormError('Client search failed.')
    } finally {
      setClientSearching(false)
    }
  }

  const selectedProduct = loanProducts.find(p => String(p.id) === form.productId) ?? null

  useEffect(() => {
    if (!selectedProduct) return
    setForm(p => ({
      ...p,
      principal: p.principal || String(selectedProduct.principal ?? selectedProduct.minPrincipal ?? ''),
      numberOfRepayments: p.numberOfRepayments || String(selectedProduct.numberOfRepayments ?? ''),
      interestRatePerPeriod: p.interestRatePerPeriod || String(selectedProduct.annualInterestRate ?? selectedProduct.interestRate ?? ''),
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.productId])

  const validate = () => {
    if (!form.selectedClient) return 'Please search and select a client.'
    if (!form.productId) return 'Please select a loan product.'
    if (!form.principal || Number(form.principal) <= 0) return 'Principal must be greater than zero.'
    if (!form.numberOfRepayments || !Number.isInteger(Number(form.numberOfRepayments)) || Number(form.numberOfRepayments) <= 0)
      return 'Number of repayments must be a whole number greater than zero.'
    if (!form.expectedDisbursementDate) return 'Expected disbursement date is required.'
    if (!form.submittedOnDate) return 'Submitted on date is required.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    try {
      await loansAPI.createApplication({
        clientId: form.selectedClient!.id,
        productId: Number(form.productId),
        principal: Number(form.principal),
        loanTermFrequency: Number(form.numberOfRepayments),
        loanTermFrequencyType: 2,
        numberOfRepayments: Number(form.numberOfRepayments),
        repaymentEvery: 1,
        repaymentFrequencyType: 2,
        interestRatePerPeriod: Number(form.interestRatePerPeriod) || (selectedProduct?.annualInterestRate ?? 0),
        amortizationType: 1,
        interestType: 0,
        interestCalculationPeriodType: 1,
        transactionProcessingStrategyCode: 'mifos-standard-strategy',
        expectedDisbursementDate: formatLoanDate(form.expectedDisbursementDate),
        submittedOnDate: formatLoanDate(form.submittedOnDate),
        locale: 'en',
        dateFormat: 'dd MMMM yyyy',
      }, { _skipAuthRedirect: true })
      setFormSuccess('Loan application submitted successfully.')
      setTimeout(() => {
        setShowDialog(false)
        setForm(emptyForm())
        setFormSuccess('')
        setClientResults([])
        loadLoans()
      }, 1500)
    } catch (err) {
      setFormError(getApiError(err, 'Failed to submit loan application.'))
    } finally {
      setSaving(false)
    }
  }

  const openDialog = () => {
    setForm(emptyForm())
    setClientResults([])
    setFormError('')
    setFormSuccess('')
    setShowDialog(true)
  }

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
          <Button style={{ background: T.navy, fontSize: 13, color: '#fff' }} onClick={openDialog}>
            <Plus style={{ width: 14, height: 14 }} /> New Application
          </Button>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Loading applications…</div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.red, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>{loadError}</div>
        ) : view === 'board' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, alignItems: 'start' }}>
            {stages.map(stage => (
              <div key={stage} style={{ background: '#F4F6FB', border: `1px solid #E9EDF5`, borderRadius: 13, padding: 11, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 3px 3px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: T.ink, fontFamily: "'DM Sans',sans-serif" }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: stageDots[stage], display: 'inline-block' }} />{stage}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.muted, background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 20, padding: '1px 7px', fontFamily: "'DM Sans',sans-serif" }}>{grouped[stage]?.length ?? 0}</span>
                </div>
                {(grouped[stage] ?? []).length === 0 ? (
                  <div style={{ padding: '20px 8px', textAlign: 'center', color: T.muted, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>No applications</div>
                ) : (grouped[stage] ?? []).map(app => (
                  <div key={app.id} style={{ background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 11, boxShadow: '0 1px 2px rgba(16,33,73,.04)' }}>
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
            {loans.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: T.muted, fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>No applications found.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Applicant', 'Product', 'Amount', 'Stage', 'Officer', 'Submitted'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {loans.map(a => (
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
            )}
          </Panel>
        )}
      </div>

      {/* ── New Application Dialog ──────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={open => { setShowDialog(open); if (!open) { setForm(emptyForm()); setClientResults([]) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Sora', sans-serif" }}>New Loan Application</DialogTitle>
            <DialogDescription>Search for a client, select a product, and enter the loan details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client search */}
            <div>
              <Label className="mb-1.5 block text-sm text-gray-700">Client <span className="text-red-500">*</span></Label>
              <form onSubmit={handleClientSearch} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Client name or ID…"
                    value={form.clientSearch}
                    onChange={e => { setForm(p => ({ ...p, clientSearch: e.target.value, selectedClient: null })); setClientResults([]) }}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 32px', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: T.ink, background: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: 8, outline: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = T.navy)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={clientSearching || !form.clientSearch.trim()}
                  style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: T.navy, color: '#fff', fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, cursor: clientSearching || !form.clientSearch.trim() ? 'not-allowed' : 'pointer', opacity: clientSearching || !form.clientSearch.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                  {clientSearching ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 0.9s linear infinite' }} /> : <Search style={{ width: 13, height: 13 }} />}
                  Search
                </button>
              </form>

              {clientResults.length > 0 && !form.selectedClient && (
                <div style={{ marginTop: 6, borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  {clientResults.map((c, i) => (
                    <button
                      key={c.id} type="button"
                      onClick={() => { setForm(p => ({ ...p, selectedClient: c, clientSearch: c.name })); setClientResults([]) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', background: 'transparent', borderBottom: i < clientResults.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User style={{ width: 13, height: 13, color: '#2563EB' }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name}</p>
                        <p style={{ margin: 0, fontFamily: 'DM Mono,monospace', fontSize: 11, color: T.muted }}>ID: {c.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {form.selectedClient && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User style={{ width: 14, height: 14, color: '#2563EB' }} />
                    <div>
                      <p style={{ margin: 0, fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.ink }}>{form.selectedClient.name}</p>
                      <p style={{ margin: 0, fontFamily: 'DM Mono,monospace', fontSize: 11, color: T.muted }}>ID: {form.selectedClient.id}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setForm(p => ({ ...p, selectedClient: null, clientSearch: '' }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16, lineHeight: 1, padding: 4 }}>×</button>
                </div>
              )}
            </div>

            {/* Loan product */}
            <div>
              <Label className="mb-1.5 block text-sm text-gray-700">Loan Product <span className="text-red-500">*</span></Label>
              <Select value={form.productId} onValueChange={v => setForm(p => ({ ...p, productId: v, principal: '', numberOfRepayments: '', interestRatePerPeriod: '' }))}>
                <SelectTrigger className="bg-gray-50 border-gray-300">
                  <SelectValue placeholder={loanProducts.length === 0 ? 'Loading products...' : 'Select loan product'} />
                </SelectTrigger>
                <SelectContent>
                  {loanProducts.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} {p.shortName ? `(${p.shortName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm text-gray-700">Principal Amount <span className="text-red-500">*</span></Label>
                <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.principal} onChange={e => setForm(p => ({ ...p, principal: e.target.value }))} className="bg-gray-50 border-gray-300" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm text-gray-700">No. of Repayments <span className="text-red-500">*</span></Label>
                <Input type="number" min="1" step="1" placeholder="12" value={form.numberOfRepayments} onChange={e => setForm(p => ({ ...p, numberOfRepayments: e.target.value }))} className="bg-gray-50 border-gray-300" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm text-gray-700">Interest Rate (%)</Label>
                <Input type="number" min="0" step="0.01" placeholder="10" value={form.interestRatePerPeriod} onChange={e => setForm(p => ({ ...p, interestRatePerPeriod: e.target.value }))} className="bg-gray-50 border-gray-300" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm text-gray-700">Submitted On <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.submittedOnDate} onChange={e => setForm(p => ({ ...p, submittedOnDate: e.target.value }))} className="bg-gray-50 border-gray-300" />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-sm text-gray-700">Expected Disbursement Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.expectedDisbursementDate} onChange={e => setForm(p => ({ ...p, expectedDisbursementDate: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>

            {formError   && <p className="text-sm text-red-600">{formError}</p>}
            {formSuccess  && <p className="text-sm text-green-600">{formSuccess}</p>}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ background: T.navy }} disabled={saving}>
                {saving ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
