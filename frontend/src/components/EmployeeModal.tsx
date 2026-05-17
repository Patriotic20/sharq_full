import { useEffect, useState } from 'react'
import type { Employee, EmployeeUpdate } from '../types/employee'

interface Props {
  employee: Employee
  onClose: () => void
  onSubmit: (data: EmployeeUpdate) => Promise<void>
}

export default function EmployeeModal({ employee, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({ first_name: '', last_name: '', middle_name: '', camera_user_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      first_name:     employee.first_name,
      last_name:      employee.last_name,
      middle_name:    employee.middle_name,
      camera_user_id: employee.camera_user_id ?? '',
    })
  }, [employee])

  const set = (field: keyof typeof form, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: EmployeeUpdate = {
        first_name:     form.first_name     || undefined,
        last_name:      form.last_name      || undefined,
        middle_name:    form.middle_name    || undefined,
        camera_user_id: form.camera_user_id || null,
      }
      await onSubmit(payload)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">Xodimni tahrirlash</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Ism</label>
            <input className={fieldClass} value={form.first_name}
              onChange={e => set('first_name', e.target.value)} required />
          </div>

          <div>
            <label className={labelClass}>Familiya</label>
            <input className={fieldClass} value={form.last_name}
              onChange={e => set('last_name', e.target.value)} required />
          </div>

          <div>
            <label className={labelClass}>Otasining ismi</label>
            <input className={fieldClass} value={form.middle_name}
              onChange={e => set('middle_name', e.target.value)} required />
          </div>

          <div>
            <label className={labelClass}>
              Kamera foydalanuvchi ID
              <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
            </label>
            <input className={fieldClass} value={form.camera_user_id}
              onChange={e => set('camera_user_id', e.target.value)}
              placeholder="Bo'sh qoldirsa o'chiriladi" />
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
