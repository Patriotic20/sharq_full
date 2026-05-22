import { useEffect, useState } from 'react'
import type { Position, PositionCreate, PositionUpdate } from '../types/position'

const fieldClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

interface Props {
  position?: Position | null
  onClose: () => void
  onCreate?: (data: PositionCreate) => Promise<void>
  onUpdate?: (data: PositionUpdate) => Promise<void>
}

export default function PositionModal({ position, onClose, onCreate, onUpdate }: Props) {
  const isEdit = !!position
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(position?.name ?? '')
  }, [position])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { name: name.trim() }
      if (isEdit && onUpdate) await onUpdate(payload)
      else if (!isEdit && onCreate) await onCreate(payload)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {isEdit ? 'Lavozimni tahrirlash' : 'Yangi lavozim'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nomi</label>
            <input
              className={fieldClass}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={1}
              maxLength={150}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
