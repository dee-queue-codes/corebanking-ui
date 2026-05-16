import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DropdownItem {
  label: string
  onClick: () => void
  disabled?: boolean
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  className?: string
}

export function Dropdown({ trigger, items, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn('relative inline-block', className)}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            {items.map((item, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => { item.onClick(); setOpen(false) }}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
