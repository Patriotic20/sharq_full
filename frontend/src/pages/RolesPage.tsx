import { Eye, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRole, deleteRole, listRoles } from '../api/roles'
import { PermissionGate } from '../components/PermissionGate'
import RoleModal from '../components/RoleModal'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import type { RoleCreate, RoleListResponse } from '../types/role'

function SkeletonRow() {
  return (
    <tr>
      {[28, 120, 240, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function RolesPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<RoleListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listRoles({ page, size: 10 })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  async function handleCreate(data: RoleCreate) {
    await createRole(data)
    await load()
  }

  async function handleDelete() {
    if (deleteId === null) return
    setDeleteLoading(true)
    try { await deleteRole(deleteId); setDeleteId(null); await load() }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Rollar</h1>
          {!loading && data && (
            <p className="text-sm text-gray-400 mt-0.5">{data.total} ta rol</p>
          )}
        </div>
        <PermissionGate code="roles:write">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700"
          >
            + Yangi rol
          </button>
        </PermissionGate>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto">

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Nomi', 'Tavsif', ''].map((h, i, arr) => (
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
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2">
                      <span className="text-3xl">🛡️</span>
                      <p className="text-sm text-gray-400">Rollar topilmadi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/roles/${r.id}`)}
                    className="hover:bg-primary-50/50 group transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 group-hover:text-primary-600">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.description ?? <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        <IconButton
                          icon={Eye}
                          label="Просмотр"
                          to={`/roles/${r.id}`}
                        />
                        <PermissionGate code="roles:delete">
                          <IconButton
                            icon={Trash2}
                            label="Удалить"
                            variant="danger"
                            onClick={() => setDeleteId(r.id)}
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
        <RoleModal onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      )}
      {deleteId !== null && (
        <DeleteDialog
          title="Удалить роль"
          description={`Удалить роль #${deleteId}?`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
