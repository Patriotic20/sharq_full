import { Key, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { listRoles } from '../api/roles'
import {
  changeUserPassword,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../api/users'
import PasswordChangeModal from '../components/PasswordChangeModal'
import { PermissionGate } from '../components/PermissionGate'
import UserModal from '../components/UserModal'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import type { Role } from '../types/role'
import type { User, UserCreate, UserListResponse, UserUpdate } from '../types/user'

function SkeletonRow() {
  return (
    <tr>
      {[28, 120, 140, 80, 60, 90, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function UsersPage() {
  const [data, setData] = useState<UserListResponse | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState({ username: '', role_id: '', is_active: '' })
  const search = useDebounce(searchInput)

  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size: 10,
        username: search.username || undefined,
        role_id: search.role_id ? Number(search.role_id) : undefined,
        is_active: search.is_active === '' ? undefined : search.is_active === 'true',
      }
      const res = await listUsers(params)
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    listRoles({ size: 100 }).then(r => setRoles(r.items)).catch(() => { /* ignore */ })
  }, [])

  async function handleCreate(data: UserCreate) {
    await createUser(data)
    await load()
  }

  async function handleUpdate(data: UserUpdate) {
    if (!editUser) return
    await updateUser(editUser.id, data)
    await load()
  }

  async function handlePassword(newPassword: string) {
    if (!passwordUser) return
    await changeUserPassword(passwordUser.id, { new_password: newPassword })
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleteLoading(true)
    try { await deleteUser(deleteId); setDeleteId(null); await load() }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Foydalanuvchilar</h1>
          {!loading && data && (
            <p className="text-sm text-gray-400 mt-0.5">{data.total} ta foydalanuvchi</p>
          )}
        </div>
        <PermissionGate code="users:write">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700"
          >
            + Yangi foydalanuvchi
          </button>
        </PermissionGate>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto">

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[150px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="Foydalanuvchi nomi..."
            value={searchInput.username}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, username: e.target.value })) }}
          />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchInput.role_id}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, role_id: e.target.value })) }}
          >
            <option value="">Barcha rollar</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchInput.is_active}
            onChange={e => { setPage(1); setSearchInput(s => ({ ...s, is_active: e.target.value })) }}
          >
            <option value="">Barcha holatlar</option>
            <option value="true">Faol</option>
            <option value="false">Faol emas</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Foydalanuvchi', "To'liq ism", 'Rol', 'Holati', 'Yaratilgan', ''].map((h, i, arr) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === arr.length - 1 ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className="text-3xl">👤</span>
                      <p className="text-sm text-gray-400">Foydalanuvchilar topilmadi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map(u => (
                  <tr key={u.id} className="hover:bg-primary-50/50 group transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{u.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.username}</td>
                    <td className="px-4 py-3 text-gray-500">{u.full_name ?? <span className="text-gray-200">—</span>}</td>
                    <td className="px-4 py-3">
                      {u.role
                        ? <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">{u.role.name}</span>
                        : <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active
                        ? <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600">Faol</span>
                        : <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">Faol emas</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">
                      {new Date(u.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <PermissionGate code="users:write">
                          <IconButton
                            icon={Pencil}
                            label="Редактировать"
                            onClick={() => setEditUser(u)}
                          />
                        </PermissionGate>
                        <PermissionGate code="users:write">
                          <IconButton
                            icon={Key}
                            label="Сменить пароль"
                            onClick={() => setPasswordUser(u)}
                          />
                        </PermissionGate>
                        <PermissionGate code="users:delete">
                          <IconButton
                            icon={Trash2}
                            label="Удалить"
                            variant="danger"
                            onClick={() => setDeleteId(u.id)}
                          />
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Pagination page={page} pages={data?.pages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      {createOpen && (
        <UserModal roles={roles} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      )}
      {editUser && (
        <UserModal
          user={editUser}
          roles={roles}
          onClose={() => setEditUser(null)}
          onUpdate={handleUpdate}
        />
      )}
      {passwordUser && (
        <PasswordChangeModal
          title={`${passwordUser.username} — parolni o'zgartirish`}
          onClose={() => setPasswordUser(null)}
          onSubmit={handlePassword}
        />
      )}
      {deleteId !== null && (
        <DeleteDialog
          title="Удалить пользователя"
          description={`Удалить пользователя #${deleteId}?`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
