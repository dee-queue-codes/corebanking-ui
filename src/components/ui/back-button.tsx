import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  onClick: () => void
  label: string
}

export function BackButton({ onClick, label }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center mb-4 transition-colors"
      style={{
        background: '#001b4a', color: '#fff', border: 'none',
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
        letterSpacing: '0.03em', borderRadius: 8, padding: '5px 16px',
        cursor: 'pointer',
        height: 36
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#06265f')}
      onMouseLeave={e => (e.currentTarget.style.background = '#001b4a')}
    >
      <ChevronLeft className="w-3 h-3 mr-1" />
      {label}
    </button>
  )
}
