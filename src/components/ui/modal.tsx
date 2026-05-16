import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6', className)}>
        {title && <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  )
}
