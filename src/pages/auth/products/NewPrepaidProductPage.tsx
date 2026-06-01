import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { BackButton } from '@/components/ui/back-button'
import { ROUTES } from '@/router/routes'

const sections = [
  { id: 'details',    label: 'Details'    },
  { id: 'currency',   label: 'Currency'   },
  { id: 'terms',      label: 'Terms'      },
  { id: 'settings',   label: 'Settings'   },
  { id: 'charges',    label: 'Charges'    },
  { id: 'accounting', label: 'Accounting' },
  { id: 'preview',    label: 'Preview'    },
]

const sectionOrder = sections.map(s => s.id)

export default function NewPrepaidProductPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('details')
  const [isOverdraftAllowed, setIsOverdraftAllowed] = useState(false)
  const [enableDormancyTracking, setEnableDormancyTracking] = useState(false)
  const [accountingType, setAccountingType] = useState('none')

  const prev = () => {
    const i = sectionOrder.indexOf(activeSection)
    if (i > 0) setActiveSection(sectionOrder[i - 1])
  }
  const next = () => {
    const i = sectionOrder.indexOf(activeSection)
    if (i < sectionOrder.length - 1) setActiveSection(sectionOrder[i + 1])
  }

  const NavButtons = ({ prevLabel = 'Previous', nextLabel = 'Next', onNext = next }: { prevLabel?: string; nextLabel?: string; onNext?: () => void }) => (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
      <Button variant="outline" className="text-sm text-gray-600 border-gray-300" onClick={prev}>
        <ChevronLeft className="w-4 h-4 mr-1" />{prevLabel}
      </Button>
      <Button className="text-xs text-white" style={{ backgroundColor: '#002663' }} onClick={onNext}>
        {nextLabel}<ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <BackButton onClick={() => navigate(ROUTES.PRODUCTS.PREPAID)} label="Back to Prepaid Products" />

      <div className="mb-6">
        <h1 className="text-gray-900 font-semibold text-xl mb-1">New Prepaid Product</h1>
        <p className="text-xs text-gray-500">Manage prepaid card and account products</p>
      </div>

      <div className="flex gap-6 h-full">
        {/* Left nav */}
        <div className="w-44 shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === s.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Details */}
          {activeSection === 'details' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-gray-900 font-semibold mb-1">Details</h2>
              <p className="text-sm text-gray-500 mb-6">Create a new prepaid product</p>
              <div className="space-y-5">
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Product Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Enter product name..." className="border-gray-200 text-sm" />
                </div>z
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Short Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="Enter short name..." className="border-gray-200 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Description</Label>
                  <Textarea placeholder="Enter product description..." className="border-gray-200 text-sm min-h-25" />
                </div>
              </div>
              <NavButtons prevLabel="Cancel" />
            </div>
          )}

          {/* Currency */}
          {activeSection === 'currency' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-gray-900 font-semibold mb-1">Currency</h2>
              <p className="text-sm text-gray-500 mb-6">Configure currency settings</p>
              <div className="space-y-5">
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Currency <span className="text-red-500">*</span></Label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500">
                    <option value="">Select currency...</option>
                    <option>GHS - Ghanaian Cedi</option>
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                    <option>NGN - Nigerian Naira</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Decimal Places <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="Enter decimal places..." className="border-gray-200 text-sm" min="0" max="4" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Currency in multiples of</Label>
                  <Input type="number" placeholder="Enter multiple value..." className="border-gray-200 text-sm" min="1" />
                </div>
              </div>
              <NavButtons />
            </div>
          )}

          {/* Terms */}
          {activeSection === 'terms' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-gray-900 font-semibold mb-1">Terms</h2>
              <p className="text-sm text-gray-500 mb-6">Configure product terms and conditions</p>
              <div className="space-y-5">
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Nominal Annual Interest <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="Enter interest rate..." className="border-gray-200 text-sm" min="0" step="0.01" />
                </div>
                {[
                  { label: 'Interest Compounding Period', opts: ['Daily','Monthly','Quarterly','Semi-annually','Annually'] },
                  { label: 'Interest Posting Period',    opts: ['Daily','Monthly','Quarterly','Semi-annually','Annually'] },
                  { label: 'Interest Calculated Using',  opts: ['Daily Balance','Average Daily Balance'] },
                  { label: 'Days in Year',               opts: ['360 Days','365 Days'] },
                ].map(({ label, opts }) => (
                  <div key={label}>
                    <Label className="text-xs text-gray-600 mb-1.5 block">{label} <span className="text-red-500">*</span></Label>
                    <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500">
                      <option value="">Select...</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <NavButtons />
            </div>
          )}

          {/* Settings */}
          {activeSection === 'settings' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-gray-900 font-semibold mb-1">Settings</h2>
              <p className="text-sm text-gray-500 mb-6">Configure product settings</p>
              <div className="space-y-5">
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Minimum Opening Balance <span className="text-red-500">*</span></Label>
                  <Input type="number" placeholder="Enter minimum opening balance..." className="border-gray-200 text-sm" min="0" step="0.01" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Lock-in Period</Label>
                  <Input type="number" placeholder="Enter lock-in period in days..." className="border-gray-200 text-sm" min="0" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="withdrawalFee" />
                  <Label htmlFor="withdrawalFee" className="text-sm text-gray-700 cursor-pointer">Apply Withdrawal Fee for Transfers</Label>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Balance Required for Interest Calculation</Label>
                  <Input type="number" placeholder="Enter balance required..." className="border-gray-200 text-sm" min="0" step="0.01" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="enforceMinBalance" />
                  <Label htmlFor="enforceMinBalance" className="text-sm text-gray-700 cursor-pointer">Enforce Minimum Balance</Label>
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Minimum Balance</Label>
                  <Input type="number" placeholder="Enter minimum balance..." className="border-gray-200 text-sm" min="0" step="0.01" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="withholdTax" />
                  <Label htmlFor="withholdTax" className="text-sm text-gray-700 cursor-pointer">Is Withhold Tax Applicable</Label>
                </div>

                {/* Overdraft */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Overdraft</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="overdraftAllowed" className="text-sm text-gray-700 cursor-pointer">Is Overdraft Allowed</Label>
                      <Checkbox id="overdraftAllowed" checked={isOverdraftAllowed} onCheckedChange={v => setIsOverdraftAllowed(v as boolean)} />
                    </div>
                  </div>
                  {isOverdraftAllowed && (
                    <div className="grid grid-cols-3 gap-4">
                      {['Minimum Overdraft Required for Interest Calculation','Nominal Annual Interest for Overdraft','Maximum Overdraft Amount Limit'].map(label => (
                        <div key={label}>
                          <Label className="text-xs text-gray-600 mb-1.5 block">{label}</Label>
                          <Input type="number" className="border-gray-200 text-sm bg-gray-50" min="0" step="0.01" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dormancy */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Dormancy Tracking</h3>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dormancy" className="text-sm text-gray-700 cursor-pointer">Enable Dormancy Tracking</Label>
                      <Checkbox id="dormancy" checked={enableDormancyTracking} onCheckedChange={v => setEnableDormancyTracking(v as boolean)} />
                    </div>
                  </div>
                  {enableDormancyTracking && (
                    <div className="grid grid-cols-3 gap-4">
                      {['Days to Inactive sub-status *','Days to Dormant sub-status *','Days to Escheat *'].map(label => (
                        <div key={label}>
                          <Label className="text-xs text-gray-600 mb-1.5 block">{label}</Label>
                          <Input type="number" className="border-gray-200 text-sm bg-gray-50" min="0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <NavButtons />
            </div>
          )}

          {/* Charges */}
          {activeSection === 'charges' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-gray-900 font-semibold mb-1">Charges</h2>
              <p className="text-sm text-gray-500 mb-6">Configure product charges and fees</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <select className="w-full px-4 py-2.5 bg-gray-100 border-none rounded-lg text-sm focus:outline-none text-gray-600 appearance-none pr-10">
                    <option>Charge</option>
                    <option>Withdrawal Fee</option>
                    <option>Deposit Fee</option>
                    <option>Transfer Fee</option>
                    <option>Maintenance Fee</option>
                    <option>Account Closure Fee</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <Button variant="outline" className="px-5 bg-gray-100 text-gray-600 border-none hover:bg-gray-200 text-sm">
                  <Plus className="w-4 h-4 mr-2" />Add
                </Button>
              </div>
              <NavButtons />
            </div>
          )}

          {/* Accounting */}
          {activeSection === 'accounting' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-gray-900 font-semibold mb-1">Accounting</h2>
              <p className="text-sm text-gray-500 mb-6">Configure accounting settings</p>
              <div className="flex items-center gap-8 mb-6">
                {['none','cash','accrual'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="accountingType" value={t} checked={accountingType === t}
                      onChange={e => setAccountingType(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 capitalize">{t === 'accrual' ? 'Accrual (periodic)' : t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  </label>
                ))}
              </div>
              {(accountingType === 'cash' || accountingType === 'accrual') && (
                <div className="space-y-6">
                  {[
                    { title: 'Assets', fields: accountingType === 'accrual'
                      ? ['Saving reference','Overdraft portfolio','Fees Receivable','Penalties Receivable']
                      : ['Saving reference','Overdraft portfolio'] },
                    { title: 'Liabilities', fields: accountingType === 'accrual'
                      ? ['Saving control','Savings transfers in suspense','Interest Payable']
                      : ['Saving control','Savings transfers in suspense'] },
                    { title: 'Expenses', fields: ['Interest on savings','Write-off'] },
                    { title: 'Income',   fields: ['Income from fees','Income from penalties','Overdraft Interest Income'] },
                  ].map(({ title, fields }) => (
                    <div key={title}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {fields.map(f => (
                          <div key={f}>
                            <Label className="text-xs text-gray-600 mb-1.5 block">{f} <span className="text-red-500">*</span></Label>
                            <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option>Select account...</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <NavButtons />
            </div>
          )}

          {/* Preview */}
          {activeSection === 'preview' && (
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h2 className="text-gray-900 font-semibold mb-1">Preview</h2>
              <p className="text-sm text-gray-500 mb-6">Review your prepaid product before submitting</p>
              <div className="py-12 text-center text-gray-400 text-sm">
                Product preview will be displayed here
              </div>
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
                <Button variant="outline" className="text-sm text-gray-600 border-gray-300" onClick={prev}>
                  <ChevronLeft className="w-4 h-4 mr-1" />Previous
                </Button>
                <Button className="text-xs text-white" style={{ backgroundColor: '#002663' }} onClick={() => navigate(ROUTES.PRODUCTS.PREPAID)}>
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
