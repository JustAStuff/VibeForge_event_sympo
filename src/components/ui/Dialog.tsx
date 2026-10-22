import { cn } from '@/lib/utils'
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { type ReactNode } from 'react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md bg-vf-surface border border-vf-border rounded-2xl shadow-2xl animate-slide-up',
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-vf-border">
          <h2 id="dialog-title" className="text-lg font-semibold text-vf-text">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-vf-text-muted hover:text-vf-text hover:bg-vf-surface-2 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const confirmClasses = {
    default: 'bg-vf-violet hover:bg-vf-violet-light text-white',
    danger: 'bg-red-700 hover:bg-red-600 text-white',
    warning: 'bg-yellow-700 hover:bg-yellow-600 text-white',
  }

  const icon = {
    default: <Info className="w-5 h-5 text-vf-violet" />,
    danger: <AlertTriangle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-md bg-vf-surface border border-vf-border rounded-2xl shadow-2xl animate-slide-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mt-0.5">{icon[variant]}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-vf-text mb-2">{title}</h3>
              <div className="text-sm text-vf-text-2">{message}</div>
            </div>
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-vf-text-2 bg-vf-surface-2 border border-vf-border rounded-lg hover:bg-vf-surface-3 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2',
                confirmClasses[variant]
              )}
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: ReactNode
  className?: string
}

export function Alert({ type, title, children, className }: AlertProps) {
  const styles = {
    info: { bg: 'bg-blue-900/20 border-blue-700', text: 'text-blue-400', icon: <Info className="w-5 h-5" /> },
    success: { bg: 'bg-green-900/20 border-green-700', text: 'text-green-400', icon: <CheckCircle className="w-5 h-5" /> },
    warning: { bg: 'bg-yellow-900/20 border-yellow-700', text: 'text-yellow-400', icon: <AlertTriangle className="w-5 h-5" /> },
    error: { bg: 'bg-red-900/20 border-red-700', text: 'text-red-400', icon: <AlertTriangle className="w-5 h-5" /> },
  }
  const s = styles[type]
  return (
    <div className={cn(`border rounded-xl p-4 ${s.bg}`, className)}>
      <div className="flex items-start gap-3">
        <span className={s.text}>{s.icon}</span>
        <div>
          {title && <p className={`font-semibold text-sm ${s.text} mb-1`}>{title}</p>}
          <div className="text-sm text-vf-text-2">{children}</div>
        </div>
      </div>
    </div>
  )
}
