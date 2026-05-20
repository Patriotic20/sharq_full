import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listPermissions } from '../api/permissions'
import { getRoleWithPermissions, updateRole } from '../api/roles'
import { replaceRolePermissions } from '../api/rolePermissions'
import { PermissionGate } from '../components/PermissionGate'
import RoleModal from '../components/RoleModal'
import type { Permission } from '../types/permission'
import type { RoleUpdate, RoleWithPermissions } from '../types/role'

function groupByResource(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {}
  for (const p of permissions) {
    const [resource] = p.code.split(':')
    if (!groups[resource]) groups[resource] = []
    groups[resource].push(p)
  }
  return groups
}

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const roleId = Number(params.id)

  const [role, setRole] = useState<RoleWithPermissions | null>(null)
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [r, p] = await Promise.all([
        getRoleWithPermissions(roleId),
        listPermissions(),
      ])
      setRole(r)
      setAllPermissions(p.items)
      setSelectedIds(new Set(r.permissions.map(x => x.id)))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [roleId])

  useEffect(() => { load() }, [load])

  function toggle(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleGroup(perms: Permission[], all: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      for (const p of perms) {
        if (all) next.delete(p.id)
        else next.add(p.id)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSavedMsg('')
    try {
      const updated = await replaceRolePermissions(roleId, [...selectedIds])
      setRole(updated)
      setSavedMsg('Saqlandi')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateRole(data: RoleUpdate) {
    await updateRole(roleId, data)
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Yuklanmoqda...
      </div>
    )
  }

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-gray-500">Rol topilmadi</p>
        <button onClick={() => navigate('/roles')} className="text-sm text-primary-600 hover:underline">
          ← Rollar ro'yxatiga
        </button>
      </div>
    )
  }

  const groups = groupByResource(allPermissions)

  return (
    <div className="flex flex-col h-full bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <Link to="/roles" className="text-xs text-gray-400 hover:text-primary-600">← Rollar</Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-1">{role.name}</h1>
          {role.description && <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>}
        </div>
        <PermissionGate code="roles:write">
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Tahrirlash
          </button>
        </PermissionGate>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Ruxsatlar</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Belgilangan: {selectedIds.size} / {allPermissions.length}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {savedMsg && <span className="text-xs text-emerald-600">{savedMsg}</span>}
              <PermissionGate
                code="role_permissions:update"
                fallback={
                  <span className="text-xs text-gray-400">Saqlash uchun ruxsat yo'q</span>
                }
              >
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </PermissionGate>
            </div>
          </div>

          {error && (
            <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <div className="p-6 space-y-6">
            {Object.entries(groups).map(([resource, perms]) => {
              const allChecked = perms.every(p => selectedIds.has(p.id))
              const someChecked = perms.some(p => selectedIds.has(p.id))
              return (
                <div key={resource}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                      {resource}
                    </h3>
                    <button
                      onClick={() => toggleGroup(perms, allChecked)}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      {allChecked ? "Hammasini olib tashlash" : someChecked ? "Hammasini tanlash" : "Hammasini tanlash"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms.map(p => (
                      <label
                        key={p.id}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-primary-600"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggle(p.id)}
                        />
                        <div>
                          <p className="text-sm font-mono text-gray-900">{p.code}</p>
                          {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {editOpen && (
        <RoleModal role={role} onClose={() => setEditOpen(false)} onUpdate={handleUpdateRole} />
      )}
    </div>
  )
}
