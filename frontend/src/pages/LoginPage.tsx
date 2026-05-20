import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const fieldClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"

interface LocationState {
  from?: { pathname?: string }
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    const target = (location.state as LocationState | null)?.from?.pathname ?? '/davomat'
    return <Navigate to={target} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kirish amalga oshmadi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">

        <div className="flex flex-col items-center gap-3 mb-6">
          <img
            src="/logo.png"
            alt="Sharq Universiteti"
            className="w-16 h-16 rounded-2xl object-contain"
          />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Sharq Universiteti</h1>
            <p className="text-xs text-gray-500 mt-0.5">Xodimlar monitoringi</p>
            <p className="text-xs text-gray-400 mt-1">Tizimga kirish</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Foydalanuvchi nomi</label>
            <input
              className={fieldClass}
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div>
            <label className={labelClass}>Parol</label>
            <input
              type="password"
              className={fieldClass}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>

      </div>
    </div>
  )
}
