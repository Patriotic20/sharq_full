import { useEffect, useState } from 'react'
import type { Role } from '../types/role'
import type { User, UserCreate, UserUpdate } from '../types/user'

const fieldClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

interface Props {
  user?: User | null
  roles: Role[]
  onClose: () => void
  onCreate?: (data: UserCreate) => Promise<void>
  onUpdate?: (data: UserUpdate) => Promise<void>
}

export default function UserModal({ user, roles, onClose, onCreate, onUpdate }: Props) {
  const isEdit = !!user
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    is_active: true,
    role_id: null as number | null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        password: '',
        full_name: user.full_name ?? '',
        is_active: user.is_active,
        role_id: user.role_id,
      })
    } else {
      setForm({ username: '', password: '', full_name: '', is_active: true, role_id: null })
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit && onUpdate) {
        await onUpdate({
          username: form.username.trim() || undefined,
          full_name: form.full_name.trim() || null,
          is_active: form.is_active,
          role_id: form.role_id,
        })
      } else if (!isEdit && onCreate) {
        await onCreate({
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name.trim() || null,
          is_active: form.is_active,
          role_id: form.role_id,
        })
      }
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
          {isEdit ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Foydalanuvchi nomi</label>
            <input
              className={fieldClass}
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          {!isEdit && (
            <div>
              <label className={labelClass}>Parol</label>
              <input
                type="password"
                className={fieldClass}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>
              To'liq ism <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
            </label>
            <input
              className={fieldClass}
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              maxLength={150}
            />
          </div>

          <div>
            <label className={labelClass}>Rol</label>
            <select
              className={fieldClass}
              value={form.role_id ?? ''}
              onChange={e =>
                setForm(f => ({ ...f, role_id: e.target.value ? Number(e.target.value) : null }))
              }
            >
              <option value="">— Rol tanlanmagan —</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary-600"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Faol</span>
          </label>

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
