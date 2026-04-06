import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirmar', loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
        </div>
        <div className="flex gap-3 w-full pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border-medium)] bg-[var(--bg-page)]/50 hover:bg-[var(--border-zinc)]/50 text-[var(--text-secondary)] text-sm py-2 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-50 text-[var(--text-primary)] text-sm font-medium py-2 transition-colors"
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
