import { useEffect, useState } from 'react'
import type { Camera, CameraCreate, CameraType, CameraUpdate } from '../types/camera'

interface Props {
  camera?: Camera
  onClose: () => void
  onSubmit: (data: CameraCreate | CameraUpdate) => Promise<void>
}

const EMPTY: { ip_address: string; login: string; password: string; type: CameraType } = {
  ip_address: '', login: '', password: '', type: 'enter',
}

const IP_RE = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/

function validateIp(value: string): string {
  if (!value) return ''
  if (!IP_RE.test(value)) return "To'g'ri IPv4 manzil kiriting (masalan: 192.168.1.100)"
  return ''
}

export default function CameraModal({ camera, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [ipError, setIpError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (camera) setForm({ ip_address: camera.ip_address, login: camera.login, password: '', type: camera.type })
  }, [camera])

  function handleIpChange(value: string) {
    setForm(f => ({ ...f, ip_address: value }))
    setIpError(validateIp(value))
  }

  const set = (field: keyof typeof EMPTY, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ipValidation = validateIp(form.ip_address)
    if (ipValidation) { setIpError(ipValidation); return }
    setError('')
    setLoading(true)
    try {
      const payload = camera
        ? Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
        : form
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
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {camera ? 'Kamerani tahrirlash' : "Kamera qo'shish"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>IP Manzil</label>
            <input
              className={`w-full border rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 transition-colors ${
                ipError ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-primary-500 focus:bg-white'
              }`}
              value={form.ip_address}
              onChange={e => handleIpChange(e.target.value)}
              placeholder="192.168.1.100"
              required={!camera}
            />
            {ipError && <p className="mt-1 text-xs text-red-600">{ipError}</p>}
          </div>

          <div>
            <label className={labelClass}>Login</label>
            <input className={fieldClass} value={form.login} onChange={e => set('login', e.target.value)}
              placeholder="admin" required={!camera} />
          </div>

          <div>
            <label className={labelClass}>
              Parol
              {camera && <span className="text-gray-400 font-normal ml-1">(bo'sh qoldirsa o'zgarmaydi)</span>}
            </label>
            <input type="password" className={fieldClass} value={form.password}
              onChange={e => set('password', e.target.value)} placeholder="••••••••" required={!camera} />
          </div>

          <div>
            <label className={labelClass}>Tur</label>
            <select className={fieldClass} value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="enter">Kirish</option>
              <option value="exit">Chiqish</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
              Bekor qilish
            </button>
            <button type="submit" disabled={loading || !!ipError}
              className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
