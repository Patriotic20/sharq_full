import { useState } from 'react'

const fieldClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

interface Props {
  title?: string
  onClose: () => void
  onSubmit: (newPassword: string) => Promise<void>
}

export default function PasswordChangeModal({ title = 'Parolni o\'zgartirish', onClose, onSubmit }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Parollar mos kelmaydi')
      return
    }
    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
      return
    }
    setLoading(true)
    try {
      await onSubmit(password)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Yangi parol</label>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className={labelClass}>Parolni tasdiqlash</label>
            <input
              type="password"
              className={fieldClass}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
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
