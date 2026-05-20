import { Eye, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../api/department'
import DepartmentModal from '../components/DepartmentModal'
import { PermissionGate } from '../components/PermissionGate'
import { DeleteDialog } from '../components/ui/DeleteDialog'
import { IconButton } from '../components/ui/IconButton'
import { Pagination } from '../components/ui/Pagination'
import { useDebounce } from '../hooks/useDebounce'
import type {
  Department,
  DepartmentCreate,
  DepartmentListResponse,
  DepartmentUpdate,
} from '../types/department'

function SkeletonRow() {
  return (
    <tr>
      {[28, 180, 80, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

export default function DepartmentsPage() {
  const [data, setData] = useState<DepartmentListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput)

  const [createOpen, setCreateOpen] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [deleteDept, setDeleteDept] = useState<Department | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await listDepartments({ page, size: 10, name: search || undefined })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { load() }, [load])

  async function handleCreate(payload: DepartmentCreate) {
    await createDepartment(payload)
    await load()
  }

  async function handleUpdate(payload: DepartmentUpdate) {
    if (!editDept) return
    await updateDepartment(editDept.id, payload)
    await load()
  }

  async function handleDelete() {
    if (!deleteDept) return
    setDeleteLoading(true)
    try {
      await deleteDepartment(deleteDept.id)
      setDeleteDept(null)
      await load()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bo'limlar</h1>
          {!loading && data && (
            <p className="text-sm text-gray-400 mt-0.5">{data.total} ta bo'lim</p>
          )}
        </div>
        <PermissionGate code="departments:write">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-primary-600 text-white hover:bg-primary-700"
          >
            + Yangi bo'lim
          </button>
        </PermissionGate>
      </div>

      <div className="flex-1 p-6 space-y-4 overflow-auto">

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full max-w-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            placeholder="Nom bo'yicha qidirish..."
            value={searchInput}
            onChange={e => { setPage(1); setSearchInput(e.target.value) }}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Nomi', 'Xodimlar', ''].map((h, i, arr) => (
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
                      <span className="text-3xl">🏢</span>
                      <p className="text-sm text-gray-400">Bo'limlar topilmadi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.items.map(d => (
                  <tr key={d.id} className="hover:bg-primary-50/50 group transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{d.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <Link to={`/bolimlar/${d.id}`} className="hover:text-primary-600">{d.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 tabular-nums">{d.employees_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <IconButton
                          icon={Eye}
                          label="Просмотр"
                          to={`/bolimlar/${d.id}`}
                        />
                        <PermissionGate code="departments:update">
                          <IconButton
                            icon={Pencil}
                            label="Редактировать"
                            onClick={() => setEditDept(d)}
                          />
                        </PermissionGate>
                        <PermissionGate code="departments:delete">
                          <IconButton
                            icon={Trash2}
                            label="Удалить"
                            variant="danger"
                            onClick={() => setDeleteDept(d)}
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
        <DepartmentModal onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      )}
      {editDept && (
        <DepartmentModal
          department={editDept}
          onClose={() => setEditDept(null)}
          onUpdate={handleUpdate}
        />
      )}
      {deleteDept && (
        <DeleteDialog
          title="Удалить отдел"
          description={`Удалить отдел "${deleteDept.name}"? Сотрудники не будут удалены, но потеряют привязку к отделу.`}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteDept(null)}
        />
      )}
    </div>
  )
}
