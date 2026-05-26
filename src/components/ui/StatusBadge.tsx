import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, MinusCircle, Clock, Eye } from 'lucide-react'

type StatusValue = string & {}

interface StatusConfig {
  icon: React.ElementType
  color: string
  bg: string
  border: string
  label: string
}

function getConfig(status: string): StatusConfig {
  const s = status?.toLowerCase() ?? ''
  // Green — active / success states
  if (['active', 'completed', 'approved', 'current', 'paid', 'to disburse', 'verified'].includes(s))
    return { icon: CheckCircle2, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: status }
  // Amber — warning / waiting states
  if (['pending', 'submitted', 'due soon', 'pending docs', 'pending valuation', 'verification'].includes(s))
    return { icon: AlertTriangle, color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', label: status }
  // Red — failure / overdue states
  if (['failed', 'in arrears', 'rejected', 'write-off'].includes(s))
    return { icon: XCircle, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: status }
  // Blue — in-progress states
  if (['under review', 'due'].includes(s))
    return { icon: Eye, color: '#3B5BDB', bg: '#EEF2FF', border: '#C7D2FE', label: status }
  // Gray — neutral states
  if (['reversed', 'inactive', 'closed', 'dormant', 'upcoming'].includes(s))
    return { icon: s === 'reversed' ? RefreshCw : MinusCircle, color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', label: status }
  // fallback
  return { icon: Clock, color: '#6B7280', bg: '#F9FAFB', border: '#D1D5DB', label: status }
}

interface StatusBadgeProps {
  status: StatusValue
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = getConfig(status || '')
  const Icon = cfg.icon
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px 3px 7px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'DM Sans, sans-serif',
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon style={{ width: 12, height: 12, flexShrink: 0 }} />
      {cfg.label || '—'}
    </span>
  )
}
