import { useState, useEffect } from 'react'
import { Search, RefreshCw, User } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { loansAPI } from '@/services/loans/loansAPI'
import { productsAPI, type LoanProduct } from '@/services/products/productsAPI'
import { clientsAPI } from '@/services/clients/clientsAPI'
import { T } from '@/pages/auth/loans/loanShared'

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

interface ClientResult { id: string; name: string }

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

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NewLoanApplicationDialog({ open, onOpenChange, onSuccess }: Props) {
  const [form, setForm]                     = useState(emptyForm())
  const [clientResults, setClientResults]   = useState<ClientResult[]>([])
  const [clientSearching, setClientSearching] = useState(false)
  const [loanProducts, setLoanProducts]     = useState<LoanProduct[]>([])
  const [saving, setSaving]                 = useState(false)
  const [formError, setFormError]           = useState('')
  const [formSuccess, setFormSuccess]       = useState('')

  useEffect(() => {
    if (!open) return
    productsAPI.getLoans()
      .then(res => {
        const data = res.data as unknown
        const items = data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).data)
          ? (data as Record<string, unknown>).data as LoanProduct[]
          : Array.isArray(data) ? data as LoanProduct[] : []
        setLoanProducts(items)
      })
      .catch(() => setLoanProducts([]))
  }, [open])

  const reset = () => {
    setForm(emptyForm())
    setClientResults([])
    setFormError('')
    setFormSuccess('')
  }

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
          const d = ((res.data as unknown as Record<string, unknown>).data ?? res.data) as Record<string, unknown>
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
      const items: Record<string, unknown>[] = (() => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[]
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>
          if (Array.isArray(r.content)) return r.content as Record<string, unknown>[]
          if (Array.isArray(r.data))    return r.data    as Record<string, unknown>[]
        }
        return []
      })()
      const getName = (c: Record<string, unknown>) => {
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
        onOpenChange(false)
        reset()
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setFormError(getApiError(err, 'Failed to submit loan application.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => { onOpenChange(open); if (!open) reset() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Sora', sans-serif" }}>New Loan Application</DialogTitle>
          <DialogDescription>Search for a client, select a product, and enter the loan details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
                {clientSearching
                  ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 0.9s linear infinite' }} />
                  : <Search style={{ width: 13, height: 13 }} />}
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
                    {p.name}{p.shortName ? ` (${p.shortName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block text-sm text-gray-700">Principal Amount <span className="text-red-500">*</span></Label>
              <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.principal}
                onChange={e => setForm(p => ({ ...p, principal: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm text-gray-700">No. of Repayments <span className="text-red-500">*</span></Label>
              <Input type="number" min="1" step="1" placeholder="12" value={form.numberOfRepayments}
                onChange={e => setForm(p => ({ ...p, numberOfRepayments: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm text-gray-700">Interest Rate (%)</Label>
              <Input type="number" min="0" step="0.01" placeholder="10" value={form.interestRatePerPeriod}
                onChange={e => setForm(p => ({ ...p, interestRatePerPeriod: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm text-gray-700">Submitted On <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.submittedOnDate}
                onChange={e => setForm(p => ({ ...p, submittedOnDate: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm text-gray-700">Expected Disbursement Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={form.expectedDisbursementDate}
              onChange={e => setForm(p => ({ ...p, expectedDisbursementDate: e.target.value }))} className="bg-gray-50 border-gray-300" />
          </div>

          {formError   && <p className="text-sm text-red-600">{formError}</p>}
          {formSuccess  && <p className="text-sm text-green-600">{formSuccess}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" className="text-white" style={{ background: T.navy }} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
