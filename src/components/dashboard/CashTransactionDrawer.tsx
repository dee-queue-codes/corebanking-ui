import { useState, useEffect, useRef } from 'react'
import { X, Search, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Loader2 } from 'lucide-react'
import { accountsAPI } from '@/services/clients/accountsAPI'
import { clientTransactionsAPI } from '@/services/clients/transactionsAPI'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
interface AccountInfo {
  accountNo: string
  clientName: string
  currency: string
  balance: number
  status: string
  type: string
}

export type CashTxType = 'deposit' | 'withdraw'

interface Props {
  type: CashTxType | null
  onClose: () => void
}

function getErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: unknown }; message?: string }
  const data = err.response?.data
  if (data && typeof data === 'object') {
    const r = data as Record<string, unknown>
    if (typeof r.responseMessage === 'string' && r.responseMessage) return r.responseMessage
    if (typeof r.message === 'string' && r.message) return r.message
  }
  if (typeof err.message === 'string' && err.message) return err.message
  return 'Something went wrong. Please try again.'
}

export function CashTransactionDrawer({ type, onClose }: Props) {
  const [accountNumber, setAccountNumber] = useState('')
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [amount, setAmount] = useState('')
  const [narration, setNarration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDeposit = type === 'deposit'
  const open = type !== null

  // Reset state whenever drawer opens with a new type
  useEffect(() => {
    if (open) {
      setAccountNumber('')
      setAccount(null)
      setLookupError('')
      setAmount('')
      setNarration('')
      setError('')
      setSuccess(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, type])

  const lookupAccount = async () => {
    const num = accountNumber.trim()
    if (!num) return
    setLookupLoading(true)
    setLookupError('')
    setAccount(null)
    try {
      const res = await accountsAPI.getByAccountNumber(num)
      const body = (res as { data?: unknown }).data
      const raw = (body && typeof body === 'object' && 'data' in body)
        ? (body as Record<string, unknown>).data
        : body
      const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
      const accNo = String(a.accountNo ?? a.accountNumber ?? num)
      const clientName = (() => {
        if (typeof a.clientName === 'string' && a.clientName) return a.clientName
        if (a.client && typeof a.client === 'object') {
          const c = a.client as Record<string, unknown>
          return String(c.displayName ?? c.name ?? c.fullName ?? '')
        }
        return ''
      })()
      setAccount({
        accountNo:  accNo,
        clientName,
        currency:   String(a.currency ?? 'GHS'),
        balance:    Number(a.balance ?? a.accountBalance ?? a.availableBalance ?? 0),
        status:     String((a.status && typeof a.status === 'object' ? (a.status as Record<string,unknown>).value : a.status) ?? ''),
        type:       String((a.savingsProduct && typeof a.savingsProduct === 'object' ? (a.savingsProduct as Record<string,unknown>).name : a.accountType ?? a.type) ?? ''),
      })
    } catch {
      setLookupError('Account not found.')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!account) return
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return }
    setSubmitting(true)
    setError('')
    try {
      const payload = { transactionAmount: amt, narration: narration.trim() || (isDeposit ? 'Cash deposit' : 'Cash withdrawal') }
      if (isDeposit) {
        await clientTransactionsAPI.deposit(account.accountNo, payload)
      } else {
        await clientTransactionsAPI.withdraw(account.accountNo, payload)
      }
      setSuccess(true)
      setTimeout(onClose, 1800)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Backdrop + drawer
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300"
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDeposit ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {isDeposit
                ? <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
                : <ArrowUpFromLine className="h-4 w-4 text-red-500" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{isDeposit ? 'Cash Deposit' : 'Cash Withdrawal'}</h2>
              <p className="text-xs text-gray-400">{isDeposit ? 'Credit funds into an account' : 'Debit funds from an account'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {success ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-gray-900">{isDeposit ? 'Deposit Successful' : 'Withdrawal Successful'}</p>
              <p className="text-xs text-gray-400">Transaction has been posted.</p>
            </div>
          ) : (
            <form id="cash-tx-form" onSubmit={handleSubmit} className="space-y-5">

              {/* Account lookup */}
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-gray-500">Account Number</Label>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={accountNumber}
                    onChange={e => { setAccountNumber(e.target.value); setAccount(null); setLookupError('') }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookupAccount())}
                    placeholder="e.g. 1000234501"
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={lookupAccount}
                    disabled={!accountNumber.trim() || lookupLoading}
                    className="shrink-0 border-gray-200 px-3"
                  >
                    {lookupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {lookupError && <p className="mt-1.5 text-xs text-red-500">{lookupError}</p>}
              </div>

              {/* Account info */}
              {account && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
                  {account.clientName && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Name</span>
                      <span className="font-semibold text-gray-800">{account.clientName}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Account</span>
                    <span className="font-mono font-semibold text-gray-800">{account.accountNo}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Type</span>
                    <span className="font-semibold capitalize text-gray-800">{account.type}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Balance</span>
                    <span className="font-semibold text-gray-800">
                      {account.currency} {Number(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-semibold capitalize ${account.status === 'active' ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {account.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-gray-500">Amount</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="font-mono"
                  disabled={!account}
                />
              </div>

              {/* Narration */}
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-gray-500">Narration <span className="text-gray-300">(optional)</span></Label>
                <Input
                  value={narration}
                  onChange={e => setNarration(e.target.value)}
                  placeholder={isDeposit ? 'Cash deposit' : 'Cash withdrawal'}
                  disabled={!account}
                />
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">{error}</p>}
            </form>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-gray-200 text-sm text-gray-600">
              Cancel
            </Button>
            <Button
              type="submit"
              form="cash-tx-form"
              disabled={!account || !amount || submitting}
              className="flex-1 text-sm text-white"
              style={{ backgroundColor: isDeposit ? '#059669' : '#DC2626' }}
            >
              {submitting
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                : isDeposit ? 'Post Deposit' : 'Post Withdrawal'}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
