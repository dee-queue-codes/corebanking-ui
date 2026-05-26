import { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { T } from './loanShared'
import { LoanSubNav } from './LoanSubNav'
import { productsAPI, type LoanProduct } from '@/services/products/productsAPI'

function extractProductData<R>(response: unknown): R[] {
  if (response && typeof response === 'object' && Array.isArray((response as Record<string, unknown>).data)) {
    return (response as Record<string, unknown>).data as R[]
  }
  return Array.isArray(response) ? response as R[] : []
}

function getApiError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return fallback
  const r = data as Record<string, unknown>
  const msg = String(r.responseMessage ?? r.message ?? '')
  const nested = r.error
  if (nested && typeof nested === 'object') {
    const details = (nested as Record<string, unknown>).details
    if (details && typeof details === 'object') {
      const text = Object.entries(details as Record<string, unknown>)
        .map(([f, v]) => `${f}: ${String(v)}`).join(', ')
      if (text) return `${msg || 'Validation failed'}: ${text}`
    }
    const nm = (nested as Record<string, unknown>).message
    if (typeof nm === 'string') return nm
  }
  return msg || fallback
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function addMonthsIso(months: number, from = todayIso()): string {
  const d = new Date(from)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

const emptyForm = () => ({
  name: '',
  shortName: '',
  currency: 'GHS',
  principal: '1000',
  numberOfRepayments: '6',
  annualInterestRate: '10',
  startDate: todayIso(),
  closeDate: addMonthsIso(6),
})

function validateForm(form: ReturnType<typeof emptyForm>): string | null {
  if (!form.name.trim()) return 'Product name is required.'
  if (!form.shortName.trim()) return 'Short name is required.'
  if (!form.currency.trim()) return 'Currency is required.'
  if (!form.startDate) return 'Start date is required.'
  if (!form.closeDate) return 'Close date is required.'
  if (new Date(form.closeDate) <= new Date(form.startDate)) return 'Close date must be after start date.'
  if (!Number(form.principal) || Number(form.principal) <= 0) return 'Principal must be greater than zero.'
  if (!Number.isInteger(Number(form.numberOfRepayments)) || Number(form.numberOfRepayments) <= 0)
    return 'Number of repayments must be a whole number greater than zero.'
  if (Number.isNaN(Number(form.annualInterestRate)) || Number(form.annualInterestRate) < 0)
    return 'Annual interest rate must be zero or greater.'
  return null
}

function buildPayload(form: ReturnType<typeof emptyForm>) {
  const rate = Number(form.annualInterestRate)
  const fmtDate = (iso: string) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  return {
    name: form.name.trim(),
    shortName: form.shortName.trim(),
    currencyCode: form.currency.trim().toUpperCase(),
    digitsAfterDecimal: 2,
    inMultiplesOf: 0,
    principal: Number(form.principal),
    minPrincipal: Number(form.principal),
    maxPrincipal: Number(form.principal),
    numberOfRepayments: Number(form.numberOfRepayments),
    minNumberOfRepayments: 1,
    maxNumberOfRepayments: Number(form.numberOfRepayments),
    repaymentEvery: 1,
    repaymentFrequencyType: 2,
    interestRatePerPeriod: rate,
    minInterestRatePerPeriod: 0,
    maxInterestRatePerPeriod: rate,
    interestRateFrequencyType: 2,
    amortizationType: 1,
    interestType: 0,
    interestCalculationPeriodType: 1,
    transactionProcessingStrategyCode: 'mifos-standard-strategy',
    daysInMonthType: 1,
    daysInYearType: 365,
    isInterestRecalculationEnabled: false,
    accountingRule: 1,
    includeInBorrowerCycle: false,
    startDate: fmtDate(form.startDate),
    closeDate: fmtDate(form.closeDate),
    locale: 'en',
    dateFormat: 'dd MMMM yyyy',
  }
}

export default function LoanProductsPage() {
  const [products, setProducts]           = useState<LoanProduct[]>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  // Create
  const [showCreate, setShowCreate]       = useState(false)
  const [createForm, setCreateForm]       = useState(emptyForm())
  const [createSaving, setCreateSaving]   = useState(false)
  const [createError, setCreateError]     = useState('')

  // Edit
  const [editProduct, setEditProduct]     = useState<LoanProduct | null>(null)
  const [editForm, setEditForm]           = useState(emptyForm())
  const [editSaving, setEditSaving]       = useState(false)
  const [editError, setEditError]         = useState('')

  // Delete
  const [deleteProduct, setDeleteProduct] = useState<LoanProduct | null>(null)
  const [deleting, setDeleting]           = useState(false)
  const [deleteError, setDeleteError]     = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    return productsAPI
      .getLoans()
      .then(res => setProducts(extractProductData<LoanProduct>(res.data)))
      .catch(() => setError('Could not load loan products.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Auto-calc close date
  useEffect(() => {
    const r = Number(createForm.numberOfRepayments)
    if (!createForm.startDate || !Number.isInteger(r) || r <= 0) return
    const calc = addMonthsIso(r, createForm.startDate)
    if (createForm.closeDate !== calc) setCreateForm(p => ({ ...p, closeDate: calc }))
  }, [createForm.startDate, createForm.numberOfRepayments, createForm.closeDate])

  useEffect(() => {
    const r = Number(editForm.numberOfRepayments)
    if (!editForm.startDate || !Number.isInteger(r) || r <= 0) return
    const calc = addMonthsIso(r, editForm.startDate)
    if (editForm.closeDate !== calc) setEditForm(p => ({ ...p, closeDate: calc }))
  }, [editForm.startDate, editForm.numberOfRepayments, editForm.closeDate])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    const err = validateForm(createForm)
    if (err) { setCreateError(err); return }
    setCreateSaving(true)
    try {
      await productsAPI.createLoan(buildPayload(createForm))
      setShowCreate(false)
      setCreateForm(emptyForm())
      await load()
    } catch (err) {
      setCreateError(getApiError(err, 'Could not create loan product.'))
    } finally {
      setCreateSaving(false)
    }
  }

  const openEdit = (p: LoanProduct) => {
    setEditProduct(p)
    setEditError('')
    setEditForm({
      name: p.name,
      shortName: p.shortName ?? '',
      currency: p.currency ?? 'GHS',
      principal: String(p.principal ?? p.minPrincipal ?? 1000),
      numberOfRepayments: String(p.numberOfRepayments ?? 6),
      annualInterestRate: String(p.annualInterestRate ?? p.interestRate ?? 10),
      startDate: p.startDate ?? todayIso(),
      closeDate: p.closeDate ?? addMonthsIso(6),
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProduct) return
    setEditError('')
    const err = validateForm(editForm)
    if (err) { setEditError(err); return }
    setEditSaving(true)
    try {
      await productsAPI.updateLoan(editProduct.id, buildPayload(editForm))
      setEditProduct(null)
      await load()
    } catch (err) {
      setEditError(getApiError(err, 'Could not update loan product.'))
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteProduct) return
    setDeleting(true)
    setDeleteError('')
    try {
      await productsAPI.deleteLoan(deleteProduct.id)
      setDeleteProduct(null)
      await load()
    } catch (err) {
      setDeleteError(getApiError(err, 'Could not delete loan product.'))
    } finally {
      setDeleting(false)
    }
  }

  const renderFormFields = (
    form: ReturnType<typeof emptyForm>,
    setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>,
    formError: string,
    saving: boolean,
    onSubmit: (e: React.FormEvent) => void,
    onCancel: () => void,
    submitLabel: string,
  ) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="mb-1.5 block text-sm text-gray-700">Product Name <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="SME Working Capital" className="bg-gray-50 border-gray-300" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-gray-700">Short Name <span className="text-red-500">*</span></Label>
          <Input value={form.shortName} onChange={e => setForm(p => ({ ...p, shortName: e.target.value }))} placeholder="SME" className="bg-gray-50 border-gray-300" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-gray-700">Currency <span className="text-red-500">*</span></Label>
          <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
            <SelectTrigger className="bg-gray-50 border-gray-300"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GHS">GHS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-gray-700">Principal <span className="text-red-500">*</span></Label>
          <Input type="number" min="0.01" step="0.01" value={form.principal} onChange={e => setForm(p => ({ ...p, principal: e.target.value }))} className="bg-gray-50 border-gray-300" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-gray-700">Repayments <span className="text-red-500">*</span></Label>
          <Input type="number" min="1" step="1" value={form.numberOfRepayments} onChange={e => setForm(p => ({ ...p, numberOfRepayments: e.target.value }))} className="bg-gray-50 border-gray-300" />
        </div>
        <div className="col-span-2">
          <Label className="mb-1.5 block text-sm text-gray-700">Annual Interest Rate (%) <span className="text-red-500">*</span></Label>
          <Input type="number" min="0" step="0.01" value={form.annualInterestRate} onChange={e => setForm(p => ({ ...p, annualInterestRate: e.target.value }))} className="bg-gray-50 border-gray-300" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-gray-700">Start Date <span className="text-red-500">*</span></Label>
          <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="bg-gray-50 border-gray-300" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm text-gray-700">Close Date</Label>
          <Input type="date" value={form.closeDate} readOnly className="bg-gray-100 border-gray-300 text-gray-500" />
          <p className="mt-1 text-[11px] text-gray-400">Auto-calculated from start date + repayments.</p>
        </div>
      </div>
      {formError && <p className="text-sm text-red-600">{formError}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="submit" className="text-white" style={{ background: T.navy }} disabled={saving}>
          {saving ? 'Saving...' : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div style={{ padding: '0 28px', minHeight: '100%', background: T.pageBg, fontFamily: "'DM Sans', sans-serif" }}>
      <LoanSubNav />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>
          LOAN MANAGEMENT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, fontFamily: "'Sora', sans-serif", letterSpacing: '-0.02em' }}>
            Loan Products
          </h1>
          <Button
            style={{ background: T.navy, fontSize: 13, color: '#fff' }}
            onClick={() => { setCreateForm(emptyForm()); setCreateError(''); setShowCreate(true) }}
          >
            <Plus style={{ width: 14, height: 14 }} /> New Product
          </Button>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '48px 0', color: T.muted, fontSize: 13 }}>
          <RefreshCw style={{ width: 14, height: 14, animation: 'spin 0.9s linear infinite' }} />
          Loading loan products...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <p style={{ color: T.red, fontSize: 13, padding: '48px 0' }}>{error}</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: T.muted, fontSize: 13 }}>
          No loan products found.{' '}
          <button
            onClick={() => { setCreateForm(emptyForm()); setCreateError(''); setShowCreate(true) }}
            style={{ color: T.blue, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Create one
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {products.map(p => {
            const isActive = !p.status || p.status.toLowerCase().includes('active')
            return (
            <div
              key={p.id}
              style={{
                background: T.cardBg, border: `1px solid ${T.border}`, borderRadius: 16,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 2px 8px rgba(16,33,73,.06)',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,33,73,.10)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,33,73,.06)')}
            >
              {/* Card header */}
              <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, fontFamily: "'Sora', sans-serif", marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>
                      {p.shortName ?? '-'} · {p.currency}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{
                      flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: T.greenBg, color: T.green,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
                      Active
                    </div>
                  )}
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', flex: 1 }}>
                {[
                  ['Interest',   `${p.annualInterestRate ?? p.interestRate ?? 0}% p.a.`],
                  ['Repayments', String(p.numberOfRepayments ?? '—')],
                  ['Principal',  `${p.currency} ${(p.principal ?? p.minPrincipal ?? 0).toLocaleString()}`],
                  ['Description', p.description || '—'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
                borderTop: `1px solid ${T.border}`, padding: '10px 16px',
                background: '#FAFBFD',
              }}>
                <button
                  onClick={() => openEdit(p)}
                  style={{ padding: '5px 14px', borderRadius: 7, border: `1px solid ${T.border}`, background: '#fff', color: T.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => { setDeleteProduct(p); setDeleteError('') }}
                  style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #FECACA', background: '#FEF2F2', color: T.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                >
                  Delete
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); if (!open) { setCreateForm(emptyForm()); setCreateError('') } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Loan Product</DialogTitle>
            <DialogDescription>Set the core loan product terms.</DialogDescription>
          </DialogHeader>
          {renderFormFields(createForm, setCreateForm, createError, createSaving, handleCreate, () => setShowCreate(false), 'Create Product')}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editProduct !== null} onOpenChange={open => { if (!open) { setEditProduct(null); setEditError('') } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Loan Product</DialogTitle>
            <DialogDescription>Update the loan product details.</DialogDescription>
          </DialogHeader>
          {renderFormFields(editForm, setEditForm, editError, editSaving, handleEdit, () => { setEditProduct(null); setEditError('') }, 'Save Changes')}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteProduct !== null} onOpenChange={open => { if (!open) { setDeleteProduct(null); setDeleteError('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Loan Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteProduct?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProduct(null)} disabled={deleting}>Cancel</Button>
            <Button onClick={handleDelete} disabled={deleting} className="text-white bg-red-600 hover:bg-red-700">
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
