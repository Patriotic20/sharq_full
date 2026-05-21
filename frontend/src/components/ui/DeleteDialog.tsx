interface DeleteDialogProps {
  title: string
  description: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  loadingLabel?: string
  confirmVariant?: 'danger' | 'primary'
}

export function DeleteDialog({
  title,
  description,
  loading,
  onConfirm,
  onCancel,
  confirmLabel = 'Удалить',
  loadingLabel = 'Удаление...',
  confirmVariant = 'danger',
}: DeleteDialogProps) {
  const confirmClass =
    confirmVariant === 'primary'
      ? 'bg-primary-600 hover:bg-primary-700'
      : 'bg-red-600 hover:bg-red-700'
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
