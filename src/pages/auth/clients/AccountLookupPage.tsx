import { useState, useEffect } from 'react'
import { Search, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, RefreshCw, Wallet, TrendingUp, TrendingDown, Activity, Plus, User, ChevronDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { accountsAPI } from '@/services/clients/accountsAPI'
import { clientTransactionsAPI } from '@/services/clients/transactionsAPI'
import { clientsAPI } from '@/services/clients/clientsAPI'
import { productsAPI, type SavingsProduct } from '@/services/products/productsAPI'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  navy:      '#002663',
  navyDark:  '#001844',
  navyLight: '#1a4080',
  gold:      '#1565C0',
  bg:        '#EEF2F8',
  surface:   '#FFFFFF',
  border:    '#DDE4EF',
  text:      '#0D1B3E',
  textSub:   '#4A5878',
  textMuted: '#8A9ABB',
  success:   '#059669',
  successBg: '#ECFDF5',
  shadow:    '0 1px 4px rgba(0,38,99,0.08), 0 4px 16px rgba(0,38,99,0.06)',
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccountDetail {
  accountNo: string
  productName: string
  currency: string
  balance: number
  status: string
  activatedDate: string
  clientId: string
  clientName: string
}

interface TxRow {
  id: string
  date: string
  type: string
  entryType: string
  amount: number
  runningBalance: number
  status: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function text(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function nestedName(v: unknown): string {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object') return text((v as Record<string, unknown>).name)
  return ''
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  if (Array.isArray(value)) {
    const [y, m, d] = value as number[]
    if (y && m && d) return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  if (typeof value === 'string') {
    const p = new Date(value)
    if (!Number.isNaN(p.getTime())) return p.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    return value
  }
  return '—'
}

function unwrap(response: unknown): unknown {
  if (response && typeof response === 'object' && 'data' in response) return (response as Record<string, unknown>).data
  return response
}

function extractArray(response: unknown): unknown[] {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>
    if (Array.isArray(r.transactions)) return r.transactions
    if (Array.isArray(r.data)) return r.data
    if (Array.isArray(r.content)) return r.content
    if (r.data && typeof r.data === 'object') {
      const d = r.data as Record<string, unknown>
      if (Array.isArray(d.content)) return d.content
      if (Array.isArray(d.transactions)) return d.transactions
    }
  }
  return []
}

function mapAccount(raw: unknown): AccountDetail {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    accountNo:     text(a.accountNo) || text(a.accountNumber) || text(a.id),
    productName:   text(a.productName) || nestedName(a.product) || 'Savings',
    currency:      text(a.currency) || nestedName(a.currency) || 'GHS',
    balance:       Number(a.balance ?? a.accountBalance ?? a.availableBalance ?? 0),
    status:        text(a.status) || nestedName(a.status) || '—',
    activatedDate: formatDate(a.activatedDate ?? a.activatedOnDate ?? a.openedAt),
    clientId:      text(a.clientId) || text(a.client),
    clientName:    text(a.clientName) || nestedName(a.client) || '—',
  }
}

function mapTx(raw: unknown): TxRow {
  const tx = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    id:             text(tx.id) || String(Math.random()),
    date:           formatDate(tx.date ?? tx.createdAt),
    type:           text(tx.type) || '—',
    entryType:      text(tx.entryType) || '—',
    amount:         Number(tx.amount ?? 0),
    runningBalance: Number(tx.runningBalance ?? 0),
    status:         tx.reversed === true ? 'Reversed' : text(tx.status) || 'Completed',
  }
}

function getApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const d = (error as { response?: { data?: unknown } }).response?.data
    if (d && typeof d === 'object') {
      const r = d as Record<string, unknown>
      if (typeof r.responseMessage === 'string') return r.responseMessage
      if (typeof r.message === 'string') return r.message
    }
  }
  return fallback
}

function currentIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

function isPendingApprovalStatus(status: string): boolean {
  const normalized = status.toUpperCase()
  return normalized === 'PENDING' ||
    normalized === 'SUBMITTED' ||
    normalized.includes('PENDING APPROVAL') ||
    normalized.includes('SUBMITTED')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? ''
  const { bg, color, dot } = ((): { bg: string; color: string; dot: string } => {
    if (s === 'active' || s === 'approved')
      return { bg: T.successBg, color: T.success, dot: T.success }
    if (s === 'completed')
      return { bg: '#ECFDF5',  color: '#059669', dot: '#059669' }
    if (s === 'pending' || s === 'submitted')
      return { bg: '#FFFBEB',  color: '#B45309', dot: '#F59E0B' }
    if (s === 'failed')
      return { bg: '#FEF2F2',  color: '#DC2626', dot: '#EF4444' }
    if (s === 'reversed')
      return { bg: '#F1F5F9',  color: T.textSub, dot: T.textMuted }
    return   { bg: '#F1F5F9',  color: T.textSub, dot: T.textMuted }
  })()
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
      background: bg, color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      {status || '—'}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountLookupPage() {
  const [searchParams] = useSearchParams()
  const [inputValue, setInputValue]       = useState(searchParams.get('account') ?? '')
  const [searching, setSearching]         = useState(false)
  const [searchError, setSearchError]     = useState('')
  const [account, setAccount]             = useState<AccountDetail | null>(null)
  const [transactions, setTransactions]   = useState<TxRow[]>([])
  const [txLoading, setTxLoading]         = useState(false)
  const [txError, setTxError]             = useState('')
  const [entryFilter, setEntryFilter]     = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL')
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)

  const [showCreditDialog, setShowCreditDialog]     = useState(false)
  const [showDebitDialog, setShowDebitDialog]       = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [creditForm, setCreditForm]                 = useState({ accountNumber: '', transactionAmount: '', transactionDate: new Date().toISOString().split('T')[0], paymentTypeId: '', note: '' })
  const [debitForm, setDebitForm]                   = useState({ accountNumber: '', transactionAmount: '', transactionDate: new Date().toISOString().split('T')[0], paymentTypeId: '', note: '' })
  const [transferForm, setTransferForm]             = useState({ fromAccountNumber: '', toAccountNumber: '', transferAmount: '', transferDescription: '', referenceId: '' })
  const [creditSaving, setCreditSaving]             = useState(false)
  const [debitSaving, setDebitSaving]               = useState(false)
  const [transferSaving, setTransferSaving]         = useState(false)
  const [creditError, setCreditError]               = useState('')
  const [debitError, setDebitError]                 = useState('')
  const [transferError, setTransferError]           = useState('')
  const [accountActionError, setAccountActionError] = useState('')
  const [accountActionLoading, setAccountActionLoading] = useState(false)
  const [paymentTypes, setPaymentTypes]             = useState<Array<{ id: number; name: string }>>([])

  // Create account dialog
  const [showCreateDialog, setShowCreateDialog]       = useState(false)
  const [createSearch, setCreateSearch]               = useState('')
  const [createSearching, setCreateSearching]         = useState(false)
  const [createClientResults, setCreateClientResults] = useState<Array<{ id: string; name: string }>>([])
  const [createSelectedClient, setCreateSelectedClient] = useState<{ id: string; name: string } | null>(null)
  const [createForm, setCreateForm]                   = useState({ savingsProduct: '', submittedOnDate: new Date().toISOString().split('T')[0] })
  const [createSaving, setCreateSaving]               = useState(false)
  const [createError, setCreateError]                 = useState('')
  const [createSuccess, setCreateSuccess]             = useState('')
  const [savingsProducts, setSavingsProducts]         = useState<SavingsProduct[]>([])
  const [savingsProductsLoading, setSavingsProductsLoading] = useState(false)

  const skipAuth = { _skipAuthRedirect: true } as const

  useEffect(() => {
    const acc = searchParams.get('account')
    if (acc) doSearch(acc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSavingsProductsLoading(true)
    productsAPI
      .getSavings()
      .then(res => setSavingsProducts(extractArray(res.data) as SavingsProduct[]))
      .catch(() => setSavingsProducts([]))
      .finally(() => setSavingsProductsLoading(false))
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5173/api/v1'}/fineract/paymenttypes`, { headers })
      .then(r => r.json())
      .then((data: unknown) => {
        const raw = Array.isArray(data) ? data
          : data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).pageItems)
            ? (data as Record<string, unknown>).pageItems as unknown[]
            : data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).data)
              ? (data as Record<string, unknown>).data as unknown[]
              : []
        const mapped = (raw as Record<string, unknown>[])
          .map(pt => ({ id: Number(pt.id), name: String(pt.name ?? pt.value ?? pt.label ?? '') }))
          .filter(pt => pt.id && pt.name)
        setPaymentTypes(mapped)
        const moneyTransfer = mapped.find(pt => pt.name.toLowerCase().includes('money transfer'))
        if (moneyTransfer) {
          const id = String(moneyTransfer.id)
          setCreditForm(p => ({ ...p, paymentTypeId: id }))
          setDebitForm(p => ({ ...p, paymentTypeId: id }))
        }
      })
      .catch(() => { /* payment type select will remain empty */ })
  }, [])

  const doSearch = async (accountNumber: string) => {
    setSearching(true)
    setSearchError('')
    setAccount(null)
    setTransactions([])
    setTxError('')
    setAccountActionError('')
    setEntryFilter('ALL')

    try {
      const res = await accountsAPI.getByAccountNumber(accountNumber, skipAuth)
      const raw = unwrap(res.data)
      setAccount(mapAccount(raw))
    } catch (error) {
      setSearchError(getApiError(error, `No account found for "${accountNumber}".`))
      setSearching(false)
      return
    }

    setSearching(false)
    setTxLoading(true)
    try {
      const txRes = await clientTransactionsAPI.getByAccountNumber(accountNumber, skipAuth)
      setTransactions(extractArray(txRes.data).map(mapTx))
    } catch (error) {
      setTxError(getApiError(error, 'Could not load transactions for this account.'))
    } finally {
      setTxLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const val = inputValue.trim()
    if (val) doSearch(val)
  }

  const handleCreateClientSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const val = createSearch.trim()
    if (!val) return
    setCreateSearching(true)
    setCreateError('')
    setCreateClientResults([])
    setCreateSelectedClient(null)
    try {
      // If looks like a client ID, look up directly
      if (/^\d+$/.test(val)) {
        try {
          const res = await clientsAPI.getById(val, skipAuth)
          const raw = (res.data as Record<string, unknown>)
          const d = (raw.data ?? raw) as Record<string, unknown>
          const id = text(d.id) || text(d.clientId) || val
          const getName = () => {
            const display = text(d.displayName) || text(d.name)
            if (display) return display
            return [text(d.firstName), text(d.middleName), text(d.lastName)].filter(Boolean).join(' ') || id
          }
          setCreateSelectedClient({ id, name: getName() })
          setCreateSearching(false)
          return
        } catch { /* fall through to name search */ }
      }
      // Fetch all clients, filter client-side (same as ClientsPage)
      const res = await clientsAPI.getAll({}, skipAuth)
      const raw = res.data as unknown
      const items: Record<string, unknown>[] = (() => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[]
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>
          if (Array.isArray(r.content))   return r.content   as Record<string, unknown>[]
          if (Array.isArray(r.data))       return r.data       as Record<string, unknown>[]
          if (r.data && typeof r.data === 'object') {
            const d = r.data as Record<string, unknown>
            if (Array.isArray(d.content)) return d.content   as Record<string, unknown>[]
          }
        }
        return []
      })()

      const getName = (c: Record<string, unknown>) => {
        const display = text(c.displayName) || text(c.name)
        if (display) return display
        const first  = text(c.firstName)  || text(c.firstname)  || ''
        const middle = text(c.middleName) || text(c.middlename) || ''
        const last   = text(c.lastName)   || text(c.lastname)   || ''
        return [first, middle, last].filter(Boolean).join(' ') || text(c.id)
      }

      const matched = items
        .map(c => ({ id: text(c.id) || text(c.clientId), name: getName(c) }))
        .filter(c => c.id && c.name.toLowerCase().includes(val.toLowerCase()))

      if (matched.length === 0) {
        setCreateError(`No clients found matching "${createSearch.trim()}".`)
      } else {
        setCreateClientResults(matched)
      }
    } catch (error) {
      setCreateError(getApiError(error, 'Search failed. Please try again.'))
    } finally {
      setCreateSearching(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    if (!createSelectedClient) { setCreateError('Please search and select a client first.'); return }
    if (!createForm.savingsProduct) { setCreateError('Savings product is required.'); return }
    setCreateSaving(true)
    try {
      await accountsAPI.create({
        clientId: createSelectedClient.id,
        savingsProduct: createForm.savingsProduct,
        submittedOnDate: createForm.submittedOnDate,
      }, skipAuth)
      setCreateSuccess('Account created successfully.')
      setTimeout(() => {
        setShowCreateDialog(false)
        setCreateSearch('')
        setCreateClientResults([])
        setCreateSelectedClient(null)
        setCreateForm({ savingsProduct: '', submittedOnDate: new Date().toISOString().split('T')[0] })
        setCreateSuccess('')
      }, 1500)
    } catch {
      setCreateError('Failed to create account. Please try again.')
    } finally {
      setCreateSaving(false)
    }
  }

  const defaultPaymentTypeId = () => {
    const moneyTransfer = paymentTypes.find(pt => pt.name.toLowerCase().includes('money transfer'))
    return moneyTransfer ? String(moneyTransfer.id) : paymentTypes[0] ? String(paymentTypes[0].id) : ''
  }

  const openCreditDialog = () => {
    if (!account) return
    setCreditError('')
    setCreditForm({
      accountNumber: account.accountNo,
      transactionAmount: '',
      transactionDate: new Date().toISOString().split('T')[0],
      paymentTypeId: creditForm.paymentTypeId || defaultPaymentTypeId(),
      note: '',
    })
    setShowCreditDialog(true)
  }

  const openDebitDialog = () => {
    if (!account) return
    setDebitError('')
    setDebitForm({
      accountNumber: account.accountNo,
      transactionAmount: '',
      transactionDate: new Date().toISOString().split('T')[0],
      paymentTypeId: debitForm.paymentTypeId || defaultPaymentTypeId(),
      note: '',
    })
    setShowDebitDialog(true)
  }

  const openTransferDialog = () => {
    if (!account) return
    setTransferError('')
    setTransferForm({
      fromAccountNumber: account.accountNo,
      toAccountNumber: '',
      transferAmount: '',
      transferDescription: '',
      referenceId: '',
    })
    setShowTransferDialog(true)
  }

  const handleCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreditError('')
    if (!creditForm.transactionAmount || isNaN(Number(creditForm.transactionAmount)) || Number(creditForm.transactionAmount) <= 0) {
      setCreditError('A valid amount is required.')
      return
    }
    if (!creditForm.transactionDate) {
      setCreditError('Transaction date is required.')
      return
    }
    if (!creditForm.paymentTypeId || isNaN(Number(creditForm.paymentTypeId))) {
      setCreditError('A valid payment type is required.')
      return
    }

    setCreditSaving(true)
    try {
      await clientTransactionsAPI.deposit(creditForm.accountNumber, {
        transactionAmount: Number(creditForm.transactionAmount),
        transactionDate: creditForm.transactionDate,
        paymentTypeId: Number(creditForm.paymentTypeId),
        note: creditForm.note.trim(),
        accountNumber: creditForm.accountNumber,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
      }, skipAuth)
      setShowCreditDialog(false)
      await doSearch(creditForm.accountNumber)
    } catch (error) {
      setCreditError(getApiError(error, 'Failed to process credit. Please try again.'))
    } finally {
      setCreditSaving(false)
    }
  }

  const handleDebit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDebitError('')
    if (!debitForm.transactionAmount || isNaN(Number(debitForm.transactionAmount)) || Number(debitForm.transactionAmount) <= 0) {
      setDebitError('A valid amount is required.')
      return
    }
    if (!debitForm.transactionDate) {
      setDebitError('Transaction date is required.')
      return
    }
    if (!debitForm.paymentTypeId || isNaN(Number(debitForm.paymentTypeId))) {
      setDebitError('A valid payment type is required.')
      return
    }

    setDebitSaving(true)
    try {
      await clientTransactionsAPI.withdraw(debitForm.accountNumber, {
        transactionAmount: Number(debitForm.transactionAmount),
        transactionDate: debitForm.transactionDate,
        paymentTypeId: Number(debitForm.paymentTypeId),
        note: debitForm.note.trim(),
        accountNumber: debitForm.accountNumber,
        locale: 'en',
        dateFormat: 'yyyy-MM-dd',
      }, skipAuth)
      setShowDebitDialog(false)
      await doSearch(debitForm.accountNumber)
    } catch (error) {
      setDebitError(getApiError(error, 'Failed to process debit. Please try again.'))
    } finally {
      setDebitSaving(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setTransferError('')
    if (!transferForm.fromAccountNumber.trim()) {
      setTransferError('From account number is required.')
      return
    }
    if (!transferForm.toAccountNumber.trim()) {
      setTransferError('To account number is required.')
      return
    }
    if (!transferForm.transferAmount || isNaN(Number(transferForm.transferAmount)) || Number(transferForm.transferAmount) <= 0) {
      setTransferError('A valid transfer amount is required.')
      return
    }

    setTransferSaving(true)
    try {
      await clientTransactionsAPI.transfer({
        fromAccountNumber: transferForm.fromAccountNumber.trim(),
        toAccountNumber: transferForm.toAccountNumber.trim(),
        transferAmount: Number(transferForm.transferAmount),
        transferDescription: transferForm.transferDescription.trim(),
        referenceId: transferForm.referenceId.trim(),
      }, skipAuth)
      setShowTransferDialog(false)
      await doSearch(transferForm.fromAccountNumber.trim())
    } catch (error) {
      setTransferError(getApiError(error, 'Failed to process transfer. Please try again.'))
    } finally {
      setTransferSaving(false)
    }
  }

  const handleApproveLookedUpAccount = async () => {
    if (!account) return
    setAccountActionError('')
    setAccountActionLoading(true)
    try {
      await accountsAPI.approve(account.accountNo, { approvedOnDate: currentIsoDate() }, skipAuth)
      await doSearch(account.accountNo)
    } catch (error) {
      setAccountActionError(getApiError(error, 'Failed to approve account.'))
    } finally {
      setAccountActionLoading(false)
    }
  }

  const handleActivateLookedUpAccount = async () => {
    if (!account) return
    setAccountActionError('')
    setAccountActionLoading(true)
    try {
      await accountsAPI.activate(account.accountNo, { activatedOnDate: currentIsoDate() }, skipAuth)
      await doSearch(account.accountNo)
    } catch (error) {
      setAccountActionError(getApiError(error, 'Failed to activate account.'))
    } finally {
      setAccountActionLoading(false)
    }
  }

  const filteredTxs = entryFilter === 'ALL'
    ? transactions
    : transactions.filter(tx => tx.entryType?.toUpperCase() === entryFilter)

  const totalCredits = transactions.filter(tx => tx.entryType?.toUpperCase() === 'CREDIT').reduce((s, t) => s + t.amount, 0)
  const totalDebits  = transactions.filter(tx => tx.entryType?.toUpperCase() === 'DEBIT').reduce((s, t) => s + t.amount, 0)
  const isActive     = account?.status?.toLowerCase() === 'active'
  const isPending    = isPendingApprovalStatus(account?.status ?? '')
  const isApproved   = account?.status?.toUpperCase() === 'APPROVED'

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '28px 28px 48px', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>
            Account Lookup
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: '4px 0 0' }}>
            Search an account number to view details and transaction history
          </p>
        </div>
        <button
          onClick={() => { setCreateError(''); setCreateSuccess(''); setCreateSearch(''); setCreateClientResults([]); setCreateSelectedClient(null); setShowCreateDialog(true) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 9, border: 'none',
            background: T.navy, color: '#fff',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = T.navyDark)}
          onMouseLeave={e => (e.currentTarget.style.background = T.navy)}
        >
          <Plus style={{ width: 14, height: 14 }} />
          Create Account
        </button>
      </div>

      {/* Search card */}
      <div style={{ background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: '28px 32px', marginBottom: 24 }}>
        <form onSubmit={handleSearch}>
          <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, marginBottom: 10 }}>
            Account Number
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
              <Wallet style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: T.textMuted, pointerEvents: 'none' }} />
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="e.g. 0010020000021"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 16px 12px 44px',
                  fontFamily: 'DM Mono, monospace', fontSize: 15, color: T.text,
                  background: '#F5F8FE', border: `1.5px solid ${T.border}`,
                  borderRadius: 10, outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  letterSpacing: '0.05em',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,38,99,0.08)' }}
                onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !inputValue.trim()}
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none',
                background: T.navy, color: '#fff',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
                cursor: searching || !inputValue.trim() ? 'not-allowed' : 'pointer',
                opacity: searching || !inputValue.trim() ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 8,
                whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'background 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => { if (!searching && inputValue.trim()) e.currentTarget.style.background = T.navyDark }}
              onMouseLeave={e => { e.currentTarget.style.background = T.navy }}
            >
              {searching ? (
                <><RefreshCw style={{ width: 14, height: 14, animation: 'spin 0.9s linear infinite' }} /> Searching…</>
              ) : (
                <><Search style={{ width: 14, height: 14 }} /> Look Up</>
              )}
            </button>
          </div>
          {searchError && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#DC2626' }}>
              {searchError}
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      {account && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Account hero */}
          <div style={{
            background: `linear-gradient(135deg, ${T.navyDark} 0%, ${T.navy} 55%, ${T.navyLight} 100%)`,
            borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,38,99,0.22)', position: 'relative',
          }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, #E8C96A, ${T.gold})` }} />
            <div style={{
              position: 'absolute', inset: 0, top: 3, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }} />
            <div style={{ padding: '28px 32px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(180,200,255,0.7)', margin: '0 0 6px' }}>
                    Account Number
                  </p>
                  <p style={{ fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '0.04em' }}>
                    {account.accountNo}
                  </p>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'rgba(200,215,255,0.75)', margin: '6px 0 0' }}>
                    {account.productName}
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(180,200,255,0.7)', margin: 0 }}>
                    Current Balance
                  </p>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>
                    {account.currency} {account.balance.toFixed(2)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 14px', borderRadius: 20,
                      fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700,
                      background: isActive ? 'rgba(16,185,129,0.2)' : 'rgba(217,119,6,0.18)',
                      color: isActive ? '#A7F3D0' : '#FCD34D',
                      border: `1px solid ${isActive ? 'rgba(167,243,208,0.35)' : 'rgba(252,211,77,0.35)'}`,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#34D399' : '#FBBF24' }} />
                      {account.status}
                    </span>
                    {isPending && (
                      <button
                        type="button"
                        disabled={accountActionLoading}
                        onClick={handleApproveLookedUpAccount}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 20, border: 'none',
                          background: 'rgba(37,99,235,0.28)', color: '#BFDBFE',
                          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
                          cursor: accountActionLoading ? 'not-allowed' : 'pointer',
                          opacity: accountActionLoading ? 0.65 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!accountActionLoading) e.currentTarget.style.background = 'rgba(37,99,235,0.38)' }}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.28)')}
                      >
                        <ArrowDownToLine style={{ width: 12, height: 12 }} />
                        {accountActionLoading ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                    {isApproved && (
                      <button
                        type="button"
                        disabled={accountActionLoading}
                        onClick={handleActivateLookedUpAccount}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 20, border: 'none',
                          background: 'rgba(16,185,129,0.2)', color: '#A7F3D0',
                          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
                          cursor: accountActionLoading ? 'not-allowed' : 'pointer',
                          opacity: accountActionLoading ? 0.65 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!accountActionLoading) e.currentTarget.style.background = 'rgba(16,185,129,0.3)' }}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
                      >
                        <ArrowUpFromLine style={{ width: 12, height: 12 }} />
                        {accountActionLoading ? 'Activating...' : 'Activate'}
                      </button>
                    )}
                    <button
                      onClick={() => { setCreateError(''); setCreateSuccess(''); setShowCreateDialog(true) }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 20, border: 'none',
                        background: 'rgba(255,255,255,0.15)', color: '#fff',
                        fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                    >
                      <Plus style={{ width: 12, height: 12 }} />
                      Create Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {[
                  { label: 'Client ID',       value: account.clientId,       mono: true  },
                  { label: 'Client Name',      value: account.clientName,     mono: false },
                  { label: 'Activation Date',  value: account.activatedDate,  mono: false },
                ].map((f, i) => (
                  <div key={f.label} style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingRight: 24, paddingLeft: i > 0 ? 24 : 0 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(180,200,255,0.6)', margin: '0 0 5px' }}>
                      {f.label}
                    </p>
                    <p style={{ fontFamily: f.mono ? 'DM Mono, monospace' : 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#fff', margin: 0 }}>
                      {f.value || '—'}
                    </p>
                  </div>
                ))}
              </div>
              {accountActionError && (
                <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(254,242,242,0.12)', border: '1px solid rgba(254,202,202,0.35)', fontSize: 12, color: '#FECACA' }}>
                  {accountActionError}
                </div>
              )}
            </div>
          </div>

          {/* Summary stats */}
          {transactions.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { label: 'Transactions',   value: transactions.length.toString(),                              icon: Activity,      iconBg: '#EFF6FF', iconColor: '#2563EB', valueColor: T.text    },
                { label: 'Total Credits',  value: `${account.currency} ${totalCredits.toFixed(2)}`,           icon: TrendingUp,    iconBg: T.successBg, iconColor: T.success, valueColor: T.success },
                { label: 'Total Debits',   value: `${account.currency} ${totalDebits.toFixed(2)}`,            icon: TrendingDown,  iconBg: '#FEF2F2', iconColor: '#DC2626', valueColor: '#DC2626' },
                { label: 'Net',            value: `${account.currency} ${(totalCredits - totalDebits).toFixed(2)}`, icon: Wallet, iconBg: '#F5F3FF', iconColor: '#7C3AED', valueColor: '#7C3AED' },
              ].map(stat => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 18, height: 18, color: stat.iconColor }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 4px' }}>
                        {stat.label}
                      </p>
                      <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: stat.valueColor, margin: 0 }}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Transactions table */}
          <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 22px', borderBottom: `1px solid ${T.border}`, borderRadius: '14px 14px 0 0', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: T.navy }} />
                <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.text }}>
                  Transaction History
                </span>
              </div>

              {/* Right side: Actions dropdown + filter pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

              {/* Actions dropdown */}
              {isActive && (
                <>
                  {showActionsDropdown && (
                    <div onClick={() => setShowActionsDropdown(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  )}
                  <div style={{ position: 'relative', zIndex: 41 }}>
                    <button
                      onClick={() => setShowActionsDropdown(p => !p)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${T.border}`,
                        background: showActionsDropdown ? T.navy : '#F5F8FE',
                        color: showActionsDropdown ? '#fff' : T.text,
                        fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      Actions
                      <ChevronDown style={{ width: 13, height: 13, transition: 'transform 0.15s', transform: showActionsDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {showActionsDropdown && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: 12, boxShadow: '0 8px 28px rgba(0,38,99,0.16)',
                        minWidth: 200, overflow: 'hidden', padding: '6px 0',
                      }}>
                        {[
                          { label: 'Credit Account', icon: ArrowDownToLine, color: T.success,  bg: T.successBg, action: openCreditDialog  },
                          { label: 'Debit Account',  icon: ArrowUpFromLine, color: '#DC2626',  bg: '#FEF2F2',   action: openDebitDialog   },
                          { label: 'Transfer Funds', icon: ArrowLeftRight,  color: '#2563EB',  bg: '#EFF6FF',   action: openTransferDialog },
                        ].map(({ label, icon: Icon, color, bg, action }, i, arr) => (
                          <div key={label}>
                            <button
                              onClick={() => { action(); setShowActionsDropdown(false) }}
                              style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 16px', border: 'none', background: 'transparent',
                                cursor: 'pointer', transition: 'background 0.12s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#F5F8FE')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span style={{
                                width: 32, height: 32, borderRadius: 8, background: bg, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <Icon style={{ width: 14, height: 14, color }} />
                              </span>
                              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>
                                {label}
                              </span>
                            </button>
                            {i < arr.length - 1 && (
                              <div style={{ height: 1, background: T.border, margin: '2px 16px' }} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Filter pills */}
              {transactions.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {(['ALL', 'CREDIT', 'DEBIT'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setEntryFilter(f)}
                      style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: entryFilter === f ? 600 : 400,
                        color: entryFilter === f ? '#fff' : T.textSub,
                        background: entryFilter === f
                          ? (f === 'CREDIT' ? T.success : f === 'DEBIT' ? '#DC2626' : T.navy)
                          : '#F5F8FE',
                        border: `1.5px solid ${entryFilter === f ? (f === 'CREDIT' ? T.success : f === 'DEBIT' ? '#DC2626' : T.navy) : T.border}`,
                        borderRadius: 7, padding: '4px 12px', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.15s',
                      }}
                    >
                      {f === 'CREDIT' && <ArrowDownToLine style={{ width: 10, height: 10 }} />}
                      {f === 'DEBIT'  && <ArrowUpFromLine style={{ width: 10, height: 10 }} />}
                      {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                    </button>
                  ))}
                  <span style={{ marginLeft: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: T.textMuted }}>
                    {filteredTxs.length} result{filteredTxs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              </div>
            </div>

            {txLoading ? (
              <p style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.textMuted }}>
                Loading transactions…
              </p>
            ) : txError ? (
              <p style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#EF4444' }}>
                {txError}
              </p>
            ) : filteredTxs.length === 0 ? (
              <p style={{ padding: '56px 24px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.textMuted }}>
                No transactions found
              </p>
            ) : (
              <div style={{ borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F5F8FE', borderBottom: `1px solid ${T.border}` }}>
                    {['Date', 'Type', 'Entry', 'Amount', 'Running Balance', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '10px 20px', textAlign: 'left',
                        fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTxs.map(tx => (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '13px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.textSub }}>{tx.date}</td>
                      <td style={{ padding: '13px 20px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.text }}>{tx.type}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20,
                          fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600,
                          background: tx.entryType?.toUpperCase() === 'CREDIT' ? T.successBg : tx.entryType?.toUpperCase() === 'DEBIT' ? '#FEF2F2' : '#F1F5F9',
                          color: tx.entryType?.toUpperCase() === 'CREDIT' ? T.success : tx.entryType?.toUpperCase() === 'DEBIT' ? '#DC2626' : T.textSub,
                        }}>
                          {tx.entryType?.toUpperCase() === 'CREDIT' && <ArrowDownToLine style={{ width: 10, height: 10 }} />}
                          {tx.entryType?.toUpperCase() === 'DEBIT'  && <ArrowUpFromLine style={{ width: 10, height: 10 }} />}
                          {tx.entryType}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, color: T.text }}>
                        {tx.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 20px', fontFamily: 'Sora, sans-serif', fontSize: 13, color: T.textSub }}>
                        {tx.runningBalance.toFixed(2)}
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <StatusPill status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Account Dialog ──────────────────────────────────────── */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Credit Account</DialogTitle>
            <DialogDescription>
              Credit funds to account <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{creditForm.accountNumber}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCredit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creditAmount" className="text-sm text-gray-700 mb-1.5 block">Amount <span className="text-red-500">*</span></Label>
                <Input id="creditAmount" type="number" min="0.01" step="0.01" placeholder="0.00" value={creditForm.transactionAmount} onChange={e => setCreditForm(p => ({ ...p, transactionAmount: e.target.value }))} className="bg-gray-50 border-gray-300" />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1.5 block">Payment Type <span className="text-red-500">*</span></Label>
                <Select value={creditForm.paymentTypeId} onValueChange={v => setCreditForm(p => ({ ...p, paymentTypeId: v }))}>
                  <SelectTrigger className="bg-gray-50 border-gray-300"><SelectValue placeholder="Select payment type" /></SelectTrigger>
                  <SelectContent>{paymentTypes.map(pt => <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="creditDate" className="text-sm text-gray-700 mb-1.5 block">Transaction Date <span className="text-red-500">*</span></Label>
              <Input id="creditDate" type="date" value={creditForm.transactionDate} onChange={e => setCreditForm(p => ({ ...p, transactionDate: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div>
              <Label htmlFor="creditNote" className="text-sm text-gray-700 mb-1.5 block">Note</Label>
              <Input id="creditNote" placeholder="e.g. Cash deposit" value={creditForm.note} onChange={e => setCreditForm(p => ({ ...p, note: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            {creditError && <p className="text-sm text-red-600">{creditError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreditDialog(false)} disabled={creditSaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: T.success }} disabled={creditSaving}>{creditSaving ? 'Processing...' : 'Credit'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDebitDialog} onOpenChange={setShowDebitDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Debit Account</DialogTitle>
            <DialogDescription>
              Debit funds from account <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600 }}>{debitForm.accountNumber}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDebit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="debitAmount" className="text-sm text-gray-700 mb-1.5 block">Amount <span className="text-red-500">*</span></Label>
                <Input id="debitAmount" type="number" min="0.01" step="0.01" placeholder="0.00" value={debitForm.transactionAmount} onChange={e => setDebitForm(p => ({ ...p, transactionAmount: e.target.value }))} className="bg-gray-50 border-gray-300" />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-1.5 block">Payment Type <span className="text-red-500">*</span></Label>
                <Select value={debitForm.paymentTypeId} onValueChange={v => setDebitForm(p => ({ ...p, paymentTypeId: v }))}>
                  <SelectTrigger className="bg-gray-50 border-gray-300"><SelectValue placeholder="Select payment type" /></SelectTrigger>
                  <SelectContent>{paymentTypes.map(pt => <SelectItem key={pt.id} value={String(pt.id)}>{pt.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="debitDate" className="text-sm text-gray-700 mb-1.5 block">Transaction Date <span className="text-red-500">*</span></Label>
              <Input id="debitDate" type="date" value={debitForm.transactionDate} onChange={e => setDebitForm(p => ({ ...p, transactionDate: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div>
              <Label htmlFor="debitNote" className="text-sm text-gray-700 mb-1.5 block">Note</Label>
              <Input id="debitNote" placeholder="e.g. Cash withdrawal" value={debitForm.note} onChange={e => setDebitForm(p => ({ ...p, note: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            {debitError && <p className="text-sm text-red-600">{debitError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDebitDialog(false)} disabled={debitSaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: '#DC2626' }} disabled={debitSaving}>{debitSaving ? 'Processing...' : 'Debit'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Transfer</DialogTitle>
            <DialogDescription>Transfer funds from the looked-up account to another account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <Label htmlFor="transferFrom" className="text-sm text-gray-700 mb-1.5 block">From Account <span className="text-red-500">*</span></Label>
              <Input id="transferFrom" value={transferForm.fromAccountNumber} onChange={e => setTransferForm(p => ({ ...p, fromAccountNumber: e.target.value }))} className="bg-gray-50 border-gray-300 font-mono" />
            </div>
            <div>
              <Label htmlFor="transferTo" className="text-sm text-gray-700 mb-1.5 block">To Account <span className="text-red-500">*</span></Label>
              <Input id="transferTo" placeholder="Account number" value={transferForm.toAccountNumber} onChange={e => setTransferForm(p => ({ ...p, toAccountNumber: e.target.value }))} className="bg-gray-50 border-gray-300 font-mono" />
            </div>
            <div>
              <Label htmlFor="transferAmount" className="text-sm text-gray-700 mb-1.5 block">Amount <span className="text-red-500">*</span></Label>
              <Input id="transferAmount" type="number" min="0.01" step="0.01" placeholder="0.00" value={transferForm.transferAmount} onChange={e => setTransferForm(p => ({ ...p, transferAmount: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div>
              <Label htmlFor="transferDesc" className="text-sm text-gray-700 mb-1.5 block">Description</Label>
              <Input id="transferDesc" placeholder="e.g. Internal transfer" value={transferForm.transferDescription} onChange={e => setTransferForm(p => ({ ...p, transferDescription: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            <div>
              <Label htmlFor="transferRef" className="text-sm text-gray-700 mb-1.5 block">Reference ID</Label>
              <Input id="transferRef" placeholder="Optional reference" value={transferForm.referenceId} onChange={e => setTransferForm(p => ({ ...p, referenceId: e.target.value }))} className="bg-gray-50 border-gray-300" />
            </div>
            {transferError && <p className="text-sm text-red-600">{transferError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTransferDialog(false)} disabled={transferSaving}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: '#2563EB' }} disabled={transferSaving}>{transferSaving ? 'Processing...' : 'Transfer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={open => {
        setShowCreateDialog(open)
        if (!open) { setCreateSearch(''); setCreateClientResults([]); setCreateSelectedClient(null); setCreateError(''); setCreateSuccess('') }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Create Savings Account</DialogTitle>
            <DialogDescription>Search for a client by name or client ID, then select a savings product.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Client search */}
            <div>
              <Label className="text-sm text-gray-700 mb-1.5 block">Search Client</Label>
              <form onSubmit={handleCreateClientSearch} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: T.textMuted, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={createSearch}
                    onChange={e => { setCreateSearch(e.target.value); setCreateClientResults([]); setCreateSelectedClient(null) }}
                    placeholder="Client name or client ID…"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '9px 12px 9px 32px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.text,
                      background: '#F5F8FE', border: `1.5px solid ${T.border}`,
                      borderRadius: 8, outline: 'none',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = T.navy }}
                    onBlur={e => { e.currentTarget.style.borderColor = T.border }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={createSearching || !createSearch.trim()}
                  style={{
                    padding: '9px 16px', borderRadius: 8, border: 'none',
                    background: T.navy, color: '#fff',
                    fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
                    cursor: createSearching || !createSearch.trim() ? 'not-allowed' : 'pointer',
                    opacity: createSearching || !createSearch.trim() ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  }}
                >
                  {createSearching
                    ? <RefreshCw style={{ width: 13, height: 13, animation: 'spin 0.9s linear infinite' }} />
                    : <Search style={{ width: 13, height: 13 }} />}
                  Search
                </button>
              </form>

              {/* Client results */}
              {createClientResults.length > 0 && (
                <div style={{ marginTop: 8, borderRadius: 8, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  {createClientResults.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCreateSelectedClient(c); setCreateClientResults([]) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', border: 'none', cursor: 'pointer',
                        background: 'transparent',
                        borderBottom: i < createClientResults.length - 1 ? `1px solid ${T.border}` : 'none',
                        transition: 'background 0.1s', textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F5F8FE')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User style={{ width: 13, height: 13, color: '#2563EB' }} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</p>
                        <p style={{ margin: 0, fontFamily: 'DM Mono, monospace', fontSize: 11, color: T.textMuted }}>ID: {c.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected client chip */}
              {createSelectedClient && (
                <div style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: '#EFF6FF', border: `1px solid #BFDBFE`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User style={{ width: 14, height: 14, color: '#2563EB' }} />
                    <div>
                      <p style={{ margin: 0, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, color: T.text }}>{createSelectedClient.name}</p>
                      <p style={{ margin: 0, fontFamily: 'DM Mono, monospace', fontSize: 11, color: T.textMuted }}>ID: {createSelectedClient.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCreateSelectedClient(null); setCreateSearch('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: 16, lineHeight: 1, padding: 4 }}
                  >×</button>
                </div>
              )}
            </div>

            {/* Product + date — only show once client selected */}
            {createSelectedClient && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-700 mb-1.5 block">
                    Savings Product <span className="text-red-500">*</span>
                  </Label>
                  <Select value={createForm.savingsProduct} onValueChange={v => { setCreateForm(p => ({ ...p, savingsProduct: v })); setCreateError('') }}>
                    <SelectTrigger className="bg-gray-50 border-gray-300">
                      <SelectValue placeholder={savingsProductsLoading ? 'Loading savings products...' : 'Select savings product'} />
                    </SelectTrigger>
                    <SelectContent>
                      {savingsProducts.map(product => (
                        <SelectItem key={product.id} value={product.name}>{product.name} ({product.currency})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-1.5 block">Submitted On Date</Label>
                  <Input
                    type="date"
                    value={createForm.submittedOnDate}
                    onChange={e => { setCreateForm(p => ({ ...p, submittedOnDate: e.target.value })); setCreateError('') }}
                    className="bg-gray-50 border-gray-300"
                  />
                </div>
                {createError   && <p className="text-sm text-red-600">{createError}</p>}
                {createSuccess && <p className="text-sm text-green-600">{createSuccess}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} disabled={createSaving}>Cancel</Button>
                  <Button type="submit" className="text-white" style={{ backgroundColor: T.navy }} disabled={createSaving}>
                    {createSaving ? 'Creating…' : 'Create Account'}
                  </Button>
                </DialogFooter>
              </form>
            )}

            {!createSelectedClient && (
              <>
                {createError && <p className="text-sm text-red-600">{createError}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
