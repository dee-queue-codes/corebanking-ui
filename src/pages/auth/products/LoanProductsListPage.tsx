import { useState, useRef, useEffect } from 'react'
import { Plus, DollarSign, Search, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BackButton } from '@/components/ui/back-button'
import { ROUTES } from '@/router/routes'
import { productsAPI, type LoanProduct } from '@/services/products/productsAPI'

function extractProductData<T>(response: unknown): T[] {
  if (response && typeof response === 'object' && Array.isArray((response as Record<string, unknown>).data)) {
    return (response as Record<string, unknown>).data as T[]
  }
  return Array.isArray(response) ? response as T[] : []
}

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

function addMonthsIsoDate(months: number, startDate = todayIsoDate()): string {
  const date = new Date(startDate)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().split('T')[0]
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return fallback

  const record = data as Record<string, unknown>
  const message = String(record.responseMessage ?? record.message ?? '')
  const nestedError = record.error
  if (nestedError && typeof nestedError === 'object') {
    const details = (nestedError as Record<string, unknown>).details
    if (details && typeof details === 'object') {
      const detailText = Object.entries(details as Record<string, unknown>)
        .map(([field, value]) => `${field}: ${String(value)}`)
        .join(', ')
      if (detailText) return `${message || 'Validation failed'}: ${detailText}`
    }
    const nestedMessage = (nestedError as Record<string, unknown>).message
    if (typeof nestedMessage === 'string') return nestedMessage
  }
  return message || fallback
}

export default function LoanProductsListPage() {
  const navigate = useNavigate()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<LoanProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    shortName: '',
    currency: 'USD',
    principal: '1000',
    numberOfRepayments: '6',
    annualInterestRate: '10',
    startDate: todayIsoDate(),
    closeDate: addMonthsIsoDate(6),
  })
  const [createSaving, setCreateSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const repayments = Number(createForm.numberOfRepayments)
    if (!createForm.startDate || !Number.isInteger(repayments) || repayments <= 0) return
    const calculatedCloseDate = addMonthsIsoDate(repayments, createForm.startDate)
    if (createForm.closeDate !== calculatedCloseDate) {
      setCreateForm(p => ({ ...p, closeDate: calculatedCloseDate }))
    }
  }, [createForm.startDate, createForm.numberOfRepayments, createForm.closeDate])

  const loadLoanProducts = () => {
    setLoading(true)
    setError('')
    return productsAPI
      .getLoans()
      .then(res => setProducts(extractProductData<LoanProduct>(res.data)))
      .catch(() => setError('Could not load loan products.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLoanProducts()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openMenuId) {
        const ref = menuRefs.current[openMenuId]
        if (ref && !ref.contains(e.target as Node)) setOpenMenuId(null)
      }
    }
    if (openMenuId) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      shortName: '',
      currency: 'USD',
      principal: '1000',
      numberOfRepayments: '6',
      annualInterestRate: '10',
      startDate: todayIsoDate(),
      closeDate: addMonthsIsoDate(6),
    })
    setCreateError('')
  }

  const openCreateDialog = () => {
    resetCreateForm()
    setShowCreateDialog(true)
  }

  const handleCreateLoanProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    const principal = Number(createForm.principal)
    const numberOfRepayments = Number(createForm.numberOfRepayments)
    const annualInterestRate = Number(createForm.annualInterestRate)

    if (!createForm.name.trim()) {
      setCreateError('Product name is required.')
      return
    }
    if (!createForm.shortName.trim()) {
      setCreateError('Short name is required.')
      return
    }
    if (!createForm.currency.trim()) {
      setCreateError('Currency is required.')
      return
    }
    if (!createForm.startDate) {
      setCreateError('Start date is required.')
      return
    }
    if (!createForm.closeDate) {
      setCreateError('Close date is required.')
      return
    }
    if (new Date(createForm.closeDate) <= new Date(createForm.startDate)) {
      setCreateError('Close date must be after start date.')
      return
    }
    if (!principal || principal <= 0) {
      setCreateError('Principal must be greater than zero.')
      return
    }
    if (!Number.isInteger(numberOfRepayments) || numberOfRepayments <= 0) {
      setCreateError('Number of repayments must be a whole number greater than zero.')
      return
    }
    if (Number.isNaN(annualInterestRate) || annualInterestRate < 0) {
      setCreateError('Annual interest rate must be zero or greater.')
      return
    }

    setCreateSaving(true)
    try {
      await productsAPI.createLoan({
        name: createForm.name.trim(),
        shortName: createForm.shortName.trim(),
        currencyCode: createForm.currency.trim().toUpperCase(),
        currency: createForm.currency.trim().toUpperCase(),
        principal,
        numberOfRepayments,
        annualInterestRate,
        startDate: createForm.startDate,
        closeDate: createForm.closeDate,
        repaymentEvery: 1,
        repaymentFrequencyType: 2,
        interestRatePerPeriod: annualInterestRate,
        interestRateFrequencyType: 3,
        amortizationType: 1,
        interestType: 0,
        interestCalculationPeriodType: 1,
        accountingRule: 1,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
      })
      setShowCreateDialog(false)
      resetCreateForm()
      await loadLoanProducts()
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Could not create loan product.'))
    } finally {
      setCreateSaving(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <BackButton onClick={() => navigate(ROUTES.PRODUCTS.LIST)} label="Back to Products" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-gray-900 font-semibold text-xl mb-1">Loan Products</h1>
          <p className="text-xs text-gray-500">Manage loan products and configurations</p>
        </div>
        <Button className="text-xs text-white" style={{ backgroundColor: '#002663' }} onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />Create Loan Product
        </Button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder="Search loan products..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading loan products...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(product => (
            <Card
              key={product.id}
              className="p-5 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <span className="text-xs text-gray-400">({product.shortName || '-'})</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{product.description || 'Loan product'}</p>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-gray-500">Currency: <span className="text-gray-900">{product.currency}</span></span>
                      <span className="text-gray-500">Principal: <span className="text-gray-900">{product.currency} {product.principal ?? product.minPrincipal ?? 0}</span></span>
                      <span className="text-gray-500">Repayments: <span className="text-gray-900">{product.numberOfRepayments ?? '-'}</span></span>
                      <span className="text-gray-500">Interest: <span className="text-gray-900">{product.annualInterestRate ?? product.interestRate ?? 0}%</span></span>
                      <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">{product.status?.includes('active') ? 'Active' : product.status || 'Active'}</span>
                    </div>
                  </div>
                </div>
                <div className="relative" ref={el => { menuRefs.current[String(product.id)] = el }}>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={e => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === String(product.id) ? null : String(product.id))
                    }}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  {openMenuId === String(product.id) && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedProduct(product)
                          setOpenMenuId(null)
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />View
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={e => { e.stopPropagation(); setOpenMenuId(null) }}><Edit className="w-3.5 h-3.5" />Edit</button>
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={e => { e.stopPropagation(); setOpenMenuId(null) }}><Trash2 className="w-3.5 h-3.5" />Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No loan products yet</h3>
          <p className="text-xs text-gray-500 mb-4">Get started by creating your first loan product</p>
          <Button className="text-white text-xs" style={{ backgroundColor: '#002663' }} onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />Create Loan Product
          </Button>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={open => {
        setShowCreateDialog(open)
        if (!open) resetCreateForm()
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Loan Product</DialogTitle>
            <DialogDescription>Set the core loan product terms. Remaining product settings use backend defaults.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLoanProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="loanName" className="mb-1.5 block text-sm text-gray-700">Product Name <span className="text-red-500">*</span></Label>
                <Input
                  id="loanName"
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="6 Month Progressive Loan"
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="loanShortName" className="mb-1.5 block text-sm text-gray-700">Short Name <span className="text-red-500">*</span></Label>
                <Input
                  id="loanShortName"
                  value={createForm.shortName}
                  onChange={e => setCreateForm(p => ({ ...p, shortName: e.target.value }))}
                  placeholder="6MPL"
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="loanCurrency" className="mb-1.5 block text-sm text-gray-700">Currency <span className="text-red-500">*</span></Label>
                <Select
                  value={createForm.currency}
                  onValueChange={value => setCreateForm(p => ({ ...p, currency: value }))}
                >
                  <SelectTrigger id="loanCurrency" className="bg-gray-50 border-gray-300">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GHS">GHS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="loanPrincipal" className="mb-1.5 block text-sm text-gray-700">Principal <span className="text-red-500">*</span></Label>
                <Input
                  id="loanPrincipal"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={createForm.principal}
                  onChange={e => setCreateForm(p => ({ ...p, principal: e.target.value }))}
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="loanRepayments" className="mb-1.5 block text-sm text-gray-700">Repayments <span className="text-red-500">*</span></Label>
                <Input
                  id="loanRepayments"
                  type="number"
                  min="1"
                  step="1"
                  value={createForm.numberOfRepayments}
                  onChange={e => setCreateForm(p => ({ ...p, numberOfRepayments: e.target.value }))}
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="loanInterest" className="mb-1.5 block text-sm text-gray-700">Annual Interest Rate <span className="text-red-500">*</span></Label>
                <Input
                  id="loanInterest"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.annualInterestRate}
                  onChange={e => setCreateForm(p => ({ ...p, annualInterestRate: e.target.value }))}
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="loanStartDate" className="mb-1.5 block text-sm text-gray-700">Start Date <span className="text-red-500">*</span></Label>
                <Input
                  id="loanStartDate"
                  type="date"
                  value={createForm.startDate}
                  onChange={e => setCreateForm(p => ({ ...p, startDate: e.target.value }))}
                  className="bg-gray-50 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="loanCloseDate" className="mb-1.5 block text-sm text-gray-700">Close Date</Label>
                <Input
                  id="loanCloseDate"
                  type="date"
                  value={createForm.closeDate}
                  readOnly
                  className="bg-gray-100 border-gray-300 text-gray-700"
                />
                <p className="mt-1 text-[11px] text-gray-500">Calculated from start date and repayments.</p>
              </div>
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} disabled={createSaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: '#002663' }} disabled={createSaving}>
                {createSaving ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedProduct !== null} onOpenChange={open => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          {selectedProduct && (
            <>
              <div className="border-b border-gray-200 bg-[#F5F8FE] px-6 py-5">
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-base text-gray-950">{selectedProduct.name}</DialogTitle>
                      <DialogDescription className="mt-1">
                        {selectedProduct.shortName || 'Loan product'} · {selectedProduct.currency}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>
              <div className="px-6 py-5">
                <div className="mb-5 flex items-end justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Principal</p>
                    <p className="mt-1 font-sora text-2xl font-semibold text-blue-700">
                      {selectedProduct.currency} {selectedProduct.principal ?? selectedProduct.minPrincipal ?? 0}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                    {selectedProduct.numberOfRepayments ?? 0} repayments
                  </span>
                </div>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {[
                    ['Short Name', selectedProduct.shortName || '-'],
                    ['Currency', selectedProduct.currency],
                    ['Annual Interest Rate', `${selectedProduct.annualInterestRate ?? selectedProduct.interestRate ?? 0}%`],
                    ['Number of Repayments', selectedProduct.numberOfRepayments ?? '-'],
                    ['Status', selectedProduct.status?.includes('active') ? 'Active' : selectedProduct.status || '-'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                      <p className="text-sm font-semibold text-gray-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
