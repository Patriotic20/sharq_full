import { useState } from 'react'
import { changeUserPassword } from '../api/users'
import PasswordChangeModal from '../components/PasswordChangeModal'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, permissions } = useAuth()
  const [passwordOpen, setPasswordOpen] = useState(false)

  if (!user) return null

  async function handlePassword(newPassword: string) {
    if (!user) return
    await changeUserPassword(user.id, { new_password: newPassword })
  }

  const sortedPerms = [...permissions].sort()

  return (
    <div className="flex flex-col h-full bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-gray-900">Profil</h1>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl space-y-4">

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Foydalanuvchi ma'lumotlari</h2>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-400">Foydalanuvchi nomi</dt>
                <dd className="font-medium text-gray-900">{user.username}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-400">To'liq ism</dt>
                <dd className="font-medium text-gray-900">{user.full_name ?? '—'}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-400">Rol</dt>
                <dd>
                  {user.role
                    ? <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">{user.role.name}</span>
                    : <span className="text-gray-200">—</span>}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-400">Holati</dt>
                <dd>
                  {user.is_active
                    ? <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">Faol</span>
                    : <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">Faol emas</span>}
                </dd>
              </div>
            </dl>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <button
                onClick={() => setPasswordOpen(true)}
                className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700"
              >
                Parolni o'zgartirish
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Ruxsatlar ({sortedPerms.length})</h2>
            {sortedPerms.length === 0 ? (
              <p className="text-sm text-gray-400">Ruxsatlar yo'q</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedPerms.map(p => (
                  <span key={p} className="text-xs font-mono px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {passwordOpen && (
        <PasswordChangeModal
          title="Parolimni o'zgartirish"
          onClose={() => setPasswordOpen(false)}
          onSubmit={handlePassword}
        />
      )}
    </div>
  )
}
