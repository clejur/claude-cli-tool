import { useT } from '../i18n/context'

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const t = useT()

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-card p-6 w-[340px] border border-border shadow-xl">
        <p className="text-sm text-content mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-sm font-semibold text-content-muted border-2 border-border rounded-pill hover:border-primary hover:text-primary transition-all duration-200"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm text-white font-semibold rounded-pill bg-gradient-to-br from-red-500 to-red-400 shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(239,68,68,0.4)] transition-all duration-300"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
