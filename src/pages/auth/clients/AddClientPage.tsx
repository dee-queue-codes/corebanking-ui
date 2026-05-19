import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, MapPin, Users, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { BackButton } from '@/components/ui/back-button'
import { ROUTES } from '@/router/routes'
import { http } from '@/services/http'
import { clientsAPI } from '@/services/clients/clientsAPI'

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'personal' | 'address' | 'family' | 'identity'

interface PersonalForm {
  firstName: string; lastName: string; middleName: string
  dateOfBirth: string; gender: string
  email: string; mobileNumber: string; alternatePhone: string
  office: string; externalId: string; isStaff: boolean
  submittedOnDate: string
}

interface AddressForm {
  addressLine1: string; addressLine2: string
  city: string; postalCode: string
}

interface FamilyForm {
  spouseFirstName: string; spouseLastName: string
  numberOfDependents: string; qualificationLevel: string
}

interface IdentityForm {
  documentType: string; documentKey: string; description: string
}

// ── Step config ───────────────────────────────────────────────────────────────

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'personal', label: 'Personal Info',   icon: User        },
  { id: 'address',  label: 'Address',         icon: MapPin      },
  { id: 'family',   label: 'Family Details',  icon: Users       },
  { id: 'identity', label: 'Identity',        icon: ShieldCheck },
]

const offices = [
  { id: 1, name: 'Headoffice'       },
  { id: 2, name: 'Kumasi Branch'    },
  { id: 3, name: 'Tema Branch'      },
  { id: 4, name: 'Takoradi Branch'  },
]
const genders    = ['Male', 'Female', 'Other', 'Prefer not to say']
const docTypes   = ['Ghana Card', 'Passport', 'Voter ID', 'Driver\'s Licence', 'SSNIT Card', 'Birth Certificate']
const qualLevels = ['None', 'Primary', 'JHS', 'SHS', 'Diploma', 'Degree', 'Postgraduate']

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddClientPage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState<Step>('personal')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [personal, setPersonal] = useState<PersonalForm>({
    firstName: '', lastName: '', middleName: '',
    dateOfBirth: '', gender: '',
    email: '', mobileNumber: '', alternatePhone: '',
    office: '', externalId: '', isStaff: false,
    submittedOnDate: new Date().toISOString().split('T')[0],
  })
  const [personalErrors, setPersonalErrors] = useState<Partial<Record<keyof PersonalForm, string>>>({})

  const [address, setAddress] = useState<AddressForm>({
    addressLine1: '', addressLine2: '', city: '', postalCode: '',
  })

  const [family, setFamily] = useState<FamilyForm>({
    spouseFirstName: '', spouseLastName: '', numberOfDependents: '', qualificationLevel: '',
  })

  const [identity, setIdentity] = useState<IdentityForm>({
    documentType: '', documentKey: '', description: '',
  })
  const [identityErrors, setIdentityErrors] = useState<Partial<Record<keyof IdentityForm, string>>>({})

  // ── Navigation ──────────────────────────────────────────────────────────────

  const stepIndex  = steps.findIndex(s => s.id === activeStep)
  const isFirst    = stepIndex === 0
  const isLast     = stepIndex === steps.length - 1

  function validatePersonal(): boolean {
    const errs: Partial<Record<keyof PersonalForm, string>> = {}
    if (!personal.firstName.trim())    errs.firstName    = 'First name is required'
    if (!personal.lastName.trim())     errs.lastName     = 'Last name is required'
    if (!personal.mobileNumber.trim()) errs.mobileNumber = 'Mobile number is required'
    if (!personal.office)              errs.office       = 'Office is required'
    if (!personal.submittedOnDate)     errs.submittedOnDate = 'Date is required'
    setPersonalErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateIdentity(): boolean {
    const errs: Partial<Record<keyof IdentityForm, string>> = {}
    if (identity.documentType && !identity.documentKey.trim()) errs.documentKey = 'ID number is required when type is selected'
    setIdentityErrors(errs)
    return Object.keys(errs).length === 0
  }

  function goNext() {
    if (activeStep === 'personal' && !validatePersonal()) return
    if (!isLast) setActiveStep(steps[stepIndex + 1].id)
  }

  function goBack() {
    if (!isFirst) setActiveStep(steps[stepIndex - 1].id)
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateIdentity()) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await http.post('/clients', {
        firstName:       personal.firstName.trim(),
        lastName:        personal.lastName.trim(),
        middleName:      personal.middleName.trim() || undefined,
        dateOfBirth:     personal.dateOfBirth || undefined,
        gender:          personal.gender     || undefined,
        emailAddress:    personal.email.trim() || undefined,
        mobileNo:        personal.mobileNumber.trim(),
        alternatePhone:  personal.alternatePhone.trim() || undefined,
        officeId:        Number(personal.office),
        externalId:      personal.externalId.trim() || undefined,
        isStaff:         personal.isStaff,
        submittedOnDate: personal.submittedOnDate,
        family:          family.spouseFirstName ? family : undefined,
        identity:        identity.documentType  ? identity : undefined,
      })

      // Create residential address separately (backend doesn't accept it in the client body)
      const clientData = (res.data as Record<string, unknown>)
      const newClientId = String(
        (clientData.data as Record<string, unknown>)?.clientId ??
        (clientData.data as Record<string, unknown>)?.id ??
        clientData.clientId ?? clientData.id ?? ''
      )
      if (address.addressLine1.trim() && newClientId) {
        await clientsAPI.createAddress(newClientId, {
          addressLine1: address.addressLine1.trim(),
          addressLine2: address.addressLine2.trim() || undefined,
          city:         address.city.trim() || undefined,
          postalCode:   address.postalCode.trim() || undefined,
        }, { _skipAuthRedirect: true, params: { addressTypeId: 1 } })
      }

      navigate(ROUTES.CLIENTS.LIST)
    } catch {
      setSubmitError('Failed to create client. Please check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Field helpers ───────────────────────────────────────────────────────────

  function pField(key: keyof PersonalForm) {
    return {
      value: personal[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setPersonal(p => ({ ...p, [key]: e.target.value }))
        if (personalErrors[key]) setPersonalErrors(p => ({ ...p, [key]: undefined }))
      },
    }
  }

  function aField(key: keyof AddressForm) {
    return {
      value: address[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAddress(p => ({ ...p, [key]: e.target.value })),
    }
  }

  function fField(key: keyof FamilyForm) {
    return {
      value: family[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFamily(p => ({ ...p, [key]: e.target.value })),
    }
  }

  // ── Render steps ────────────────────────────────────────────────────────────

  const renderPersonal = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Field label="First Name" required error={personalErrors.firstName}>
          <Input {...pField('firstName')} placeholder="e.g. Kofi" className={inputCls(!!personalErrors.firstName)} />
        </Field>
        <Field label="Middle Name">
          <Input {...pField('middleName')} placeholder="Optional" className={inputCls()} />
        </Field>
        <Field label="Last Name" required error={personalErrors.lastName}>
          <Input {...pField('lastName')} placeholder="e.g. Mensah" className={inputCls(!!personalErrors.lastName)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Birth">
          <Input type="date" {...pField('dateOfBirth')} className={inputCls()} />
        </Field>
        <Field label="Gender">
          <Select value={personal.gender} onValueChange={v => setPersonal(p => ({ ...p, gender: v }))}>
            <SelectTrigger className={inputCls()}><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>{genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Mobile Number" required error={personalErrors.mobileNumber}>
          <Input {...pField('mobileNumber')} placeholder="+233 24 000 0000" className={inputCls(!!personalErrors.mobileNumber)} />
        </Field>
        <Field label="Alternate Phone">
          <Input {...pField('alternatePhone')} placeholder="Optional" className={inputCls()} />
        </Field>
      </div>

      <Field label="Email Address">
        <Input type="email" {...pField('email')} placeholder="e.g. kofi@example.com" className={inputCls()} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Office / Branch" required error={personalErrors.office}>
          <Select value={personal.office} onValueChange={v => { setPersonal(p => ({ ...p, office: v })); setPersonalErrors(e => ({ ...e, office: undefined })) }}>
            <SelectTrigger className={inputCls(!!personalErrors.office)}><SelectValue placeholder="Select office" /></SelectTrigger>
            <SelectContent>{offices.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="External ID">
          <Input {...pField('externalId')} placeholder="Optional" className={inputCls()} />
        </Field>
      </div>

      <Field label="Submitted On Date" required error={personalErrors.submittedOnDate}>
        <Input type="date" {...pField('submittedOnDate')} className={inputCls(!!personalErrors.submittedOnDate)} />
      </Field>

      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="isStaff"
          checked={personal.isStaff}
          onCheckedChange={v => setPersonal(p => ({ ...p, isStaff: !!v }))}
        />
        <Label htmlFor="isStaff" className="text-sm text-gray-700 cursor-pointer">This client is a staff member</Label>
      </div>
    </div>
  )

  const renderAddress = () => (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">All address fields are optional.</p>
      <Field label="Address Line 1">
        <Input {...aField('addressLine1')} placeholder="Street address" className={inputCls()} />
      </Field>
      <Field label="Address Line 2">
        <Input {...aField('addressLine2')} placeholder="Apartment, suite, etc." className={inputCls()} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City / Town">
          <Input {...aField('city')} placeholder="e.g. Accra" className={inputCls()} />
        </Field>
        <Field label="Postal / Digital Address">
          <Input {...aField('postalCode')} placeholder="e.g. GA-123-4567" className={inputCls()} />
        </Field>
      </div>
    </div>
  )

  const renderFamily = () => (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">All family fields are optional.</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Spouse First Name">
          <Input {...fField('spouseFirstName')} placeholder="Optional" className={inputCls()} />
        </Field>
        <Field label="Spouse Last Name">
          <Input {...fField('spouseLastName')} placeholder="Optional" className={inputCls()} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Number of Dependents">
          <Input
            type="number"
            min="0"
            value={family.numberOfDependents}
            onChange={e => setFamily(p => ({ ...p, numberOfDependents: e.target.value }))}
            placeholder="0"
            className={inputCls()}
          />
        </Field>
        <Field label="Qualification Level">
          <Select value={family.qualificationLevel} onValueChange={v => setFamily(p => ({ ...p, qualificationLevel: v }))}>
            <SelectTrigger className={inputCls()}><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>{qualLevels.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )

  const renderIdentity = () => (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">All identity fields are optional. If a document type is selected, an ID number is required.</p>
      <Field label="Document Type">
        <Select
          value={identity.documentType}
          onValueChange={v => { setIdentity(p => ({ ...p, documentType: v })); setIdentityErrors({}) }}
        >
          <SelectTrigger className={inputCls()}><SelectValue placeholder="Select document type" /></SelectTrigger>
          <SelectContent>{docTypes.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="ID Number" error={identityErrors.documentKey}>
        <Input
          value={identity.documentKey}
          onChange={e => { setIdentity(p => ({ ...p, documentKey: e.target.value })); setIdentityErrors({}) }}
          placeholder="e.g. GHA-123456789-0"
          className={inputCls(!!identityErrors.documentKey)}
        />
      </Field>
      <Field label="Description">
        <Input
          value={identity.description}
          onChange={e => setIdentity(p => ({ ...p, description: e.target.value }))}
          placeholder="Optional note about this document"
          className={inputCls()}
        />
      </Field>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}
    </div>
  )

  // ── Main ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-7 bg-[#f8f9fc] min-h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <BackButton onClick={() => navigate(ROUTES.CLIENTS.LIST)} label="Back to Clients" />

      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Add New Client</h1>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">Complete the form to register a new client</p>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-6 items-start">

        {/* Step sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Steps</p>
          <div className="space-y-1">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const isCurrent  = step.id === activeStep
              const isDone     = idx < stepIndex
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (idx < stepIndex) setActiveStep(step.id)
                    else if (idx === stepIndex + 1 && activeStep === 'personal') {
                      if (validatePersonal()) setActiveStep(step.id)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isCurrent ? 'bg-[#002663] text-white' :
                    isDone    ? 'text-gray-700 hover:bg-gray-50' :
                                'text-gray-400 cursor-default'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                    isCurrent ? 'bg-white/20 text-white' :
                    isDone    ? 'bg-emerald-100 text-emerald-600' :
                                'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-white' : isDone ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</p>
                  </div>
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? 'text-white/70' : isDone ? 'text-emerald-400' : 'text-gray-300'}`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#002663]/10 flex items-center justify-center">
              {(() => { const Icon = steps[stepIndex].icon; return <Icon className="w-4.5 h-4.5 text-[#002663]" /> })()}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{steps[stepIndex].label}</h2>
              <p className="text-xs text-gray-400">Step {stepIndex + 1} of {steps.length}</p>
            </div>
          </div>

          {activeStep === 'personal'  && renderPersonal()}
          {activeStep === 'address'   && renderAddress()}
          {activeStep === 'family'    && renderFamily()}
          {activeStep === 'identity'  && renderIdentity()}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={isFirst ? () => navigate(ROUTES.CLIENTS.LIST) : goBack}
              className="text-xs px-5"
            >
              {isFirst ? 'Cancel' : 'Back'}
            </Button>
            {isLast ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="text-xs px-6 text-white"
                style={{ backgroundColor: '#002663' }}
              >
                {submitting ? 'Saving...' : 'Create Client'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                className="text-xs px-6 text-white"
                style={{ backgroundColor: '#002663' }}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function inputCls(hasError = false) {
  return `bg-gray-50 border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${hasError ? 'border-red-400 bg-red-50' : ''}`
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
