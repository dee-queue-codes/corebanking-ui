import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { ROUTES } from '@/router/routes'

const BRAND = '#002663'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Email address is required.'); return }
    if (!password) { setError('Password is required.'); return }
    try {
      setLoading(true)
      await authService.login({ email: email.trim(), password })
      navigate(ROUTES.DASHBOARD)
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col p-14 relative overflow-hidden select-none"
        style={{ backgroundColor: BRAND }}
      >
        {/* Subtle dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Faint concentric rings — bottom right */}
        <div className="absolute -bottom-48 -right-48 w-[580px] h-[580px] rounded-full border border-white/[0.07]" />
        <div className="absolute -bottom-28 -right-28 w-[380px] h-[380px] rounded-full border border-white/[0.07]" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v6c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-4z" fill="white" />
            </svg>
          </div>
          <span className="text-white font-semibold text-base tracking-tight">Chelsea Bank</span>
        </div>

        {/* Hero copy — vertically centred in remaining space */}
        <div className="relative flex-1 flex flex-col justify-center max-w-[460px]">
          <p className="text-white/40 text-[11px] font-bold tracking-[0.22em] uppercase mb-6">
            Core Banking Platform
          </p>

          <h1
            className="text-white font-extrabold leading-[1.08] mb-7"
            style={{ fontSize: '3.6rem', letterSpacing: '-0.02em' }}
          >
            Banking built for<br />what's next.
          </h1>

          <p className="text-white/50 text-[15px] leading-[1.7] mb-12 max-w-[300px]">
            One platform to manage clients, accounts, products and compliance.
          </p>

          {/* Clean feature list */}
          <ul className="space-y-3.5">
            {[
              'Real-time transaction monitoring',
              'Multi-branch client management',
              'SOC 2 certified infrastructure',
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                <span className="text-white/55 text-[13.5px] font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-white/20 text-xs mt-auto">
          © {new Date().getFullYear()} Chelsea Bank · All rights reserved
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#f8f9fc] p-8">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v6c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-4z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-gray-900">Chelsea Bank</span>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-extrabold text-gray-900 leading-tight" style={{ fontSize: '2rem' }}>
              Sign in
            </h2>
            <p className="text-gray-400 text-sm mt-1.5 font-medium">
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@chelseabank.com"
                className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#002663] focus:ring-2 focus:ring-[#002663]/10 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <button type="button" className="text-xs font-semibold text-[#002663] hover:opacity-75 transition-opacity">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 pr-11 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#002663] focus:ring-2 focus:ring-[#002663]/10 transition-all"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: BRAND }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider hint */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Having trouble signing in?{' '}
              <button className="font-semibold text-[#002663] hover:opacity-75 transition-opacity">
                Contact support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
