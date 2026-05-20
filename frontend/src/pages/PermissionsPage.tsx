import { useEffect, useMemo, useState } from 'react'
import { listPermissions } from '../api/permissions'
import type { Permission } from '../types/permission'

const GROUP_LABELS: Record<string, string> = {
  users: 'Foydalanuvchilar',
  roles: 'Rollar',
  permissions: 'Ruxsatlar',
  role_permissions: 'Rol ruxsatlari',
  employees: 'Xodimlar',
  attendances: 'Davomat',
  cameras: 'Kameralar',
  work_schedules: 'Ish jadvali',
}

function SkeletonGroup() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex items-center gap-4">
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PermissionsPage() {
  const [items, setItems] = useState<Permission[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    listPermissions()
      .then(res => { if (!cancelled) setItems(res.items) })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const groups = useMemo(() => {
    if (!items) return []
    const map = new Map<string, Permission[]>()
    for (const p of items) {
      const key = p.code.split(':')[0] ?? 'other'
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    return Array.from(map.entries()).map(([key, perms]) => ({
      key,
      label: GROUP_LABELS[key] ?? key,
      perms: perms.sort((a, b) => a.code.localeCompare(b.code)),
    })).sort((a, b) => a.label.localeCompare(b.label))
  }, [items])

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ruxsatlar</h1>
          {!loading && items && (
            <p className="text-sm text-gray-400 mt-0.5">{items.length} ta ruxsat</p>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {error && (
          <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">{error}</div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonGroup key={i} />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-16 text-center">
            <div className="inline-flex flex-col items-center gap-2">
              <span className="text-3xl">🛡️</span>
              <p className="text-sm text-gray-400">Ruxsatlar topilmadi</p>
            </div>
          </div>
        ) : (
          groups.map(g => (
            <div key={g.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">{g.label}</h2>
                <span className="text-xs text-gray-400">{g.perms.length} ta</span>
              </div>
              <div className="divide-y divide-gray-50">
                {g.perms.map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center gap-6 hover:bg-primary-50/50 transition-colors">
                    <code className="text-xs font-mono text-primary-700 bg-primary-50 px-2 py-1 rounded-md flex-shrink-0">
                      {p.code}
                    </code>
                    <span className="text-sm text-gray-600">
                      {p.description ?? <span className="text-gray-300">—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
